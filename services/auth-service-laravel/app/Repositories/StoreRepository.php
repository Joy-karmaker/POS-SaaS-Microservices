<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Services\CoreSchemaService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class StoreRepository
{
    public function __construct(
        private readonly CoreSchemaService $schemaService
    ) {
    }

    public function all(?string $tenantId = null): Collection
    {
        $this->schemaService->ensureStoresTable();

        $query = DB::connection()
            ->table('stores')
            ->select([
                'id',
                'tenant_id',
                'name',
                'code',
                'created_at',
            ])
            ->orderByDesc('created_at');

        if ($tenantId !== null && trim($tenantId) !== '') {
            $query->where('tenant_id', trim($tenantId));
        }

        return $query->get();
    }

    public function create(array $payload): object
    {
        $this->schemaService->ensureStoresTable();

        DB::connection()->table('stores')->insert($payload);

        return (object) $payload;
    }

    public function findByIdForTenant(string $storeId, string $tenantId): ?object
    {
        $this->schemaService->ensureStoresTable();

        return DB::connection()
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

    public function existsByCode(string $tenantId, string $code): bool
    {
        $this->schemaService->ensureStoresTable();

        return DB::connection()
            ->table('stores')
            ->where('tenant_id', trim($tenantId))
            ->whereRaw('LOWER(code) = ?', [Str::lower(trim($code))])
            ->exists();
    }
}
