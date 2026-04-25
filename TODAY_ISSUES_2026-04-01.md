# Session Log - April 1, 2026

This file captures what we built today, why we built it, and the process flow we followed.

## Scope Of Today

- Core Service expansion in tenant-service:
  - Store management (create/list)
  - Shift management (open/current/close)
  - Staff/User management (create/list)
- Frontend tenant workspace expansion:
  - Stores page
  - Shift page
  - Staff page
- Keep learning-friendly architecture:
  - Controller -> Service -> Repository
  - Request validation + Resource response shaping
  - Role-based route protection

---

## 1) Store Management (Backend)

### What was added

- Endpoints:
  - `GET /tenant/stores`
  - `POST /tenant/stores`
- New backend modules:
  - `app/Http/Controllers/StoreController.php`
  - `app/Http/Requests/Store/StoreStoreRequest.php`
  - `app/Http/Resources/StoreResource.php`
  - `app/Services/StoreService.php`
  - `app/Repositories/StoreRepository.php`
  - `app/Exceptions/DuplicateStoreCodeException.php`
  - `app/Exceptions/StoreNotFoundException.php`
- Route guards:
  - list stores -> `platform_admin`, `tenant_admin`, `user`
  - create store -> `platform_admin`, `tenant_admin`

### Why it was needed

- Project flow requires Store service in Core block.
- Tenant operations need branch/store context before POS operations.

### Process flow (Store Create)

1. Request enters `POST /tenant/stores`.
2. JWT middleware validates token.
3. Role middleware checks permission.
4. `StoreStoreRequest` validates payload.
5. `StoreService` checks tenant and unique store code.
6. `StoreRepository` inserts row.
7. `StoreResource` returns standardized JSON.

---

## 2) Shift Management (Backend)

### What was added

- Endpoints:
  - `POST /tenant/shifts/open`
  - `GET /tenant/shifts/current?store_id=...`
  - `POST /tenant/shifts/close`
- New backend modules:
  - `app/Http/Controllers/ShiftController.php`
  - `app/Http/Requests/Shift/OpenShiftRequest.php`
  - `app/Http/Requests/Shift/CurrentShiftRequest.php`
  - `app/Http/Requests/Shift/CloseShiftRequest.php`
  - `app/Http/Resources/ShiftResource.php`
  - `app/Services/ShiftService.php`
  - `app/Repositories/ShiftRepository.php`
  - `app/Exceptions/ActiveShiftExistsException.php`
  - `app/Exceptions/ActiveShiftNotFoundException.php`
- Route guards:
  - shift APIs -> `tenant_admin`, `user`

### Why it was needed

- Project flow includes shift operations before full POS checkout lifecycle.
- Cashier workflows depend on open/close shift control.

### Process flow (Shift Open)

1. Request enters `POST /tenant/shifts/open`.
2. JWT + role middleware validate access.
3. `OpenShiftRequest` validates `store_id`, `opening_balance`.
4. `ShiftService` verifies store belongs to tenant.
5. `ShiftService` checks no active shift exists for same user+store.
6. `ShiftRepository` inserts shift row with `opened_at`.
7. `ShiftResource` returns `status: open`.

### Process flow (Shift Close)

1. Request enters `POST /tenant/shifts/close`.
2. JWT + role middleware validate access.
3. `CloseShiftRequest` validates payload.
4. `ShiftService` finds active shift.
5. Repository updates `closed_at` and `closing_balance`.
6. Resource returns `status: closed`.

---

## 3) Staff/User Management (Backend)

### What was added

- Endpoints:
  - `GET /tenant/users`
  - `POST /tenant/users`
- New backend modules:
  - `app/Http/Controllers/StaffUserController.php`
  - `app/Http/Requests/Staff/StoreStaffUserRequest.php`
  - `app/Http/Resources/StaffUserResource.php`
  - `app/Services/StaffUserService.php`
  - `app/Exceptions/DuplicateUserEmailException.php`
  - `app/Exceptions/TenantNotFoundException.php`
- `UserRepository` enhancements:
  - list users by tenant
  - create tenant user
  - staff list filtering to `tenant_admin` + `user` roles
- Route guards:
  - users APIs -> `platform_admin`, `tenant_admin`
  - tenant_admin can create only `user`
  - `user` role blocked from staff APIs

### Why it was needed

- Project flow includes User/Staff in Core Service.
- Needed first operational slice for tenant-admin to onboard staff.

### Process flow (Staff Create by Tenant Admin)

1. Request enters `POST /tenant/users`.
2. JWT + role middleware validate access.
3. `StoreStaffUserRequest` validates email/password/role.
4. Controller enforces tenant-admin rule (`role` must be `user`).
5. `StaffUserService` checks tenant exists and email uniqueness.
6. Password is hashed, user inserted via repository.
7. `StaffUserResource` returns safe output (no password).

---

## 4) Core Schema Updates

### What changed

- Updated control-plane init SQL:
  - `infra/mysql/init/001-control-plane.sql`
  - Added tables: `stores`, `shifts`
- Added runtime schema guard for existing DB volumes:
  - `app/Services/CoreSchemaService.php`
  - Creates `stores` / `shifts` tables if missing.

### Why

- `docker-entrypoint-initdb.d` runs only on fresh MySQL volume.
- Runtime schema guard avoids manual DB reset during development.

---

## 5) Frontend Expansion (Tenant App)

### New pages/routes

- `/app/stores` -> `TenantStoresPage`
- `/app/shift` -> `TenantShiftPage`
- `/app/staff` -> `TenantStaffPage` (tenant_admin only)
- Shared tenant nav:
  - `frontend/src/components/TenantNav.jsx`

### New frontend API/hook modules

- `frontend/src/api/storeApi.js`
- `frontend/src/api/shiftApi.js`
- `frontend/src/api/staffApi.js`
- `frontend/src/hooks/useStores.js`
- `frontend/src/hooks/useShift.js`
- `frontend/src/hooks/useStaffUsers.js`

### Updated app wiring

- `frontend/src/App.jsx`
- `frontend/src/pages/TenantDashboardPage.jsx`
- `frontend/src/App.css` (form select styles)

### Frontend process flow (Staff page)

1. Tenant admin opens `/app/staff`.
2. Page loads existing users via `GET /tenant/users`.
3. Form submit calls `POST /tenant/users`.
4. On success, new user row prepends in UI list.
5. Errors are surfaced through shared HTTP error parser.

---

## 6) AuthZ Rules Applied Today

- `platform_admin`:
  - full tenant management + can manage users by tenant
- `tenant_admin`:
  - create/list stores
  - open/close/current shift
  - create/list staff users (`user` only)
- `user`:
  - list stores
  - open/close/current shift
  - cannot access staff user endpoints

---

## 7) Verification Summary

- Backend:
  - `php artisan test` -> **27 passed**, **103 assertions**
  - Includes new tests for stores, shifts, and staff authorization.
- Frontend:
  - `npm run build` -> passed
- Route check:
  - `php artisan route:list --path=users` shows both staff routes.

---

## 8) Suggested Next Step (Learning Sequence)

1. Staff update/deactivate endpoints (`PUT/PATCH /tenant/users/{id}`).
2. Optional `store_id` assignment for staff users.
3. Enforce store-level scope in shift and future POS actions.

---

## 9) API Cheat Sheet (Gateway: `http://localhost`)

Use these from project root terminal.  
All API paths go through gateway with `/tenant/*`.

### A) Health

```powershell
curl http://localhost/health
curl http://localhost/tenant/health
```

### B) Bootstrap Platform Admin (local only)

```powershell
curl -X POST http://localhost/tenant/auth/bootstrap-admin `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"admin@example.com\",\"password\":\"strongpass123\"}"
```

### C) Login (Get Access + Refresh Token)

```powershell
curl -X POST http://localhost/tenant/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"admin@example.com\",\"password\":\"strongpass123\"}"
```

Expected core fields:

- `access_token`
- `refresh_token`
- `user.role`
- `expires_in`

### D) Refresh Access Token

```powershell
curl -X POST http://localhost/tenant/auth/refresh `
  -H "Content-Type: application/json" `
  -d "{\"refresh_token\":\"<REFRESH_TOKEN>\"}"
```

### E) Current User (Me)

```powershell
curl http://localhost/tenant/auth/me `
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### F) Logout

```powershell
curl -X POST http://localhost/tenant/auth/logout `
  -H "Authorization: Bearer <ACCESS_TOKEN>" `
  -H "Content-Type: application/json" `
  -d "{\"refresh_token\":\"<REFRESH_TOKEN>\"}"
```

### G) Tenant Provisioning (platform_admin)

```powershell
curl -X POST http://localhost/tenant/tenants `
  -H "Authorization: Bearer <ACCESS_TOKEN>" `
  -H "Content-Type: application/json" `
  -d "{\"name\":\"Demo Store Dhaka\"}"
```

```powershell
curl http://localhost/tenant/tenants `
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### H) Store APIs

Create store (tenant_admin or platform_admin):

```powershell
curl -X POST http://localhost/tenant/stores `
  -H "Authorization: Bearer <ACCESS_TOKEN>" `
  -H "Content-Type: application/json" `
  -d "{\"name\":\"Main Outlet\",\"code\":\"MAIN-001\"}"
```

List stores:

```powershell
curl http://localhost/tenant/stores `
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Platform filter by tenant:

```powershell
curl "http://localhost/tenant/stores?tenant_id=<TENANT_ID>" `
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### I) Shift APIs

Open shift:

```powershell
curl -X POST http://localhost/tenant/shifts/open `
  -H "Authorization: Bearer <ACCESS_TOKEN>" `
  -H "Content-Type: application/json" `
  -d "{\"store_id\":\"<STORE_ID>\",\"opening_balance\":1000}"
```

Current shift:

```powershell
curl "http://localhost/tenant/shifts/current?store_id=<STORE_ID>" `
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Close shift:

```powershell
curl -X POST http://localhost/tenant/shifts/close `
  -H "Authorization: Bearer <ACCESS_TOKEN>" `
  -H "Content-Type: application/json" `
  -d "{\"store_id\":\"<STORE_ID>\",\"closing_balance\":1200.50}"
```

### J) Staff/User APIs

Create staff user (tenant_admin -> only `role=user`):

```powershell
curl -X POST http://localhost/tenant/users `
  -H "Authorization: Bearer <ACCESS_TOKEN>" `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"cashier.one@example.com\",\"password\":\"cashierpass123\",\"role\":\"user\"}"
```

Create tenant admin (platform_admin only):

```powershell
curl -X POST http://localhost/tenant/users `
  -H "Authorization: Bearer <ACCESS_TOKEN>" `
  -H "Content-Type: application/json" `
  -d "{\"tenant_id\":\"<TENANT_ID>\",\"email\":\"tenant.admin2@example.com\",\"password\":\"tenantpass123\",\"role\":\"tenant_admin\"}"
```

List staff users:

```powershell
curl http://localhost/tenant/users `
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```
