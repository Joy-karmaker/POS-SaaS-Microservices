<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DuplicateTenantException;
use App\Repositories\TenantRepository;
use App\Services\TenantProvisioning\TenantDatabaseManager;
use App\Services\TenantProvisioning\TenantProvisioningPayloadFactory;
use App\Services\TenantProvisioning\TenantSchemaProvisioner;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
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

    public function provisionTenant(string $name, string $ownerPassword): array
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

            // Insert into tenants table and get the auto-generated ID
            $this->tenantRepository->create([
                'name' => $payload['name'],
                'db_name' => $payload['db_name'],
                'db_username' => $payload['db_username'],
                'db_password' => Crypt::encryptString($payload['db_password']),
                'created_at' => $payload['created_at'],
            ]);

            // Fetch the generated ID
            $tenant = DB::table('tenants')->where('db_name', $payload['db_name'])->first();
            if (!$tenant) {
                throw new RuntimeException('Failed to retrieve newly created tenant.');
            }
            $tenantId = $tenant->id;

            // Call Auth Service to create the Owner identity
            $this->createOwnerIdentity(
                (int)$tenantId,
                $ownerPassword
            );

            return [
                'id' => $tenantId,
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

    private function createOwnerIdentity(int $tenantId, string $password): void
    {
        $authServiceUrl = env('AUTH_SERVICE_URL', 'http://auth-service:8080');
        $token = request()->bearerToken();

        if (empty($token)) {
            $token = request()->cookie('pos_access_token');
        }

        $response = Http::withToken((string) $token)
            ->withHeaders(['Accept' => 'application/json'])
            ->post("{$authServiceUrl}/staff", [
                'tenant_id' => $tenantId,
                'password' => $password !== '' ? $password : 'password123',
                'role' => 'tenant_admin',
            ]);

        if ($response->failed()) {
            Log::error('Failed to create tenant owner identity in Auth Service.', [
                'tenant_id' => $tenantId,
                'status' => $response->status(),
                'error' => $response->json('error') ?? $response->body(),
            ]);

            throw new RuntimeException('Failed to create tenant owner account: ' . ($response->json('error') ?? 'Auth Service Error'));
        }
    }
}
