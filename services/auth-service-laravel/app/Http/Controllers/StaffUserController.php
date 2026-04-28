<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\DuplicateUserEmailException;
use App\Exceptions\TenantNotFoundException;
use App\Http\Requests\Staff\StoreStaffUserRequest;
use App\Http\Resources\StaffUserResource;
use App\Services\StaffUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

final class StaffUserController extends Controller
{
    public function index(Request $request, StaffUserService $staffUserService): JsonResponse
    {
        $claims = $this->readClaims($request);
        if ($claims === null) {
            return $this->jsonError('Unauthorized.', 401);
        }

        $role = (string) ($claims['role'] ?? '');
        $tenantIdFilter = null;

        if ($role === 'platform_admin') {
            $tenantIdQuery = $request->query('tenant_id');
            if ($tenantIdQuery !== null) {
                if (!is_numeric($tenantIdQuery)) {
                    return $this->jsonError('The tenant_id field must be a valid integer.', 422);
                }

                $tenantIdFilter = (int)$tenantIdQuery;
            }
        } elseif ($role === 'tenant_admin' || $role === 'user') {
            $tenantIdFilter = $this->readTenantId($claims);
            if ($tenantIdFilter === null) {
                return $this->jsonError('Forbidden.', 403);
            }
        } else {
            return $this->jsonError('Forbidden.', 403);
        }

        try {
            $users = $staffUserService->list($tenantIdFilter);
            $userRows = StaffUserResource::collection($users)->resolve();

            return response()->json([
                'users' => $userRows,
            ]);
        } catch (Throwable $exception) {
            Log::error('Failed to fetch staff users.', [
                'exception' => $exception->getMessage(),
            ]);

            return $this->jsonError('Failed to fetch staff users.', 500);
        }
    }

    public function store(StoreStaffUserRequest $request, StaffUserService $staffUserService): JsonResponse
    {
        $claims = $this->readClaims($request);
        if ($claims === null) {
            return $this->jsonError('Unauthorized.', 401);
        }

        $role = (string) ($claims['role'] ?? '');
        $targetRole = (string) $request->validated('role');
        $tenantId = null;

        if ($role === 'platform_admin') {
            $tenantId = trim((string) ($request->validated('tenant_id') ?? ''));
            if ($tenantId === '') {
                return $this->jsonError('tenant_id is required for platform admin.', 422);
            }
        } elseif ($role === 'tenant_admin') {
            if ($targetRole !== 'user') {
                return $this->jsonError('Tenant admin can create only user role.', 403);
            }

            $tenantId = $this->readTenantId($claims);
            if ($tenantId === null) {
                return $this->jsonError('Forbidden.', 403);
            }
        } else {
            return $this->jsonError('Forbidden.', 403);
        }

        try {
            $user = $staffUserService->create(
                $tenantId,
                (string) $request->validated('username'),
                (string) $request->validated('password'),
                $targetRole
            );

            return response()->json([
                'message' => 'Staff user created successfully.',
                'user' => (new StaffUserResource($user))->resolve(),
            ], 201);
        } catch (DuplicateUserEmailException $exception) {
            return $this->jsonError($exception->getMessage(), 409);
        } catch (TenantNotFoundException $exception) {
            return $this->jsonError($exception->getMessage(), 422);
        } catch (Throwable $exception) {
            Log::error('Staff user creation failed.', [
                'exception' => $exception->getMessage(),
            ]);

            return $this->jsonError('Staff user creation failed.', 500);
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
        return response()->json([
            'error' => $message,
        ], $status);
    }
}
