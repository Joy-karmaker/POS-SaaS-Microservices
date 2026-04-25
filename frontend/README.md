# Frontend

React + Vite dashboard for the POS SaaS Phase 1 demo.

## Run

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

## API Config

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Variables:

- `VITE_API_BASE` (optional): full backend URL prefix
- `VITE_GATEWAY_PROXY_TARGET` (dev proxy target, default `http://localhost`)

If `VITE_API_BASE` is empty, requests use Vite proxy routes (`/health`, `/tenant/*`).
