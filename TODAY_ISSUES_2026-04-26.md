# Session Log - April 26, 2026

## Scope

- Migrate username/password login (replacing email-based auth).
- Add Redis monitoring guidance.
- Create `tenants` table in tenant-service.
- Fix `Token generation failed` error on admin login.

---

## Issue 1: `Token generation failed` on Admin Login

### Problem

- After switching from email to username-based auth and adding Docker volume mounts, login returned `500 Token generation failed`.

### Root Cause

- Adding `volumes` to `docker-compose.yml` caused the **service-level `.env` files** (`services/auth-service-laravel/.env` and `services/tenant-service-laravel/.env`) to be read directly by Laravel **instead of** the environment variables injected by docker-compose.
- The service `.env` files still had:
  - `REDIS_HOST=127.0.0.1` (localhost — not reachable inside Docker network)
  - `SESSION_DRIVER=file`
  - `CACHE_STORE=file`
- This caused the `RefreshTokenRepository` to fail when attempting to connect to Redis.

### Fix Applied

1. Updated `services/auth-service-laravel/.env`:
   - `REDIS_HOST=127.0.0.1` → `REDIS_HOST=redis`
   - `SESSION_DRIVER=file` → `SESSION_DRIVER=redis`
   - `CACHE_STORE=file` → `CACHE_STORE=redis`

2. Updated `services/tenant-service-laravel/.env`:
   - Same changes as above.

3. Cleared Laravel config cache inside the container:
   ```bash
   docker exec auth-service php artisan config:clear
   ```

### Verification

- `POST http://localhost/auth/login` with `{"username": "superadmin", "password": "super123"}` returned a valid JWT access token and refresh token.

---

## Issue 2: Bootstrap Admin returned `409 Conflict` on retry

### Problem

- After `migrate:fresh` was skipped initially, a platform admin was already created. Re-running bootstrap returned a conflict.

### Root Cause

- The `bootstrapPlatformAdmin` endpoint correctly prevents creating a second admin. A stale user record existed from a previous test run.

### Fix Applied

- Ran `docker exec auth-service php artisan migrate:fresh` to wipe and recreate the `users` table cleanly.
- Re-bootstrapped admin via:
  ```bash
  POST /auth/bootstrap-admin  {"username": "superadmin", "password": "super123"}
  ```

### Verification

- Bootstrap returned `201 Created` with the new platform admin user.

---

## Issue 3: `AuthUserResource` returning empty `email: ""`

### Problem

- After switching from email to username, the API login response still returned `"email": ""` — an empty, stale field.

### Root Cause

- `AuthUserResource.php` still mapped the old `email` column which no longer exists in the `users` table.

### Fix Applied

- Updated `app/Http/Resources/AuthUserResource.php`:
  - Replaced `'email' => data_get(...)` with `'username' => data_get(...)`

### Verification

- Login response now correctly returns `"username": "superadmin"` instead of `"email": ""`.

---

## Changes Made Today

| File | Change |
|---|---|
| `services/auth-service-laravel/.env` | `REDIS_HOST=redis`, `SESSION_DRIVER=redis`, `CACHE_STORE=redis` |
| `services/tenant-service-laravel/.env` | Same Redis/session/cache fixes |
| `app/Http/Resources/AuthUserResource.php` | Replaced `email` with `username` in response |
| `docker-compose.yml` | Added volume mounts for auth and tenant services |
| `services/tenant-service-laravel/database/migrations/` | Created `tenants` table migration |
| `services/tenant-service-laravel/app/Models/Tenant.php` | Created Tenant Eloquent model |

---

## Current Run Commands

```powershell
docker-compose up -d
docker exec auth-service php artisan config:clear
docker exec auth-service php artisan migrate:fresh
```

Admin Login URL: `http://localhost:5173/admin/login`
- Username: `superadmin`
- Password: `super123`
