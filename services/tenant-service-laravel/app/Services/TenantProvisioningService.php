<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DuplicateTenantException;
use App\Repositories\TenantRepository;
use App\Services\TenantProvisioning\TenantDatabaseManager;
use App\Services\TenantProvisioning\TenantProvisioningPayloadFactory;
use App\Services\TenantProvisioning\TenantSchemaProvisioner;
use Illuminate\Support\Facades\Crypt;
use RuntimeException;
use Throwable;

class TenantProvisioningService
{
    public function __construct(
        private readonly TenantRepository $tenantRepository,
        private readonly TenantProvisioningPayloadFactory $payloadFactory,
        private readonly TenantDatabaseManager $databaseManager,
        private readonly TenantSchemaProvisioner $schemaProvisioner
    ) {
    }

    public function provisionTenant(string $name): array
    {
        $payload = $this->payloadFactory->make($name);
        if ($this->tenantRepository->existsByName($payload['name'])) {
            throw new DuplicateTenantException(sprintf(
                'Tenant "%s" already exists.',
                $payload['name']
            ));
        }

        $rootConnection = $this->databaseManager->rootConnection();
        $databaseCreated = false;
        $userCreated = false;

        try {
            $this->databaseManager->createDatabase(
                $rootConnection,
                $payload['db_name']
            );
            $databaseCreated = true;

            $this->databaseManager->createUser(
                $rootConnection,
                $payload['db_username'],
                $payload['db_password']
            );
            $userCreated = true;

            $this->databaseManager->grantPrivileges(
                $rootConnection,
                $payload['db_name'],
                $payload['db_username']
            );

            $tenantConnection = $this->databaseManager->tenantConnection(
                $payload['db_name'],
                $payload['db_username'],
                $payload['db_password']
            );

            $this->schemaProvisioner->provision($tenantConnection);

            $this->tenantRepository->create([
                'id' => $payload['id'],
                'name' => $payload['name'],
                'db_name' => $payload['db_name'],
                'db_username' => $payload['db_username'],
                'db_password' => Crypt::encryptString($payload['db_password']),
                'created_at' => $payload['created_at'],
            ]);

            return [
                'id' => $payload['id'],
                'name' => $payload['name'],
                'db_name' => $payload['db_name'],
                'db_username' => $payload['db_username'],
                'created_at' => $payload['created_at'],
            ];
        } catch (Throwable $exception) {
            $this->databaseManager->rollback(
                $rootConnection,
                $payload['db_name'],
                $payload['db_username'],
                $databaseCreated,
                $userCreated
            );

            throw new RuntimeException(
                'Provisioning workflow failed: ' . $exception->getMessage(),
                0,
                $exception
            );
        }
    }
}
