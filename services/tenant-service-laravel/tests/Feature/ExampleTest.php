<?php

namespace Tests\Feature;

use App\Exceptions\DuplicateTenantException;
use App\Services\Auth\JwtService;
use App\Services\TenantProvisioningService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Mockery\MockInterface;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_health_endpoint_returns_ok_response(): void
    {
        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
        ]);

        $response = $this->getJson('/health');

        $response
            ->assertStatus(200)
            ->assertJson([
                'status' => 'ok',
                'service' => 'tenant-service',
            ])
            ->assertJsonStructure(['time']);
    }

    public function test_create_tenant_returns_201_and_hides_password(): void
    {
        $headers = $this->platformAuthHeaders();

        $this->mock(TenantProvisioningService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('provisionTenant')
                ->once()
                ->with('Demo Store')
                ->andReturn([
                    'id' => '11111111-1111-4111-8111-111111111111',
                    'name' => 'Demo Store',
                    'db_name' => 'demo_store_111111',
                    'db_username' => 'demo_store_u_111111',
                    'created_at' => '2026-03-25 00:00:00',
                ]);
        });

        $response = $this->withHeaders($headers)->postJson('/tenants', [
            'name' => 'Demo Store',
        ]);

        $response
            ->assertStatus(201)
            ->assertJson([
                'message' => 'Tenant provisioned successfully.',
                'tenant' => [
                    'name' => 'Demo Store',
                    'db_name' => 'demo_store_111111',
                ],
            ])
            ->assertJsonMissingPath('tenant.db_password');
    }

    public function test_create_tenant_validates_name(): void
    {
        $response = $this->withHeaders($this->platformAuthHeaders())->postJson('/tenants', [
            'name' => '',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonStructure(['error']);
    }

    public function test_create_tenant_returns_409_for_duplicate_name(): void
    {
        $headers = $this->platformAuthHeaders();

        $this->mock(TenantProvisioningService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('provisionTenant')
                ->once()
                ->with('Demo Store')
                ->andThrow(new DuplicateTenantException('Tenant "Demo Store" already exists.'));
        });

        $response = $this->withHeaders($headers)->postJson('/tenants', [
            'name' => 'Demo Store',
        ]);

        $response
            ->assertStatus(409)
            ->assertJson([
                'error' => 'Tenant "Demo Store" already exists.',
            ]);
    }

    public function test_list_tenants_returns_rows_without_password(): void
    {
        $headers = $this->platformAuthHeaders();

        $this->useInMemorySqlite();
        $this->createTenantsTable();

        DB::table('tenants')->insert([
            [
                'id' => '11111111-1111-4111-8111-111111111111',
                'name' => 'Alpha Shop',
                'db_name' => 'tenant_alpha',
                'db_username' => 'tenant_alpha',
                'db_password' => 'encrypted-password-a',
                'created_at' => '2026-03-25 10:00:00',
            ],
            [
                'id' => '22222222-2222-4222-8222-222222222222',
                'name' => 'Beta Shop',
                'db_name' => 'tenant_beta',
                'db_username' => 'tenant_beta',
                'db_password' => 'encrypted-password-b',
                'created_at' => '2026-03-25 11:00:00',
            ],
        ]);

        $response = $this->withHeaders($headers)->getJson('/tenants');

        $response
            ->assertStatus(200)
            ->assertJsonCount(2, 'tenants')
            ->assertJsonPath('tenants.0.name', 'Beta Shop')
            ->assertJsonPath('tenants.1.name', 'Alpha Shop')
            ->assertJsonMissingPath('tenants.0.db_password')
            ->assertJsonMissingPath('tenants.1.db_password');
    }

    public function test_tenants_endpoints_require_authentication(): void
    {
        $listResponse = $this->getJson('/tenants');
        $createResponse = $this->postJson('/tenants', [
            'name' => 'Demo Store',
        ]);

        $listResponse
            ->assertStatus(401)
            ->assertJsonPath('error', 'Missing bearer token.');

        $createResponse
            ->assertStatus(401)
            ->assertJsonPath('error', 'Missing bearer token.');
    }

    public function test_tenants_endpoints_forbid_non_platform_admin_role(): void
    {
        $headers = $this->tenantAdminAuthHeaders();

        $listResponse = $this->withHeaders($headers)->getJson('/tenants');
        $createResponse = $this->withHeaders($headers)->postJson('/tenants', [
            'name' => 'Demo Store',
        ]);

        $listResponse
            ->assertStatus(403)
            ->assertJsonPath('error', 'Forbidden.');

        $createResponse
            ->assertStatus(403)
            ->assertJsonPath('error', 'Forbidden.');
    }

    public function test_platform_admin_can_create_store_for_tenant(): void
    {
        $this->useInMemorySqlite();
        $this->createTenantsTable();
        $this->createStoresTable();
        $this->setJwtConfig();

        $this->insertTenant([
            'id' => '22222222-2222-4222-8222-222222222222',
            'name' => 'Demo Tenant',
            'db_name' => 'demo_tenant_222222',
            'db_username' => 'demo_tenant_u_222222',
            'db_password' => 'encrypted-password',
            'created_at' => '2026-04-01 10:00:00',
        ]);

        $response = $this->withHeaders($this->platformAuthHeaders())->postJson('/stores', [
            'tenant_id' => '22222222-2222-4222-8222-222222222222',
            'name' => 'Main Outlet',
            'code' => 'MAIN-001',
        ]);

        $response
            ->assertStatus(201)
            ->assertJsonPath('message', 'Store created successfully.')
            ->assertJsonPath('store.tenant_id', '22222222-2222-4222-8222-222222222222')
            ->assertJsonPath('store.name', 'Main Outlet')
            ->assertJsonPath('store.code', 'MAIN_001');
    }

    public function test_tenant_admin_lists_only_own_tenant_stores(): void
    {
        $this->useInMemorySqlite();
        $this->createTenantsTable();
        $this->createStoresTable();
        $this->setJwtConfig();

        $this->insertTenant([
            'id' => '22222222-2222-4222-8222-222222222222',
            'name' => 'Tenant A',
            'db_name' => 'tenant_a_222222',
            'db_username' => 'tenant_a_u_222222',
            'db_password' => 'encrypted-password',
            'created_at' => '2026-04-01 10:00:00',
        ]);
        $this->insertTenant([
            'id' => '33333333-3333-4333-8333-333333333333',
            'name' => 'Tenant B',
            'db_name' => 'tenant_b_333333',
            'db_username' => 'tenant_b_u_333333',
            'db_password' => 'encrypted-password',
            'created_at' => '2026-04-01 10:01:00',
        ]);

        DB::table('stores')->insert([
            [
                'id' => '44444444-4444-4444-8444-444444444444',
                'tenant_id' => '22222222-2222-4222-8222-222222222222',
                'name' => 'A Main Store',
                'code' => 'A_MAIN',
                'created_at' => '2026-04-01 10:02:00',
            ],
            [
                'id' => '55555555-5555-4555-8555-555555555555',
                'tenant_id' => '33333333-3333-4333-8333-333333333333',
                'name' => 'B Main Store',
                'code' => 'B_MAIN',
                'created_at' => '2026-04-01 10:03:00',
            ],
        ]);

        $response = $this->withHeaders($this->tenantAdminAuthHeaders())->getJson('/stores');

        $response
            ->assertStatus(200)
            ->assertJsonCount(1, 'stores')
            ->assertJsonPath('stores.0.tenant_id', '22222222-2222-4222-8222-222222222222')
            ->assertJsonPath('stores.0.name', 'A Main Store');
    }

    public function test_store_creation_rejects_duplicate_code_for_same_tenant(): void
    {
        $this->useInMemorySqlite();
        $this->createTenantsTable();
        $this->createStoresTable();
        $this->setJwtConfig();

        $this->insertTenant([
            'id' => '22222222-2222-4222-8222-222222222222',
            'name' => 'Tenant A',
            'db_name' => 'tenant_a_222222',
            'db_username' => 'tenant_a_u_222222',
            'db_password' => 'encrypted-password',
            'created_at' => '2026-04-01 10:00:00',
        ]);

        DB::table('stores')->insert([
            'id' => '66666666-6666-4666-8666-666666666666',
            'tenant_id' => '22222222-2222-4222-8222-222222222222',
            'name' => 'Existing Store',
            'code' => 'MAIN_001',
            'created_at' => '2026-04-01 10:04:00',
        ]);

        $response = $this->withHeaders($this->tenantAdminAuthHeaders())->postJson('/stores', [
            'name' => 'New Store',
            'code' => 'main-001',
        ]);

        $response
            ->assertStatus(409)
            ->assertJsonPath('error', 'Store code "MAIN_001" already exists for this tenant.');
    }

    public function test_shift_open_close_and_current_for_tenant_user(): void
    {
        $this->useInMemorySqlite();
        $this->createTenantsTable();
        $this->createUsersTable();
        $this->createStoresTable();
        $this->createShiftsTable();
        $this->setJwtConfig();

        $this->insertTenant([
            'id' => '22222222-2222-4222-8222-222222222222',
            'name' => 'Tenant A',
            'db_name' => 'tenant_a_222222',
            'db_username' => 'tenant_a_u_222222',
            'db_password' => 'encrypted-password',
            'created_at' => '2026-04-01 10:00:00',
        ]);
        $this->insertUser([
            'id' => '11111111-1111-4111-8111-111111111111',
            'tenant_id' => '22222222-2222-4222-8222-222222222222',
            'email' => 'tenant.admin@example.com',
            'password' => Hash::make('tenant12345'),
            'role' => 'tenant_admin',
            'created_at' => '2026-04-01 10:05:00',
        ]);

        DB::table('stores')->insert([
            'id' => '77777777-7777-4777-8777-777777777777',
            'tenant_id' => '22222222-2222-4222-8222-222222222222',
            'name' => 'Tenant A Main Store',
            'code' => 'A_MAIN',
            'created_at' => '2026-04-01 10:06:00',
        ]);

        $openResponse = $this->withHeaders($this->tenantAdminAuthHeaders())->postJson('/shifts/open', [
            'store_id' => '77777777-7777-4777-8777-777777777777',
            'opening_balance' => 1000,
        ]);

        $openResponse
            ->assertStatus(201)
            ->assertJsonPath('message', 'Shift opened successfully.')
            ->assertJsonPath('shift.store_id', '77777777-7777-4777-8777-777777777777')
            ->assertJsonPath('shift.status', 'open')
            ->assertJsonPath('shift.opening_balance', '1000.00');

        $currentResponse = $this->withHeaders($this->tenantAdminAuthHeaders())->getJson(
            '/shifts/current?store_id=77777777-7777-4777-8777-777777777777'
        );

        $currentResponse
            ->assertStatus(200)
            ->assertJsonPath('shift.status', 'open');

        $closeResponse = $this->withHeaders($this->tenantAdminAuthHeaders())->postJson('/shifts/close', [
            'store_id' => '77777777-7777-4777-8777-777777777777',
            'closing_balance' => 1200.5,
        ]);

        $closeResponse
            ->assertStatus(200)
            ->assertJsonPath('message', 'Shift closed successfully.')
            ->assertJsonPath('shift.status', 'closed')
            ->assertJsonPath('shift.closing_balance', '1200.50');
    }

    public function test_shift_endpoints_forbid_platform_admin_role(): void
    {
        $response = $this->withHeaders($this->platformAuthHeaders())->postJson('/shifts/open', [
            'store_id' => '77777777-7777-4777-8777-777777777777',
            'opening_balance' => 1000,
        ]);

        $response
            ->assertStatus(403)
            ->assertJsonPath('error', 'Forbidden.');
    }

    public function test_tenant_admin_can_create_staff_user_role_only(): void
    {
        $this->useInMemorySqlite();
        $this->createTenantsTable();
        $this->createUsersTable();
        $this->setJwtConfig();

        $this->insertTenant([
            'id' => '22222222-2222-4222-8222-222222222222',
            'name' => 'Tenant A',
            'db_name' => 'tenant_a_222222',
            'db_username' => 'tenant_a_u_222222',
            'db_password' => 'encrypted-password',
            'created_at' => '2026-04-01 12:00:00',
        ]);

        $response = $this->withHeaders($this->tenantAdminAuthHeaders())->postJson('/users', [
            'email' => 'cashier.one@example.com',
            'password' => 'cashierpass123',
            'role' => 'user',
        ]);

        $response
            ->assertStatus(201)
            ->assertJsonPath('message', 'Staff user created successfully.')
            ->assertJsonPath('user.email', 'cashier.one@example.com')
            ->assertJsonPath('user.role', 'user')
            ->assertJsonPath('user.tenant_id', '22222222-2222-4222-8222-222222222222')
            ->assertJsonMissingPath('user.password');
    }

    public function test_tenant_admin_cannot_create_tenant_admin_role(): void
    {
        $response = $this->withHeaders($this->tenantAdminAuthHeaders())->postJson('/users', [
            'email' => 'another.admin@example.com',
            'password' => 'tenantpass123',
            'role' => 'tenant_admin',
        ]);

        $response
            ->assertStatus(403)
            ->assertJsonPath('error', 'Tenant admin can create only user role.');
    }

    public function test_tenant_admin_lists_only_own_tenant_users(): void
    {
        $this->useInMemorySqlite();
        $this->createTenantsTable();
        $this->createUsersTable();
        $this->setJwtConfig();

        $this->insertTenant([
            'id' => '22222222-2222-4222-8222-222222222222',
            'name' => 'Tenant A',
            'db_name' => 'tenant_a_222222',
            'db_username' => 'tenant_a_u_222222',
            'db_password' => 'encrypted-password',
            'created_at' => '2026-04-01 12:00:00',
        ]);
        $this->insertTenant([
            'id' => '33333333-3333-4333-8333-333333333333',
            'name' => 'Tenant B',
            'db_name' => 'tenant_b_333333',
            'db_username' => 'tenant_b_u_333333',
            'db_password' => 'encrypted-password',
            'created_at' => '2026-04-01 12:01:00',
        ]);

        $this->insertUser([
            'id' => 'aaaa1111-1111-4111-8111-111111111111',
            'tenant_id' => '22222222-2222-4222-8222-222222222222',
            'email' => 'tenant.staff.a@example.com',
            'password' => Hash::make('tenant12345'),
            'role' => 'user',
            'created_at' => '2026-04-01 12:02:00',
        ]);
        $this->insertUser([
            'id' => 'bbbb2222-2222-4222-8222-222222222222',
            'tenant_id' => '33333333-3333-4333-8333-333333333333',
            'email' => 'tenant.staff.b@example.com',
            'password' => Hash::make('tenant12345'),
            'role' => 'user',
            'created_at' => '2026-04-01 12:03:00',
        ]);

        $response = $this->withHeaders($this->tenantAdminAuthHeaders())->getJson('/users');

        $response
            ->assertStatus(200)
            ->assertJsonCount(1, 'users')
            ->assertJsonPath('users.0.email', 'tenant.staff.a@example.com')
            ->assertJsonPath('users.0.tenant_id', '22222222-2222-4222-8222-222222222222');
    }

    public function test_tenant_user_cannot_access_staff_endpoints(): void
    {
        $listResponse = $this->withHeaders($this->tenantUserAuthHeaders())->getJson('/users');
        $createResponse = $this->withHeaders($this->tenantUserAuthHeaders())->postJson('/users', [
            'email' => 'tenant.user.new@example.com',
            'password' => 'tenant12345',
            'role' => 'user',
        ]);

        $listResponse
            ->assertStatus(403)
            ->assertJsonPath('error', 'Forbidden.');

        $createResponse
            ->assertStatus(403)
            ->assertJsonPath('error', 'Forbidden.');
    }

    public function test_bootstrap_platform_admin_creates_first_admin(): void
    {
        $this->useInMemorySqlite();
        $this->createUsersTable();

        $response = $this->postJson('/auth/bootstrap-admin', [
            'email' => 'admin@example.com',
            'password' => 'strongpass123',
        ]);

        $response
            ->assertStatus(201)
            ->assertJsonPath('message', 'Platform admin created successfully.')
            ->assertJsonPath('user.email', 'admin@example.com')
            ->assertJsonPath('user.role', 'platform_admin')
            ->assertJsonPath('user.tenant_id', null);
    }

    public function test_bootstrap_platform_admin_returns_409_if_admin_exists(): void
    {
        $this->useInMemorySqlite();
        $this->createUsersTable();
        $this->insertUser([
            'id' => '11111111-1111-4111-8111-111111111111',
            'tenant_id' => null,
            'email' => 'admin@example.com',
            'password' => Hash::make('strongpass123'),
            'role' => 'platform_admin',
            'created_at' => '2026-03-27 00:00:00',
        ]);

        $response = $this->postJson('/auth/bootstrap-admin', [
            'email' => 'admin2@example.com',
            'password' => 'strongpass123',
        ]);

        $response
            ->assertStatus(409)
            ->assertJsonPath('error', 'A platform admin already exists.');
    }

    public function test_login_returns_access_token_for_valid_credentials(): void
    {
        $this->useInMemorySqlite();
        $this->createUsersTable();
        $this->createRefreshTokensTable();
        $this->setJwtConfig();

        $this->insertUser([
            'id' => '11111111-1111-4111-8111-111111111111',
            'tenant_id' => null,
            'email' => 'admin@example.com',
            'password' => Hash::make('strongpass123'),
            'role' => 'platform_admin',
            'created_at' => '2026-03-27 00:00:00',
        ]);

        $response = $this->postJson('/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'strongpass123',
        ]);

        $response
            ->assertStatus(200)
            ->assertJsonPath('user.email', 'admin@example.com')
            ->assertJsonPath('user.role', 'platform_admin')
            ->assertJsonStructure(['access_token', 'refresh_token', 'expires_in']);
    }

    public function test_login_returns_401_for_invalid_credentials(): void
    {
        $this->useInMemorySqlite();
        $this->createUsersTable();
        $this->setJwtConfig();

        $this->insertUser([
            'id' => '11111111-1111-4111-8111-111111111111',
            'tenant_id' => null,
            'email' => 'admin@example.com',
            'password' => Hash::make('strongpass123'),
            'role' => 'platform_admin',
            'created_at' => '2026-03-27 00:00:00',
        ]);

        $response = $this->postJson('/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'wrong-password',
        ]);

        $response
            ->assertStatus(401)
            ->assertJsonPath('error', 'Invalid credentials.');
    }

    public function test_me_requires_bearer_token(): void
    {
        $response = $this->getJson('/auth/me');

        $response
            ->assertStatus(401)
            ->assertJsonPath('error', 'Missing bearer token.');
    }

    public function test_me_returns_authenticated_user_from_token(): void
    {
        $this->useInMemorySqlite();
        $this->createUsersTable();
        $this->createRefreshTokensTable();
        $this->setJwtConfig();

        $this->insertUser([
            'id' => '11111111-1111-4111-8111-111111111111',
            'tenant_id' => null,
            'email' => 'admin@example.com',
            'password' => Hash::make('strongpass123'),
            'role' => 'platform_admin',
            'created_at' => '2026-03-27 00:00:00',
        ]);

        $loginResponse = $this->postJson('/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'strongpass123',
        ]);

        $token = (string) $loginResponse->json('access_token');

        $meResponse = $this
            ->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->getJson('/auth/me');

        $meResponse
            ->assertStatus(200)
            ->assertJsonPath('user.id', '11111111-1111-4111-8111-111111111111')
            ->assertJsonPath('user.email', 'admin@example.com')
            ->assertJsonPath('user.role', 'platform_admin');
    }

    public function test_refresh_returns_new_session_tokens_for_valid_refresh_token(): void
    {
        $this->useInMemorySqlite();
        $this->createUsersTable();
        $this->createRefreshTokensTable();
        $this->setJwtConfig();

        $this->insertUser([
            'id' => '11111111-1111-4111-8111-111111111111',
            'tenant_id' => null,
            'email' => 'admin@example.com',
            'password' => Hash::make('strongpass123'),
            'role' => 'platform_admin',
            'created_at' => '2026-03-27 00:00:00',
        ]);

        $loginResponse = $this->postJson('/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'strongpass123',
        ]);

        $oldAccessToken = (string) $loginResponse->json('access_token');
        $oldRefreshToken = (string) $loginResponse->json('refresh_token');

        $refreshResponse = $this->postJson('/auth/refresh', [
            'refresh_token' => $oldRefreshToken,
        ]);

        $refreshResponse
            ->assertStatus(200)
            ->assertJsonPath('user.email', 'admin@example.com')
            ->assertJsonStructure(['access_token', 'refresh_token', 'expires_in']);

        $newAccessToken = (string) $refreshResponse->json('access_token');
        $newRefreshToken = (string) $refreshResponse->json('refresh_token');

        $this->assertNotSame($oldAccessToken, $newAccessToken);
        $this->assertNotSame($oldRefreshToken, $newRefreshToken);
    }

    public function test_refresh_returns_401_for_invalid_refresh_token(): void
    {
        $this->useInMemorySqlite();
        $this->createUsersTable();
        $this->createRefreshTokensTable();
        $this->setJwtConfig();

        $response = $this->postJson('/auth/refresh', [
            'refresh_token' => 'invalid-refresh-token-1234567890',
        ]);

        $response
            ->assertStatus(401)
            ->assertJsonPath('error', 'Invalid refresh token.');
    }

    public function test_logout_revokes_provided_refresh_token(): void
    {
        $this->useInMemorySqlite();
        $this->createUsersTable();
        $this->createRefreshTokensTable();
        $this->setJwtConfig();

        $this->insertUser([
            'id' => '11111111-1111-4111-8111-111111111111',
            'tenant_id' => null,
            'email' => 'admin@example.com',
            'password' => Hash::make('strongpass123'),
            'role' => 'platform_admin',
            'created_at' => '2026-03-27 00:00:00',
        ]);

        $loginResponse = $this->postJson('/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'strongpass123',
        ]);

        $accessToken = (string) $loginResponse->json('access_token');
        $refreshToken = (string) $loginResponse->json('refresh_token');

        $logoutResponse = $this
            ->withHeaders(['Authorization' => 'Bearer ' . $accessToken])
            ->postJson('/auth/logout', [
                'refresh_token' => $refreshToken,
            ]);

        $logoutResponse
            ->assertStatus(200)
            ->assertJsonPath('message', 'Logged out successfully.');

        $refreshResponse = $this->postJson('/auth/refresh', [
            'refresh_token' => $refreshToken,
        ]);

        $refreshResponse
            ->assertStatus(401)
            ->assertJsonPath('error', 'Invalid refresh token.');
    }

    public function test_logout_requires_bearer_token(): void
    {
        $response = $this->postJson('/auth/logout', []);

        $response
            ->assertStatus(401)
            ->assertJsonPath('error', 'Missing bearer token.');
    }

    private function useInMemorySqlite(): void
    {
        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
        ]);
    }

    private function createTenantsTable(): void
    {
        DB::statement('CREATE TABLE tenants (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            db_name VARCHAR(64) NOT NULL,
            db_username VARCHAR(64) NOT NULL,
            db_password TEXT NOT NULL,
            created_at TEXT NOT NULL
        )');
    }

    private function createUsersTable(): void
    {
        DB::statement('CREATE TABLE users (
            id VARCHAR(36) PRIMARY KEY,
            tenant_id VARCHAR(36) NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role VARCHAR(64) NOT NULL,
            created_at TEXT NOT NULL
        )');
    }

    private function createStoresTable(): void
    {
        DB::statement('CREATE TABLE stores (
            id VARCHAR(36) PRIMARY KEY,
            tenant_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            code VARCHAR(32) NOT NULL,
            created_at TEXT NOT NULL
        )');
    }

    private function createShiftsTable(): void
    {
        DB::statement('CREATE TABLE shifts (
            id VARCHAR(36) PRIMARY KEY,
            tenant_id VARCHAR(36) NOT NULL,
            store_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            opening_balance TEXT NOT NULL,
            closing_balance TEXT NULL,
            opened_at TEXT NOT NULL,
            closed_at TEXT NULL,
            created_at TEXT NOT NULL
        )');
    }

    private function createRefreshTokensTable(): void
    {
        DB::statement('CREATE TABLE auth_refresh_tokens (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            token_hash VARCHAR(64) NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            revoked_at TEXT NULL,
            created_at TEXT NOT NULL
        )');
    }

    private function insertUser(array $payload): void
    {
        DB::table('users')->insert($payload);
    }

    private function insertTenant(array $payload): void
    {
        DB::table('tenants')->insert($payload);
    }

    private function setJwtConfig(): void
    {
        config([
            'auth_jwt.secret' => 'test-jwt-secret-123456789',
            'auth_jwt.issuer' => 'pos-auth',
            'auth_jwt.audience' => 'pos-clients',
            'auth_jwt.access_ttl_seconds' => 3600,
            'auth_jwt.refresh_ttl_seconds' => 1209600,
        ]);
    }

    private function platformAuthHeaders(): array
    {
        return $this->authHeadersForRole('platform_admin');
    }

    private function tenantAdminAuthHeaders(): array
    {
        return $this->authHeadersForRole('tenant_admin', '22222222-2222-4222-8222-222222222222');
    }

    private function tenantUserAuthHeaders(): array
    {
        return $this->authHeadersForRole('user', '22222222-2222-4222-8222-222222222222');
    }

    private function authHeadersForRole(string $role, ?string $tenantId = null): array
    {
        $this->setJwtConfig();

        $token = app(JwtService::class)->issueAccessToken([
            'id' => '11111111-1111-4111-8111-111111111111',
            'role' => $role,
            'tenant_id' => $tenantId,
        ])['token'];

        return [
            'Authorization' => 'Bearer ' . $token,
        ];
    }
}
