<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Services\TenantConnectionManager;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class StaffProfileRepository
{
    public function __construct(
        private readonly TenantConnectionManager $connectionManager
    ) {
    }

    public function all(int|string $tenantId): Collection
    {
        $this->connectionManager->switch((string)$tenantId);

        return DB::connection('tenant')
            ->table('staff_profiles')
            ->leftJoin('stores', 'staff_profiles.store_id', '=', 'stores.id')
            ->leftJoin('staff_roles', 'staff_profiles.role_id', '=', 'staff_roles.id')
            ->select([
                'staff_profiles.user_id',
                'staff_profiles.tenant_id',
                'staff_profiles.store_id',
                'staff_profiles.role_id',
                'staff_profiles.full_name',
                'staff_profiles.phone',
                'staff_profiles.created_at',
                'stores.name as store_name',
                'stores.code as store_code',
                'staff_roles.name as role_name',
                'staff_roles.code as role_code',
            ])
            ->orderByDesc('staff_profiles.created_at')
            ->get();
    }

    public function create(array $payload): void
    {
        $tenantId = $payload['tenant_id'] ?? '';
        if ($tenantId !== '') {
            $this->connectionManager->switch((string)$tenantId);
        }

        DB::connection('tenant')->table('staff_profiles')->insert($payload);
    }

    public function findByUserId(int|string $tenantId, int|string $userId): ?object
    {
        $this->connectionManager->switch((string)$tenantId);

        return DB::connection('tenant')
            ->table('staff_profiles')
            ->where('user_id', $userId)
            ->first();
    }

    public function listRoles(int|string $tenantId): Collection
    {
        $this->connectionManager->switch((string)$tenantId);

        return DB::connection('tenant')
            ->table('staff_roles')
            ->select(['id', 'name', 'code'])
            ->orderBy('name')
            ->get();
    }

    public function findRoleById(int|string $tenantId, int|string $roleId): ?object
    {
        $this->connectionManager->switch((string)$tenantId);

        return DB::connection('tenant')
            ->table('staff_roles')
            ->where('id', $roleId)
            ->first();
    }
}
