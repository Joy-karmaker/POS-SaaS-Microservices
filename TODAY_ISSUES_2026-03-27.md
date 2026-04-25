# Session Log - March 27, 2026

This file summarizes what we changed today, why we changed it, and how we verified each part.

## Scope Of Today

- Continue tenant-service improvements with cleaner architecture.
- Introduce Auth backend baseline (`bootstrap-admin`, `login`, `me`).
- Build frontend login flow for `platform_admin` and `tenant_admin/user`.

## 1) Tenant Provisioning Refactor (Backend)

- Problem:
  - `TenantProvisioningService` was doing too many jobs in one class (naming, DB admin, schema creation, orchestration).
- Why this mattered:
  - Harder to learn, test, and maintain.
- Changes:
  - Kept orchestration in:
    - `services/tenant-service-laravel/app/Services/TenantProvisioningService.php`
  - Extracted payload generation:
    - `services/tenant-service-laravel/app/Services/TenantProvisioning/TenantProvisioningPayloadFactory.php`
  - Extracted DB/user management + rollback:
    - `services/tenant-service-laravel/app/Services/TenantProvisioning/TenantDatabaseManager.php`
  - Extracted tenant schema creation:
    - `services/tenant-service-laravel/app/Services/TenantProvisioning/TenantSchemaProvisioner.php`
- Verification:
  - `php artisan test` passed after refactor.

## 2) Frontend HTTP Layer Migration (Fetch -> Axios)

- Problem:
  - We had `fetch` in multiple places with repeated error handling logic.
- Why this mattered:
  - Inconsistent request/error behavior and more code duplication.
- Changes:
  - Added shared Axios client:
    - `frontend/src/api/apiClient.js`
  - Replaced tenant API calls with Axios:
    - `frontend/src/api/tenantApi.js`
  - Replaced health checks with Axios:
    - `frontend/src/App.jsx`
  - Added shared response/error parser:
    - `frontend/src/api/httpUtils.js`
  - Installed dependency:
    - `axios` in `frontend/package.json`
- Verification:
  - `npm run build` completed successfully.
  - No remaining `fetch(` in `frontend/src`.

## 3) API Standardization In Tenant Service (Requested Items 1 + 2)

- Problem:
  - Validation and response shaping were manual in controller.
  - Duplicate tenant names were not mapped to a clear business error code.
- Changes:
  - Added request validation class:
    - `services/tenant-service-laravel/app/Http/Requests/StoreTenantRequest.php`
  - Added response resource:
    - `services/tenant-service-laravel/app/Http/Resources/TenantResource.php`
  - Added duplicate business exception:
    - `services/tenant-service-laravel/app/Exceptions/DuplicateTenantException.php`
  - Added duplicate check in service:
    - `services/tenant-service-laravel/app/Services/TenantProvisioningService.php`
  - Added repository helper:
    - `services/tenant-service-laravel/app/Repositories/TenantRepository.php`
  - Updated controller to return:
    - `422` for validation
    - `409` for duplicate tenant name
    - `500` for unexpected failures
- Verification:
  - Added/updated tests in:
    - `services/tenant-service-laravel/tests/Feature/ExampleTest.php`
  - `php artisan test` passed.

## 4) Auth Backend Baseline Implemented

- Problem:
  - Auth endpoints were missing.
  - Schema mismatch: `users.tenant_id` was `NOT NULL`, but `platform_admin` needs `tenant_id = null`.
- Changes:
  - Added JWT config:
    - `services/tenant-service-laravel/config/auth_jwt.php`
  - Added user repository for auth:
    - `services/tenant-service-laravel/app/Repositories/UserRepository.php`
  - Added JWT issue/validate service:
    - `services/tenant-service-laravel/app/Services/Auth/JwtService.php`
  - Added auth requests/resources:
    - `services/tenant-service-laravel/app/Http/Requests/Auth/LoginRequest.php`
    - `services/tenant-service-laravel/app/Http/Requests/Auth/BootstrapPlatformAdminRequest.php`
    - `services/tenant-service-laravel/app/Http/Resources/AuthUserResource.php`
  - Added auth controller:
    - `services/tenant-service-laravel/app/Http/Controllers/AuthController.php`
  - Added JWT middleware:
    - `services/tenant-service-laravel/app/Http/Middleware/AuthenticateJwt.php`
  - Registered auth routes:
    - `services/tenant-service-laravel/routes/web.php`
  - Registered middleware alias + CSRF exceptions:
    - `services/tenant-service-laravel/bootstrap/app.php`
  - Added env values:
    - `.env`, `.env.example`, and `docker-compose.yml` (`AUTH_JWT_*`)
  - Fixed schema to allow platform admin:
    - `infra/mysql/init/001-control-plane.sql` (`tenant_id` nullable)
  - Applied live DB change:
    - `ALTER TABLE users MODIFY tenant_id CHAR(36) NULL;`
- Endpoints available now:
  - `POST /tenant/auth/bootstrap-admin`
  - `POST /tenant/auth/login`
  - `GET /tenant/auth/me` (Bearer token required)
- Verification:
  - `php artisan route:list --path=auth` shows 3 routes.
  - Feature tests passed.
  - Live smoke test via gateway succeeded for bootstrap/login/me.

## 5) Frontend Auth Flow Implemented

- Goal:
  - Login from frontend as:
    - `platform_admin`
    - `tenant_admin` / `user`
- Changes:
  - Added auth API client wrappers:
    - `frontend/src/api/authApi.js`
  - Added local session storage helpers:
    - `frontend/src/api/authStorage.js`
  - Added auth hook (session restore/login/logout/bootstrap):
    - `frontend/src/hooks/useAuth.js`
  - Added token header support in Axios client:
    - `frontend/src/api/apiClient.js`
  - Updated tenants hook to run only for platform admin session:
    - `frontend/src/hooks/useTenants.js`
  - Reworked app UI for role-based login and role-based panels:
    - `frontend/src/App.jsx`
    - `frontend/src/App.css`
- Behavior now:
  - Not logged in:
    - Login screen with mode switch (`Platform Admin` vs `Tenant Admin / User`).
    - Optional dev bootstrap form for first admin.
  - Logged in as `platform_admin`:
    - Tenant provisioning UI + tenant list.
  - Logged in as `tenant_admin` or `user`:
    - Tenant workspace placeholder panel.

## 6) Demo Accounts Prepared For Immediate Testing

Created/verified accounts in `control_plane.users`:

- Platform admin:
  - `admin@example.com` / `strongpass123`
- Tenant admin:
  - `tenant.admin@example.com` / `tenant12345`
- Tenant user:
  - `tenant.user@example.com` / `tenant12345`

## 7) Final Verification Snapshot

- Backend tests:
  - `php artisan test` -> passed.
- Frontend build:
  - `npm run build` -> passed.
- Live auth checks through gateway:
  - `POST /tenant/auth/bootstrap-admin` -> works.
  - `POST /tenant/auth/login` -> works for all 3 roles above.
  - `GET /tenant/auth/me` with Bearer token -> works.

## 8) Follow-Up Update (Applied On April 1, 2026)

We implemented the previously recommended items #1 and #2.

### 8.1 Backend Endpoint Protection Applied

- What changed:
  - Added role middleware:
    - `services/tenant-service-laravel/app/Http/Middleware/RequireRole.php`
  - Registered middleware alias:
    - `services/tenant-service-laravel/bootstrap/app.php` (`role`)
  - Secured tenant endpoints:
    - `GET /tenants`
    - `POST /tenants`
    - Now require: `auth.jwt` + `role:platform_admin`
    - Routes updated in:
      - `services/tenant-service-laravel/routes/web.php`
- Why this matters:
  - Tenant provisioning/listing is now blocked for unauthenticated users.
  - Non-platform roles cannot access control-plane tenant management APIs.
- Verification:
  - Backend tests passed with new authz assertions.
  - Runtime checks:
    - No token on `/tenant/tenants` -> `401`
    - `platform_admin` token -> `200`
    - `tenant_admin` token -> `403`

### 8.2 Frontend Route Guards + Separate Role Paths Applied

- What changed:
  - Added `react-router-dom` and switched to route-based frontend.
  - Route structure now:
    - `/admin/login`
    - `/admin/tenants` (guarded: `platform_admin`)
    - `/app/login`
    - `/app/dashboard` (guarded: `tenant_admin` or `user`)
  - Added guard component:
    - `frontend/src/components/ProtectedRoute.jsx`
  - Added page split:
    - `frontend/src/pages/AdminLoginPage.jsx`
    - `frontend/src/pages/TenantLoginPage.jsx`
    - `frontend/src/pages/AdminTenantsPage.jsx`
    - `frontend/src/pages/TenantDashboardPage.jsx`
  - Added shared health hook/component:
    - `frontend/src/hooks/useServiceHealth.js`
    - `frontend/src/components/HealthCard.jsx`
  - Updated app/router wiring:
    - `frontend/src/App.jsx`
    - `frontend/src/main.jsx`
- Why this matters:
  - Frontend now mirrors backend role boundaries.
  - Clear and explicit paths for admin and tenant flows.
- Verification:
  - Frontend build passed after routing updates.
  - Login redirects now follow role-to-path mapping.

## 9) Next Recommended Step

Now that endpoint protection and route guards are done:

1. Keep using current JWT utility for learning pace, but plan migration to a standard auth solution before production/multi-service scale.
2. Add backend role middleware to additional future endpoints as they are introduced.
3. Add frontend route-level tests for guard behavior (unauthenticated, wrong role, correct role).
