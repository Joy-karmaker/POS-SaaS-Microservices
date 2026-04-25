# Session Log - April 4, 2026

## Scope

- Run frontend without local Node.js/NPM.
- Fix frontend dependency/runtime issues in Docker mode.
- Fix platform admin login `Bad Gateway` from Dockerized frontend.

## Issue 1: Frontend could not run after uninstalling Node/NPM

### Problem

- Local `npm run dev` was no longer possible because Node/NPM were removed from host machine.

### Root cause

- Project had no dedicated Docker service for frontend dev server (`http://localhost:5173`).
- `docker-compose` only served `frontend/dist` via gateway.

### Fix applied

1. Added frontend Docker dev image:
- `frontend/Dockerfile.dev`

2. Added Docker ignore for frontend context:
- `frontend/.dockerignore`

3. Added frontend service in compose:
- `docker-compose.yml`
- Exposed `5173`, mounted frontend source, used dedicated `frontend-node-modules` volume.

4. Added env var for frontend port:
- `.env.example` -> `FRONTEND_PORT=5173`

5. Updated docs:
- `README.md` with Docker frontend run steps.

### Verification

- `docker compose build frontend` succeeded.
- `docker compose up -d frontend` succeeded.
- Vite log shows:
  - `Local: http://localhost:5173/`

---

## Issue 2: `[plugin:vite:import-analysis] Failed to resolve import "react-router-dom"`

### Problem

- Frontend boot failed with unresolved `react-router-dom` import.

### Root cause

- Container startup did not guarantee dependencies were installed in mounted runtime state.

### Fix applied

- Updated frontend container startup command to install deps before Vite starts:
  - `frontend/Dockerfile.dev`
  - `CMD ["sh", "-c", "npm ci && npm run dev -- --host 0.0.0.0 --port 5173"]`

### Verification

- Frontend container logs show `npm ci` completed and Vite started successfully.

---

## Issue 3: Platform Admin login showed `502 Bad Gateway`

### Problem

- Login from `http://localhost:5173` failed with `Bad Gateway`.

### Root cause

- In Docker mode, Vite proxy target was hardcoded to `http://localhost`.
- Inside frontend container, `localhost` points to itself, not the gateway container.

### Fix applied

1. Made Vite proxy target configurable:
- `frontend/vite.config.js`
- `const gatewayTarget = process.env.VITE_GATEWAY_PROXY_TARGET ?? 'http://localhost'`

2. Set Docker frontend proxy target to gateway service name:
- `docker-compose.yml`
- `VITE_GATEWAY_PROXY_TARGET=http://gateway`

3. Added doc note:
- `README.md` clarifies Docker proxy target is `http://gateway`.

### Verification

- `curl http://localhost:5173/tenant/health` returned `200 OK`.
- Frontend + gateway + tenant-service containers are running and reachable.

---

## Current Run Commands (Docker frontend mode)

```powershell
docker compose up -d --build frontend gateway tenant-service
docker compose logs -f frontend
```

Frontend URL:

- `http://localhost:5173/`
