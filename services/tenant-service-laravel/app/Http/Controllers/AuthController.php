<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Auth\BootstrapPlatformAdminRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\LogoutRequest;
use App\Http\Requests\Auth\RefreshTokenRequest;
use App\Http\Resources\AuthUserResource;
use App\Repositories\UserRepository;
use App\Services\Auth\JwtService;
use App\Services\Auth\RefreshTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Throwable;

final class AuthController extends Controller
{
    public function bootstrapPlatformAdmin(
        BootstrapPlatformAdminRequest $request,
        UserRepository $userRepository
    ): JsonResponse {
        if (!app()->environment(['local', 'testing'])) {
            return response()->json([
                'error' => 'Bootstrap endpoint is available only in local environment.',
            ], 403);
        }

        if ($userRepository->existsPlatformAdmin()) {
            return response()->json([
                'error' => 'A platform admin already exists.',
            ], 409);
        }

        $user = $userRepository->createPlatformAdmin(
            (string) $request->validated('email'),
            Hash::make((string) $request->validated('password'))
        );

        return response()->json([
            'message' => 'Platform admin created successfully.',
            'user' => (new AuthUserResource($user))->resolve(),
        ], 201);
    }

    public function login(
        LoginRequest $request,
        UserRepository $userRepository,
        JwtService $jwtService,
        RefreshTokenService $refreshTokenService
    ): JsonResponse {
        $email = Str::lower(trim((string) $request->validated('email')));
        $password = (string) $request->validated('password');

        $user = $userRepository->findByEmail($email);
        if ($user === null || !Hash::check($password, (string) $user->password)) {
            return response()->json([
                'error' => 'Invalid credentials.',
            ], 401);
        }

        try {
            $session = $this->issueSessionTokens(
                $user,
                $jwtService,
                $refreshTokenService
            );
        } catch (Throwable $exception) {
            return response()->json([
                'error' => 'Token generation failed.',
            ], 500);
        }

        return response()->json([
            'access_token' => $session['access_token'],
            'refresh_token' => $session['refresh_token'],
            'expires_in' => $session['expires_in'],
            'refresh_expires_in' => $session['refresh_expires_in'],
            'user' => (new AuthUserResource($user))->resolve(),
        ]);
    }

    public function refresh(
        RefreshTokenRequest $request,
        UserRepository $userRepository,
        JwtService $jwtService,
        RefreshTokenService $refreshTokenService
    ): JsonResponse {
        $incomingRefreshToken = (string) $request->validated('refresh_token');
        $refreshTokenRecord = $refreshTokenService->findActive($incomingRefreshToken);

        if ($refreshTokenRecord === null) {
            return response()->json([
                'error' => 'Invalid refresh token.',
            ], 401);
        }

        $user = $userRepository->findById((string) $refreshTokenRecord->user_id);
        if ($user === null) {
            $refreshTokenService->revokeById((string) $refreshTokenRecord->id);

            return response()->json([
                'error' => 'Invalid refresh token.',
            ], 401);
        }

        try {
            $session = $this->issueSessionTokens(
                $user,
                $jwtService,
                $refreshTokenService
            );
            $refreshTokenService->revokeById((string) $refreshTokenRecord->id);
        } catch (Throwable $exception) {
            return response()->json([
                'error' => 'Token refresh failed.',
            ], 500);
        }

        return response()->json([
            'access_token' => $session['access_token'],
            'refresh_token' => $session['refresh_token'],
            'expires_in' => $session['expires_in'],
            'refresh_expires_in' => $session['refresh_expires_in'],
            'user' => (new AuthUserResource($user))->resolve(),
        ]);
    }

    public function logout(
        LogoutRequest $request,
        RefreshTokenService $refreshTokenService
    ): JsonResponse {
        $claims = request()->attributes->get('auth_claims');
        if (!is_array($claims)) {
            return response()->json([
                'error' => 'Unauthorized.',
            ], 401);
        }

        $userId = (string) ($claims['sub'] ?? '');
        if ($userId === '') {
            return response()->json([
                'error' => 'Unauthorized.',
            ], 401);
        }

        $refreshToken = trim((string) ($request->validated('refresh_token') ?? ''));

        if ($refreshToken !== '') {
            $refreshTokenService->revokeForUserToken($userId, $refreshToken);
        } else {
            $refreshTokenService->revokeAllForUser($userId);
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function me(UserRepository $userRepository): JsonResponse
    {
        $claims = request()->attributes->get('auth_claims');
        if (!is_array($claims)) {
            return response()->json([
                'error' => 'Unauthorized.',
            ], 401);
        }

        $userId = (string) ($claims['sub'] ?? '');
        if ($userId === '') {
            return response()->json([
                'error' => 'Unauthorized.',
            ], 401);
        }

        $user = $userRepository->findById($userId);
        if ($user === null) {
            return response()->json([
                'error' => 'Unauthorized.',
            ], 401);
        }

        return response()->json([
            'user' => (new AuthUserResource($user))->resolve(),
        ]);
    }

    private function issueSessionTokens(
        object $user,
        JwtService $jwtService,
        RefreshTokenService $refreshTokenService
    ): array {
        $access = $jwtService->issueAccessToken([
            'id' => (string) $user->id,
            'role' => (string) $user->role,
            'tenant_id' => $user->tenant_id,
        ]);

        $refresh = $refreshTokenService->issue((string) $user->id);

        return [
            'access_token' => $access['token'],
            'refresh_token' => $refresh['token'],
            'expires_in' => $access['expires_in'],
            'refresh_expires_in' => $refresh['expires_in'],
        ];
    }
}
