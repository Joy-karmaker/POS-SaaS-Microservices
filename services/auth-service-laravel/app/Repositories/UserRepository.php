<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class UserRepository
{
    public function findByUsername(string $username, ?string $tenantId = null): ?object
    {
        $query = DB::connection()
            ->table('users')
            ->select(['id', 'tenant_id', 'username', 'password', 'role', 'created_at'])
            ->where('username', Str::lower(trim($username)));

        if ($tenantId === null) {
            $query->whereNull('tenant_id');
        } else {
            $query->where('tenant_id', trim($tenantId));
        }

        return $query->first();
    }

    public function findById(string $id): ?object
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
        $record = (object) [
            'id' => (string) Str::uuid(),
            'tenant_id' => null,
            'username' => Str::lower(trim($username)),
            'password' => $passwordHash,
            'role' => 'platform_admin',
            'created_at' => now('UTC')->format('Y-m-d H:i:s'),
        ];

        DB::connection()->table('users')->insert([
            'id' => $record->id,
            'tenant_id' => $record->tenant_id,
            'username' => $record->username,
            'password' => $record->password,
            'role' => $record->role,
            'created_at' => $record->created_at,
        ]);

        return $record;
    }

    public function allByTenant(?string $tenantId = null): Collection
    {
        $query = DB::connection()
            ->table('users')
            ->select(['id', 'tenant_id', 'username', 'role', 'created_at'])
            ->whereIn('role', ['tenant_admin', 'user'])
            ->orderByDesc('created_at');

        if ($tenantId !== null && trim($tenantId) !== '') {
            $query->where('tenant_id', trim($tenantId));
        }

        return $query->get();
    }

    public function createTenantUser(
        string $tenantId,
        string $username,
        string $passwordHash,
        string $role
    ): object {
        $record = (object) [
            'id' => (string) Str::uuid(),
            'tenant_id' => trim($tenantId),
            'username' => Str::lower(trim($username)),
            'password' => $passwordHash,
            'role' => trim($role),
            'created_at' => now('UTC')->format('Y-m-d H:i:s'),
        ];

        DB::connection()->table('users')->insert([
            'id' => $record->id,
            'tenant_id' => $record->tenant_id,
            'username' => $record->username,
            'password' => $record->password,
            'role' => $record->role,
            'created_at' => $record->created_at,
        ]);

        return $record;
    }
}
