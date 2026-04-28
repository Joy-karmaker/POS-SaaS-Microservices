# TODAY'S ISSUES - 2026-04-27

This document summarizes the issues identified and resolved during the refinement of the POS SaaS Microservices architecture.

## 1. Identified Issues & Solutions

### A. Authentication & Routing Errors
*   **Issue**: `Target class [StaffUserController] does not exist` error in Auth Service.
*   **Cause**: Missing `use` statement in `routes/web.php` after moving staff management logic.
*   **Solution**: Added correct imports and cleaned up unused references to `TenantController` in the Auth Service.

### B. Tenant Resolution (Slug vs. Name)
*   **Issue**: Login failing for tenant admins because the frontend sends a slug (e.g., `demostore`) but the DB contains the name with spaces (e.g., `demo store`).
*   **Cause**: The SQL query used `LOWER(name) = ?`, which failed to match when spaces were involved.
*   **Solution**: Updated `AuthController` to use `LOWER(REPLACE(name, ' ', ''))` in the resolution logic.

### C. Frontend Password Field Missing
*   **Issue**: Backend required `owner_password` during tenant provisioning, but the React frontend only provided the name.
*   **Cause**: Frontend was not yet updated for the new security requirements.
*   **Solution**: 
    *   Updated `AdminTenantsPage.jsx` with an "Initial Owner Password" field.
    *   Updated `useTenants` hook and `tenantApi.js` to pass the password to the backend.

### D. Identity Management (Email to Username)
*   **Issue**: System still expected emails in several places despite switching to a `shopname.username` naming convention.
*   **Solution**: 
    *   Refactored `StaffUserService` to auto-prefix usernames with the tenant's slugified shop name and remove email dependencies.

### E. Redis Refresh Token Expiration (The "1-Second Bug")
*   **Issue**: Refresh tokens were being issued but were not appearing in Redis.
*   **Cause**: A timezone mismatch in the TTL (Time-To-Live) calculation resulted in a 1-second expiration.
*   **Solution**: Refactored the code to pass the `TTL` (14 days) directly from the Service to the Repository, bypassing the calculation.

### F. PHP Redis Static Call Conflict
*   **Issue**: `Non-static method Redis::setex() cannot be called statically`.
*   **Cause**: Conflict between Laravel's `Redis` Facade and the native `phpredis` extension.
*   **Solution**: Switched all Redis calls in the repository to use `Redis::connection()->method()` for explicit manager access.

---

---

## 2. Docker Inspection Commands

These commands were used to diagnose the system state and verify fixes.

### Service Logs
```powershell
# View recent logs for a specific service
docker compose logs auth-service --tail 50

# Follow Laravel logs in real-time
docker compose exec auth-service tail -f storage/logs/laravel.log
```

### Database Inspection (MySQL)
```powershell
# List all users to verify roles and tenant_ids
docker compose exec mysql mysql -uroot -proot -e "SELECT username, role, tenant_id FROM users;" control_plane

# List all tenants to check shop names and UUIDs
docker compose exec mysql mysql -uroot -proot -e "SELECT id, name FROM tenants;" control_plane

# CRITICAL: Database Migration Pattern (Shared DB)
# Since both services share 'control_plane', use migrate:fresh ONLY in one service.
docker compose exec auth-service php artisan migrate:fresh
docker compose exec tenant-service php artisan migrate  # DO NOT USE :fresh here or it wipes auth tables!
```

### Redis Inspection (Deep Dive)
Redis is divided into 16 databases (0-15). Our project uses:
- **DB 0**: User Sessions & Refresh Tokens
- **DB 1**: Cache & Rate Limiting (Throttling)

```powershell
# 1. See Sessions & Refresh Tokens
docker compose exec redis redis-cli -n 0 KEYS "*"
# Pattern: laravel_database_laravel_cache_* (Sessions)
# Pattern: laravel_database_auth:rt:* (Refresh Tokens)

# 2. See Login Throttles (Rate Limiting)
docker compose exec redis redis-cli -n 1 KEYS "*"
# Pattern: laravel_database_laravel_cache_login_attempts:*

# 3. View a specific key's value (e.g., a Refresh Token)
docker compose exec redis redis-cli GET "laravel_database_auth:rt:hash:REPLACE_WITH_HASH"

# 4. View TTL (Time-To-Live) for a key (in seconds)
docker compose exec redis redis-cli TTL "key_name"

# 5. Monitor all Redis activity in real-time (very useful for debugging)
docker compose exec redis redis-cli monitor
```

### Laravel Debugging (Artisan Tinker)
```powershell
# Open Tinker
docker compose exec auth-service php artisan tinker

# --- USEFUL TINKER COMMANDS ---

# 1. Reset Superadmin Password
DB::table('users')->where('username', 'superadmin')->update(['password' => Hash::make('password123')]);

# 2. Check current Cache Config
config('cache.default');
config('database.redis.cache.database');

# 3. Manually clear Rate Limiter for a user
RateLimiter::clear('login_attempts:127.0.0.1:tenant_slug:username');

# 4. Clear ALL Cache (DB 1)
php artisan cache:clear
```

### Internal Service Networking
*   **Auth Service Internal URL**: `http://auth-service:8080` (used by Tenant Service)
*   **Gateway URL**: `http://gateway` (Entry point for frontend)
*   **Shared DB**: Both services use `mysql` host on port `3306`.
