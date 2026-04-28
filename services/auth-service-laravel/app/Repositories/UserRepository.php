<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class UserRepository
{
    public function findByUsername(string $username, int|string|null $tenantId = null): ?object
    {
        $query = DB::connection()
            ->table('users')
            ->select(['id', 'tenant_id', 'username', 'password', 'role', 'created_at'])
            ->where('username', Str::lower(trim($username)));

        if ($tenantId === null) {
            $query->whereNull('tenant_id');
        } else {
            $query->where('tenant_id', $tenantId);
        }

        return $query->first();
    }

    public function findById(int|string $id): ?object
    {
        return DB::connection()
            ->table('users')
            ->select(['id', 'tenant_id', 'username', 'role', 'created_at'])
            ->where('id', $id)
            ->first();
    }

    public function existsPlatformAdmin(): bool
    {
        return DB::connection()
            ->table('users')
            ->where('role', 'platform_admin')
            ->exists();
    }

    public function createPlatformAdmin(string $username, string $passwordHash): object
    {
        $now = now('UTC')->format('Y-m-d H:i:s');
        
        $id = DB::connection()->table('users')->insertGetId([
            'tenant_id' => null,
            'username' => Str::lower(trim($username)),
            'password' => $passwordHash,
            'role' => 'platform_admin',
            'created_at' => $now,
        ]);

        return (object) [
            'id' => $id,
            'tenant_id' => null,
            'username' => Str::lower(trim($username)),
            'password' => $passwordHash,
            'role' => 'platform_admin',
            'created_at' => $now,
        ];
    }

    public function allByTenant(int|string|null $tenantId = null): Collection
    {
        $query = DB::connection()
            ->table('users')
            ->select(['id', 'tenant_id', 'username', 'role', 'created_at'])
            ->whereIn('role', ['tenant_admin', 'user'])
            ->orderByDesc('created_at');

        if ($tenantId !== null) {
            $query->where('tenant_id', $tenantId);
        }

        return $query->get();
    }

    public function createTenantUser(
        int|string $tenantId,
        string $username,
        string $passwordHash,
        string $role
    ): object {
        $now = now('UTC')->format('Y-m-d H:i:s');

        $id = DB::connection()->table('users')->insertGetId([
            'tenant_id' => $tenantId,
            'username' => Str::lower(trim($username)),
            'password' => $passwordHash,
            'role' => trim($role),
            'created_at' => $now,
        ]);

        return (object) [
            'id' => $id,
            'tenant_id' => $tenantId,
            'username' => Str::lower(trim($username)),
            'password' => $passwordHash,
            'role' => trim($role),
            'created_at' => $now,
        ];
    }
}
