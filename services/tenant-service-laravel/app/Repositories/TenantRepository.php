<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class TenantRepository
{
    public function all(): Collection
    {
        return DB::connection()
            ->table('tenants')
            ->select([
                'id',
                'name',
                'db_name',
                'db_username',
                'created_at',
            ])
            ->orderByDesc('created_at')
            ->get();
    }

    public function create(array $payload): void
    {
        DB::connection()->table('tenants')->insert($payload);
    }

    public function existsByName(string $name): bool
    {
        return DB::connection()
            ->table('tenants')
            ->whereRaw('LOWER(name) = ?', [Str::lower(trim($name))])
            ->exists();
    }

    public function existsById(int|string $tenantId): bool
    {
        return DB::connection()
            ->table('tenants')
            ->where('id', $tenantId)
            ->exists();
    }

    public function findById(int|string $tenantId): ?object
    {
        return DB::connection()
            ->table('tenants')
            ->where('id', $tenantId)
            ->first();
    }
}
