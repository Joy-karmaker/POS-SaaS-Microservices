<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\TenantRepository;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use RuntimeException;

final class TenantConnectionManager
{
    public function __construct(
        private readonly TenantRepository $tenantRepository
    ) {
    }

    public function switch(int|string $tenantId): void
    {
        $tenant = $this->tenantRepository->findById($tenantId);

        if (!$tenant) {
            throw new RuntimeException("Tenant [{$tenantId}] not found for database switching.");
        }

        $dbPassword = Crypt::decryptString($tenant->db_password);

        // Configure the 'tenant' connection dynamically
        Config::set('database.connections.tenant.database', $tenant->db_name);
        Config::set('database.connections.tenant.username', $tenant->db_username);
        Config::set('database.connections.tenant.password', $dbPassword);

        // Purge the connection to ensure it reconnects with new settings
        DB::purge('tenant');
    }
}
