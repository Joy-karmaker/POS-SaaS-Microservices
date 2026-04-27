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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
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

        $username = Str::lower(trim((string) $request->validated('username')));
        if (!in_array($username, ['superadmin', 'super.admin'], true)) {
            return response()->json([
                'error' => 'Platform admin username must be "superadmin" or "super.admin".',
            ], 422);
        }

        if ($userRepository->existsPlatformAdmin()) {
            return response()->json([
                'error' => 'A platform admin already exists.',
            ], 409);
        }

        $user = $userRepository->createPlatformAdmin(
            $username,
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
        $username = Str::lower(trim((string) $request->validated('username')));
        $password = (string) $request->validated('password');
        $tenantId = trim((string) $request->validated('tenant_id'));

        $throttleKey = 'login_attempts:' . request()->ip() . ':' . $tenantId . ':' . $username;

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'error' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ], 429);
        }

        $user = null;
        $resolvedTenantId = $tenantId !== '' ? $tenantId : null;

        // If tenantId is provided but is not a UUID, it might be a slug (shop name)
        if ($resolvedTenantId !== null && !Str::isUuid($resolvedTenantId)) {
            $tenant = DB::connection('mysql')->table('tenants')
                ->whereRaw("LOWER(REPLACE(name, ' ', '')) = ?", [Str::lower(trim($resolvedTenantId))])
                ->orWhere('id', trim($resolvedTenantId))
                ->first();
            
            if ($tenant) {
                $resolvedTenantId = (string) $tenant->id;
            }
        }

        $user = $userRepository->findByUsername($username, $resolvedTenantId);
        
        // If not found with the stripped username, try the full username (backwards compatibility or convention)
        if ($user === null && $resolvedTenantId !== null && !str_contains($username, '.')) {
            // Try prefixing the username with the tenant name/slug if we resolved it
            $tenant = DB::connection('mysql')->table('tenants')->where('id', $resolvedTenantId)->first();
            if ($tenant) {
                $prefix = Str::slug($tenant->name, '');
                $user = $userRepository->findByUsername($prefix . '.' . $username, $resolvedTenantId);
            }
        }

        if ($user === null || !Hash::check($password, (string) $user->password)) {
            RateLimiter::hit($throttleKey, 60);
            return response()->json([
                'error' => 'Invalid credentials.',
            ], 401);
        }

        RateLimiter::clear($throttleKey);

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
            'access_token' => $session['access_token'], // Keeping in response for backwards compatibility if needed
            'refresh_token' => $session['refresh_token'],
            'expires_in' => $session['expires_in'],
            'refresh_expires_in' => $session['refresh_expires_in'],
            'user' => (new AuthUserResource($user))->resolve(),
        ])->withCookie($this->buildCookie('pos_access_token', $session['access_token'], $session['expires_in']))
          ->withCookie($this->buildCookie('pos_refresh_token', $session['refresh_token'], $session['refresh_expires_in']));
    }

    public function refresh(
        RefreshTokenRequest $request,
        UserRepository $userRepository,
        JwtService $jwtService,
        RefreshTokenService $refreshTokenService
    ): JsonResponse {
        $incomingRefreshToken = (string) ($request->cookie('pos_refresh_token') ?? $request->validated('refresh_token'));
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
        ])->withCookie($this->buildCookie('pos_access_token', $session['access_token'], $session['expires_in']))
          ->withCookie($this->buildCookie('pos_refresh_token', $session['refresh_token'], $session['refresh_expires_in']));
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

        $refreshToken = trim((string) ($request->cookie('pos_refresh_token') ?? $request->validated('refresh_token') ?? ''));

        if ($refreshToken !== '') {
            $refreshTokenService->revokeForUserToken($userId, $refreshToken);
        } else {
            $refreshTokenService->revokeAllForUser($userId);
        }

        $cookieAccess = cookie()->forget('pos_access_token');
        $cookieRefresh = cookie()->forget('pos_refresh_token');

        return response()->json([
            'message' => 'Logged out successfully.',
        ])->withCookie($cookieAccess)->withCookie($cookieRefresh);
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

    private function buildCookie(string $name, string $value, int $expiresInSeconds): \Symfony\Component\HttpFoundation\Cookie
    {
        return cookie(
            $name,
            $value,
            (int) ($expiresInSeconds / 60),
            '/',
            null,
            false, // secure
            true, // httpOnly
            false, // raw
            'Lax' // sameSite
        );
    }

    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'auth-service',
            'time' => now('UTC')->toIso8601String(),
        ]);
    }
}
