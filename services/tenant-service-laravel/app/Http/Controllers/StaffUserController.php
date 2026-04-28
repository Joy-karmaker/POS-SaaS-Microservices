<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Repositories\StaffProfileRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

final class StaffUserController extends Controller
{
    public function __construct(
        private readonly StaffProfileRepository $profileRepository
    ) {
    }

    public function me(Request $request): JsonResponse
    {
        $claims = $this->readClaims($request);
        if (!$claims) {
            return $this->jsonError('Unauthorized.', 401);
        }

        $tenantId = $this->readTenantId($claims);
        $userId = (string) ($claims['sub'] ?? '');

        if (!$tenantId || !$userId) {
            return $this->jsonError('Forbidden.', 403);
        }

        try {
            $profile = $this->profileRepository->findByUserId($tenantId, $userId);
            
            // If no profile found, but user is tenant_admin, they are the shop owner
            if (!$profile) {
                $roleLabel = (string)($claims['role'] ?? '');
                if ($roleLabel === 'tenant_admin' || $roleLabel === 'platform_admin') {
                    return response()->json([
                        'profile' => [
                            'user_id' => $userId,
                            'role_code' => 'admin',
                            'role_name' => 'Shop Owner',
                            'full_name' => 'Administrator',
                        ]
                    ]);
                }
                return $this->jsonError('Profile not found.', 404);
            }

            // Fetch role details
            $role = $this->profileRepository->findRoleById($tenantId, (string)$profile->role_id);

            return response()->json([
                'profile' => [
                    'user_id' => $profile->user_id,
                    'store_id' => $profile->store_id,
                    'role_id' => $profile->role_id,
                    'role_code' => $role->code ?? 'user',
                    'role_name' => $role->name ?? 'User',
                    'full_name' => $profile->full_name,
                    'phone' => $profile->phone,
                ]
            ]);
        } catch (Throwable $e) {
            Log::error('Failed to fetch tenant profile: ' . $e->getMessage());
            return $this->jsonError('Internal server error.', 500);
        }
    }

    public function roles(Request $request): JsonResponse
    {
        $claims = $this->readClaims($request);
        if (!$claims) {
            return $this->jsonError('Unauthorized.', 401);
        }

        $tenantId = $this->readTenantId($claims);
        if (!$tenantId) {
            return $this->jsonError('Forbidden.', 403);
        }

        try {
            $roles = $this->profileRepository->listRoles($tenantId);
            return response()->json(['roles' => $roles]);
        } catch (Throwable $e) {
            Log::error('Failed to list roles: ' . $e->getMessage());
            return $this->jsonError('Failed to list roles.', 500);
        }
    }

    public function index(Request $request): JsonResponse
    {
        $claims = $this->readClaims($request);
        if (!$claims) {
            return $this->jsonError('Unauthorized.', 401);
        }

        $tenantId = $this->readTenantId($claims);
        if (!$tenantId) {
            return $this->jsonError('Forbidden.', 403);
        }

        try {
            $profiles = $this->profileRepository->all($tenantId);

            $token = (string) ($request->cookie('pos_access_token') ?? $request->bearerToken() ?? '');
            $authServiceUrl = env('AUTH_SERVICE_URL', 'http://auth-service:8080');
            $authResponse = Http::withToken($token)
                ->get("{$authServiceUrl}/auth/staff", ['tenant_id' => $tenantId]);
            
            $authUsers = [];
            if ($authResponse->successful()) {
                $authUsers = $authResponse->json('users') ?? [];
            }

            $mapped = $profiles->map(function ($profile) use ($authUsers) {
                $authUser = collect($authUsers)->firstWhere('id', $profile->user_id);
                return [
                    'id' => $profile->user_id,
                    'tenant_id' => $profile->tenant_id,
                    'store_id' => $profile->store_id,
                    'store_name' => $profile->store_name,
                    'role_id' => $profile->role_id,
                    'role_name' => $profile->role_name,
                    'full_name' => $profile->full_name,
                    'phone' => $profile->phone,
                    'username' => $authUser['username'] ?? 'N/A',
                    'role' => $authUser['role'] ?? 'user',
                    'created_at' => $profile->created_at,
                ];
            });

            return response()->json(['users' => $mapped]);
        } catch (Throwable $e) {
            Log::error('Failed to list staff: ' . $e->getMessage());
            return $this->jsonError('Failed to list staff.', 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $claims = $this->readClaims($request);
        if (!$claims) {
            return $this->jsonError('Unauthorized.', 401);
        }

        $tenantId = $this->readTenantId($claims);
        if (!$tenantId) {
            return $this->jsonError('Forbidden.', 403);
        }

        $validated = $request->validate([
            'username' => 'required|string|min:2',
            'full_name' => 'required|string|min:2',
            'store_id' => 'required|integer',
            'role_id' => 'required|integer',
            'password' => 'required|string|min:8',
        ]);

        try {
            // Fetch role details from Tenant DB
            $role = $this->profileRepository->findRoleById($tenantId, (string)$validated['role_id']);
            if (!$role) {
                return $this->jsonError('Role not found.', 422);
            }

            // 1. Create Identity in Auth Service
            // We still use 'user' as the base role for auth permissions
            $token = (string) ($request->cookie('pos_access_token') ?? $request->bearerToken() ?? '');
            $authServiceUrl = env('AUTH_SERVICE_URL', 'http://auth-service:8080');
            $authResponse = Http::withToken($token)
                ->post("{$authServiceUrl}/auth/staff", [
                    'tenant_id' => $tenantId,
                    'username' => $validated['username'],
                    'password' => $validated['password'],
                    'role' => 'user', 
                ]);

            if ($authResponse->failed()) {
                return $this->jsonError(
                    $authResponse->json('error') ?? 'Failed to create identity in Auth Service.',
                    $authResponse->status()
                );
            }

            $authUser = $authResponse->json('user');
            $userId = $authUser['id'];

            // 2. Create Profile in Tenant DB
            $this->profileRepository->create([
                'user_id' => $userId,
                'tenant_id' => $tenantId,
                'store_id' => $validated['store_id'],
                'role_id' => $validated['role_id'],
                'full_name' => $validated['full_name'],
                'phone' => $request->input('phone'),
                'created_at' => now('UTC')->format('Y-m-d H:i:s'),
            ]);

            return response()->json([
                'message' => 'Staff user created successfully.',
                'user' => array_merge($authUser, [
                    'full_name' => $validated['full_name'],
                    'store_id' => $validated['store_id'],
                    'role_name' => $role->name,
                ])
            ], 201);

        } catch (Throwable $e) {
            Log::error('Staff creation failed: ' . $e->getMessage());
            return $this->jsonError('Staff creation failed.', 500);
        }
    }

    private function readClaims(Request $request): ?array
    {
        $claims = $request->attributes->get('auth_claims');
        return is_array($claims) ? $claims : null;
    }

    private function readTenantId(array $claims): ?int
    {
        $tenantId = $claims['tenant_id'] ?? null;
        return $tenantId !== null ? (int) $tenantId : null;
    }

    private function jsonError(string $message, int $status): JsonResponse
    {
        return response()->json(['error' => $message], $status);
    }
}
