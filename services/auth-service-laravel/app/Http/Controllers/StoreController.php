<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\DuplicateStoreCodeException;
use App\Exceptions\StoreNotFoundException;
use App\Http\Requests\Store\StoreStoreRequest;
use App\Http\Resources\StoreResource;
use App\Services\StoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

final class StoreController extends Controller
{
    public function index(Request $request, StoreService $storeService): JsonResponse
    {
        $claims = $this->readClaims($request);
        if ($claims === null) {
            return $this->jsonError('Unauthorized.', 401);
        }

        $role = (string) ($claims['role'] ?? '');
        $tenantIdFilter = null;

        if ($role === 'platform_admin') {
            $tenantId = trim((string) $request->query('tenant_id', ''));
            if ($tenantId !== '') {
                if (!Str::isUuid($tenantId)) {
                    return $this->jsonError('The tenant_id field must be a valid UUID.', 422);
                }

                $tenantIdFilter = $tenantId;
            }
        } else {
            $tenantIdFilter = $this->readTenantId($claims);
            if ($tenantIdFilter === null) {
                return $this->jsonError('Forbidden.', 403);
            }
        }

        try {
            $stores = $storeService->all($tenantIdFilter);
            $storeRows = StoreResource::collection($stores)->resolve();

            return response()->json([
                'stores' => $storeRows,
            ]);
        } catch (Throwable $exception) {
            Log::error('Failed to fetch stores list.', [
                'exception' => $exception->getMessage(),
            ]);

            return $this->jsonError('Failed to fetch stores.', 500);
        }
    }

    public function store(StoreStoreRequest $request, StoreService $storeService): JsonResponse
    {
        $claims = $this->readClaims($request);
        if ($claims === null) {
            return $this->jsonError('Unauthorized.', 401);
        }

        $role = (string) ($claims['role'] ?? '');
        $tenantId = null;

        if ($role === 'platform_admin') {
            $tenantId = trim((string) ($request->validated('tenant_id') ?? ''));
            if ($tenantId === '') {
                return $this->jsonError('tenant_id is required for platform admin.', 422);
            }
        } elseif ($role === 'tenant_admin') {
            $tenantId = $this->readTenantId($claims);
            if ($tenantId === null) {
                return $this->jsonError('Forbidden.', 403);
            }
        } else {
            return $this->jsonError('Forbidden.', 403);
        }

        try {
            $store = $storeService->create(
                $tenantId,
                (string) $request->validated('name'),
                $request->validated('code')
            );

            return response()->json([
                'message' => 'Store created successfully.',
                'store' => (new StoreResource($store))->resolve(),
            ], 201);
        } catch (DuplicateStoreCodeException $exception) {
            return $this->jsonError($exception->getMessage(), 409);
        } catch (StoreNotFoundException $exception) {
            return $this->jsonError($exception->getMessage(), 422);
        } catch (Throwable $exception) {
            Log::error('Store creation failed.', [
                'exception' => $exception->getMessage(),
            ]);

            return $this->jsonError('Store creation failed.', 500);
        }
    }

    private function readClaims(Request $request): ?array
    {
        $claims = $request->attributes->get('auth_claims');

        return is_array($claims) ? $claims : null;
    }

    private function readTenantId(array $claims): ?string
    {
        $tenantId = trim((string) ($claims['tenant_id'] ?? ''));

        return $tenantId === '' ? null : $tenantId;
    }

    private function jsonError(string $message, int $status): JsonResponse
    {
        return response()->json([
            'error' => $message,
        ], $status);
    }
}
