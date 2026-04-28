<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Services\TenantConnectionManager;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class StoreRepository
{
    public function __construct(
        private readonly TenantConnectionManager $connectionManager
    ) {
    }

    public function all(int|string|null $tenantId = null): Collection
    {
        if ($tenantId !== null) {
            $this->connectionManager->switch((string)$tenantId);
        }

        $query = DB::connection('tenant')
            ->table('stores')
            ->select([
                'id',
                'tenant_id',
                'name',
                'code',
                'created_at',
            ])
            ->orderByDesc('created_at');

        if ($tenantId !== null) {
            $query->where('tenant_id', $tenantId);
        }

        return $query->get();
    }

    public function create(array $payload): object
    {
        $tenantId = $payload['tenant_id'] ?? '';
        if ($tenantId !== '') {
            $this->connectionManager->switch((string)$tenantId);
        }

        $id = DB::connection('tenant')->table('stores')->insertGetId($payload);
        
        $payload['id'] = $id;
        return (object) $payload;
    }

    public function findByIdForTenant(int|string $storeId, int|string $tenantId): ?object
    {
        $this->connectionManager->switch((string)$tenantId);

        return DB::connection('tenant')
            ->table('stores')
            ->select([
                'id',
                'tenant_id',
                'name',
                'code',
                'created_at',
            ])
            ->where('id', $storeId)
            ->where('tenant_id', $tenantId)
            ->first();
    }

    public function existsByCode(int|string $tenantId, string $code): bool
    {
        $this->connectionManager->switch((string)$tenantId);

        return DB::connection('tenant')
            ->table('stores')
            ->where('tenant_id', $tenantId)
            ->whereRaw('LOWER(code) = ?', [Str::lower(trim($code))])
            ->exists();
    }
}
