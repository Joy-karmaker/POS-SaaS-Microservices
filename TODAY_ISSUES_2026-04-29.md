# TODAY'S ISSUES - 2026-04-29

## 1. Identified Issues & Solutions

### A. 1-Hour Session Logout Bug
*   **Issue**: The user was being logged out after exactly 1 hour, despite the Refresh Token being configured to last 14 days (`AUTH_JWT_REFRESH_TTL=1209600`).
*   **Cause**: The frontend was silently sending a background refresh request to `/auth/refresh` when the 1-hour access token expired. Because the frontend relies on the secure `HttpOnly` cookie to transmit the refresh token, it sent an empty JSON body `{}`. However, `RefreshTokenRequest.php` had a strict `required` rule for the `refresh_token` payload field, causing Laravel to block the request with a `422 Unprocessable Entity` validation error.
*   **Solution**: Changed the validation rule for `refresh_token` in `RefreshTokenRequest.php` from `required` to `nullable`. This allows the empty request body to pass validation, while the `AuthController` securely extracts the token from the `pos_refresh_token` cookie. The silent refresh now succeeds seamlessly.

### B. Microservice Code Redundancy Cleanup
*   **Issue**: During the initial separation of the Auth and Tenant microservices, massive amounts of domain-specific code were accidentally duplicated across both services, blurring the boundaries of the architecture.
*   **Solution**:
    *   **Auth Service Cleanup**: Permanently deleted tenant-domain Repositories (`AuditLog`, `ProcessedEvent`, `Shift`, `Store`), Services (`TenantProvisioning`, `CoreSchemaService`, `ShiftClosedPublisher`), APIs/Resources (`ShiftResource`, `StoreResource`, `TenantResource`), and background workers (`ConsumeShiftClosedCommand`).
    *   **Tenant Service Cleanup**: Permanently deleted auth-domain HTTP Requests (`LoginRequest`, `LogoutRequest`, `RefreshTokenRequest`, `BootstrapPlatformAdminRequest`) and Resources (`AuthUserResource`).
    *   **Environment Variables**: Wiped all redundant database, Redis, RabbitMQ, and JWT configurations from the inner `services/*/.env` files. The system now strictly relies on the **root `.env`** file and `docker-compose.yml` as the single source of truth.

## 2. Next Planned Step (Tomorrow)
*   **Service 2: Catalog + Inventory**: We have agreed to build the next microservice (Products/Catalog) using **NestJS** and **TypeScript**. This polyglot approach will test our API Gateway routing, RabbitMQ event consumption (for dynamic table creation), and porting the dynamic tenant database connection logic to Node.js.
