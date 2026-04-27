<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\DuplicateTenantException;
use App\Http\Requests\StoreTenantRequest;
use App\Http\Resources\TenantResource;
use App\Repositories\TenantRepository;
use App\Services\TenantProvisioningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

final class TenantController extends Controller
{
    public function health(): JsonResponse
    {
        try {
            DB::connection()->select('SELECT 1');

            return response()->json([
                'status' => 'ok',
                'service' => 'tenant-service',
                'time' => now('UTC')->toIso8601String(),
            ]);
        } catch (Throwable $exception) {
            Log::warning('Tenant service health check failed.', [
                'exception' => $exception->getMessage(),
            ]);

            return response()->json([
                'status' => 'degraded',
                'service' => 'tenant-service',
                'error' => 'Database unavailable.',
            ], 503);
        }
    }

    public function index(TenantRepository $tenantRepository): JsonResponse
    {
        try {
            $tenants = $tenantRepository->all();
            $tenantRows = TenantResource::collection($tenants)->resolve();

            return response()->json([
                'tenants' => $tenantRows,
            ]);
        } catch (Throwable $exception) {
            Log::error('Failed to fetch tenants list.', [
                'exception' => $exception->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch tenants.',
            ], 500);
        }
    }

    public function store(
        StoreTenantRequest $request,
        TenantProvisioningService $provisioningService
    ): JsonResponse
    {
        try {
            $tenant = $provisioningService->provisionTenant(
                (string) $request->validated('name'),
                (string) ($request->validated('owner_password') ?? '')
            );

            return response()->json([
                'message' => 'Tenant provisioned successfully.',
                'tenant' => (new TenantResource($tenant))->resolve(),
            ], 201);
        } catch (DuplicateTenantException $exception) {
            return response()->json([
                'error' => $exception->getMessage(),
            ], 409);
        } catch (Throwable $exception) {
            Log::error('Tenant provisioning failed.', [
                'exception' => $exception->getMessage(),
            ]);

            return response()->json([
                'error' => 'Tenant provisioning failed.',
            ], 500);
        }
    }
}
