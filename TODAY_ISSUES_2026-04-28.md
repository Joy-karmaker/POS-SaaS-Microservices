# TODAY'S ISSUES - 2026-04-28

This document summarizes the issues identified and resolved during the refinement of the POS SaaS Microservices architecture, specifically focusing on data isolation.

## 1. Identified Issues & Solutions

### A. Tenant Database Isolation (Stores & Shifts)
*   **Issue**: Store and Shift data were being saved in the central `control_plane` database instead of the tenant's isolated database. This violated the principle of data isolation between customers.
*   **Solution**: 
    *   **Dynamic Connection**: Added a dynamic `tenant` connection template in `config/database.php`.
    *   **Connection Manager**: Created a `TenantConnectionManager` service that reads tenant database credentials from the control plane and reconfigures the `tenant` connection at runtime.
    *   **Repository Updates**: Updated `StoreRepository` and `ShiftRepository` to use the isolated `tenant` connection instead of the default one.
    *   **Isolated Provisioning**: Updated `TenantSchemaProvisioner` to include `stores` and `shifts` tables, ensuring every new tenant gets their own private tables upon signup.
    *   **Manual Migration**: Retrofitted the existing `demo store` database with the new `stores`, `shifts`, and `staff_profiles` tables to allow immediate testing without data loss.

### C. Staff Management Orchestration
*   **Issue**: Frontend was still using "Email" and missing store assignments. Backend routes for staff management were not defined in the Tenant Service.
*   **Solution**: 
    *   **Route Fix**: Resolved "Route not found" by defining the `/users` endpoints in the Tenant Service and mapping them through the gateway.

### D. Structured Role Management
*   **Issue**: Staff roles were just strings, making it hard to manage permissions consistently.
*   **Solution**: 
    *   **Roles Table**: Created a `staff_roles` table in the isolated tenant database using an **INT AUTO_INCREMENT** primary key.
    *   **Default Seeding**: Automatically seed `Cashier` and `Manager` roles during tenant provisioning.
    *   **Role-Based Linking**: Updated `staff_profiles` to use an **INT** `role_id` (foreign key) instead of a UUID.
    *   **Hybrid Identity Architecture**: User credentials (username/password) stay in the central **Auth Service**, while business metadata (name, role, store, phone) is stored in the isolated **Tenant Database**.
    *   **UI Dropdown**: Added a dynamic dropdown to the "Create Staff" page that fetches roles directly from the tenant's database.

### E. Cross-Service Auth & Cookie Decryption
*   **Issue**: Creating staff failed with "Missing bearer token" or "Refresh token required" errors.
*   **Cause**: 
    1.  **Encryption Mismatch**: Even with the same `APP_KEY`, Laravel services can sometimes fail to decrypt each other's cookies if not configured correctly.
    2.  **Header vs Cookie**: The Tenant Service was only looking for the `Authorization` header when calling the Auth Service, but the frontend primarily uses cookies.
*   **Solution**: 
    *   **Disabled Encryption**: Added `pos_access_token` and `pos_refresh_token` to the `encryptCookies` exception list in both services.
    *   **Manual Extraction**: Updated `StaffUserController` to explicitly check for the access token in cookies when proxying requests to the Auth Service.

### G. Role-Based Navigation & Route Protection
*   **Issue**: Staff members (role `user`) could see and access administrative modules like Dashboard and Stores.
*   **Solution**: 
    *   **Conditional Navigation**: Updated `TenantNav` to fetch the tenant-specific profile and show/hide links based on business roles (**Manager, Staff, Cashier**).
    *   **Profile Endpoint**: Added `/tenant/users/me` to the Tenant Service to provide business role context to the frontend.
    *   **Route Guards**: Updated `App.jsx` and `ProtectedRoute` to strictly block access to Dashboard, Stores, and Staff pages for non-admin users.
    *   **Default Landing**: Updated routing logic to automatically send staff members to the **Shift** module upon login.

### F. Missing Username in Staff List
*   **Issue**: Staff list was showing `N/A` for usernames.
*   **Cause**: The `StaffUserResource` in the Auth Service was still returning the `email` field instead of `username`.
*   **Solution**: Updated `StaffUserResource` to correctly return the `username` field.

### H. Platform-Wide Integer ID Migration (UUID to INT)
*   **Issue**: UUID-based primary keys were creating complexity in URL handling and database indexing for a system of this scale.
*   **Solution**: 
    *   **Primary Keys**: Migrated all tables in both Auth and Tenant services to use **INT AUTO_INCREMENT** primary keys.
    *   **Resource Alignment**: Updated all API Resources to cast IDs to integers for consistent frontend consumption.
    *   **Bug Fixes**: 
        *   Resolved "Store creation failed" by removing manual UUID insertion logic in `StoreService`.
        *   Fixed "Shift not working" by updating the frontend to handle numeric IDs instead of calling `.trim()` on them.
    *   **Database Reset**: Re-migrated the control plane and tenant databases to ensure a clean, integer-based state.

## 2. Docker Inspection Commands (Tenant DB Focus)

### Check Tenant DB Contents
```powershell
# Replace 'demo_store_e4c753' with the tenant's actual db_name
docker compose exec mysql mysql -uroot -proot -e "SELECT * FROM stores;" demo_store_e4c753
```

### Verify Dynamic Switching
If you want to see which DB the application is currently talking to during a request, you can monitor MySQL queries:
```powershell
# Monitor all MySQL queries (requires root)
docker compose exec mysql mysql -uroot -proot -e "SET GLOBAL general_log = 'ON';"
docker compose exec mysql tail -f /var/lib/mysql/mysql.log
```
