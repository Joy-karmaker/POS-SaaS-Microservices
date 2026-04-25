# POS SaaS Microservices - Phase 1

Phase 1 includes:

- Docker Compose infrastructure
- API Gateway (Nginx)
- Auth Service + Tenant Service split

Architecture map:

- See `PROJECT_DIAGRAM.md`

Frontend app:

- React dashboard is in `frontend/`

Backend services:

- `services/auth-service-laravel` (auth endpoints)
- `services/tenant-service-laravel` (tenant domain endpoints)

## Stack

- MySQL 8.4
- RabbitMQ 3.13 (management UI enabled)
- Redis 7.4
- Nginx API Gateway
- Laravel 12 auth-service + tenant-service

## Quick Start

1. Copy env file:

```powershell
Copy-Item .env.example .env
```

If needed, generate a fresh Laravel key for tenant service and set `TENANT_SERVICE_APP_KEY`.

2. Start containers:

```powershell
docker compose up --build
```

3. Check gateway health:

```powershell
curl http://localhost/health
```

4. Check tenant-service health through gateway:

```powershell
curl http://localhost/tenant/health
```

5. Check auth-service health through gateway:

```powershell
curl http://localhost/auth/health
```

6. Provision a tenant:

```powershell
curl -X POST http://localhost/tenant/tenants `
  -H "Content-Type: application/json" `
  -d '{"name":"Demo Store"}'
```

## Frontend Quick Start

Run frontend from Docker (no local Node.js required):

```powershell
docker compose up --build frontend
```

Or start everything together:

```powershell
docker compose up --build
```

Frontend opens at `http://localhost:5173` and proxies API calls to `http://localhost`.
In Docker mode, Vite proxy target is `http://gateway` (service name on Docker network).

If you still want local mode later:

```powershell
cd frontend
npm install
npm run dev
```

## Endpoints

- `GET /auth/health`
- `POST /auth/bootstrap-admin`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /tenant/health`
- `POST /tenant/tenants`
- `POST /tenant/stores`
- `GET /tenant/stores`
- `POST /tenant/shifts/open`
- `POST /tenant/shifts/close`
- `GET /tenant/shifts/current`
- `POST /tenant/users`
- `GET /tenant/users`

Request body:

```json
{
  "name": "Demo Store"
}
```

The create endpoint:

- creates tenant database (`tenant_<id_prefix>`)
- creates tenant DB user/password
- runs base tenant schema migrations
- inserts tenant metadata into `control_plane.tenants`

## RabbitMQ ShiftClosed Flow

Implemented event:

- Event name: `shift.closed.v1`
- Published when `POST /tenant/shifts/close` succeeds.
- Exchange: `pos.events` (topic)
- Routing key: `shift.closed`
- Audit consumer queue: `audit.shift.closed`
- DLQ: `audit.shift.closed.dlq`

Consumer command:

```powershell
cd services/tenant-service-laravel
php artisan rabbitmq:consume-shift-closed
```

Consume one message and exit:

```powershell
php artisan rabbitmq:consume-shift-closed --once
```

The consumer:

- writes event into `audit_logs`
- tracks idempotency in `processed_events`
- rejects failed messages to DLQ
