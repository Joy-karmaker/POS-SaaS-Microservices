# AUTH FLOW (Baseline)

This document defines how login and post-login routing should work in this project.

## 1) Current State (As of March 27, 2026)

- `tenant-service` endpoints are currently open (no auth middleware yet).
- There is no dedicated Auth Service implemented yet.
- There is no backend-driven redirect logic yet.

So right now, there is no real "admin landing page after login" in backend.

## 2) Target Roles

We will use two main roles first:

- `platform_admin`
- `tenant_admin`

Future roles can be added later (example: `cashier`, `manager`).

## 3) Login Entry Points

- Control plane admin login UI: `/admin/login`
- Tenant app login UI: `/app/login`

These are frontend routes. Frontend will call Auth API.

## 4) Post-Login Destination

- `platform_admin` -> `/admin/tenants`
- `tenant_admin` -> `/app/dashboard`

Rule:

- Platform admin manages tenants, stores, staff at control-plane level.
- Tenant admin manages business data inside own tenant scope.

## 5) Auth API Contract (Planned)

Auth service endpoints:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

`POST /auth/login` response should return:

- `access_token`
- `refresh_token`
- `expires_in`
- `user` (id, name, role, tenant_id nullable)

## 6) JWT Claims (Minimum)

Access token should contain:

- `sub` (user id)
- `role`
- `tenant_id` (null for platform admin)
- `store_id` (optional now, useful later for POS shift/store context)
- `iat`
- `exp`
- `iss`
- `aud`

## 7) Gateway Responsibility

API gateway should:

- Validate token presence and format.
- Forward identity context headers to services.
- Block protected routes when token missing/invalid.

Suggested forwarded headers:

- `X-User-Id`
- `X-User-Role`
- `X-Tenant-Id`
- `X-Store-Id` (optional)

## 8) Service Access Rules (Initial)

Tenant service route policy:

- Public:
  - `GET /tenant/health`
- Protected:
  - `GET /tenant/tenants` (platform admin only)
  - `POST /tenant/tenants` (platform admin only)

Later, when tenant-specific endpoints are added:

- Tenant-scoped endpoints require matching `tenant_id` from token/context.

## 9) Login Sequence (High-Level)

1. User submits credentials from frontend login page.
2. Frontend calls `POST /auth/login` through gateway.
3. Auth service validates user/password and role.
4. Auth service returns tokens + user context.
5. Frontend stores token (secure strategy to be finalized).
6. Frontend redirects by role:
   - `platform_admin` -> `/admin/tenants`
   - `tenant_admin` -> `/app/dashboard`

## 10) Implementation Order (Recommended)

1. Build minimal Auth Service (`login`, `me`).
2. Add gateway auth check for protected routes.
3. Protect tenant service `GET/POST /tenants` for `platform_admin`.
4. Add frontend route guards for `/admin/*` and `/app/*`.
5. Add refresh-token flow.

## 11) Decision Summary

- Without login: only health endpoints should be accessible.
- After login:
  - Platform admin goes to control-plane admin area.
  - Tenant admin goes to tenant app dashboard.
- Tenant creation must be protected and should not remain public.

## 12) Tenant Identification Strategy

Use a stable internal ID for tenant identification:

- `tenant_id` (UUID) is the source of truth.
- Never use tenant name to identify tenant in APIs.

How identification should work:

1. At login, Auth Service issues JWT.
2. JWT includes:
   - `role`
   - `tenant_id` (null for `platform_admin`, required for `tenant_admin`)
3. Gateway validates token and forwards tenant context as header:
   - `X-Tenant-Id`
4. Backend services use `tenant_id` from trusted context (token/gateway), not from user payload.

Role behavior:

- `platform_admin`:
  - `tenant_id = null`
  - Allowed to call cross-tenant control-plane APIs (example: create/list tenants)
- `tenant_admin`:
  - `tenant_id = <uuid>`
  - Allowed only tenant-scoped APIs for own tenant

Enforcement rules:

- Do not trust frontend-sent `tenant_id` in body/query/route for authorization.
- If request tenant does not match token tenant, return `403 Forbidden`.
- Use `control_plane.tenants` to map `tenant_id` to tenant DB connection details (`db_name`, `db_username`, etc.).
