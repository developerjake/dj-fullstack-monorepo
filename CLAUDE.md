# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this project?

This repository is a full-stack monorepo template/starter. The backend is NestJS 11 (Express), the frontend is React 19 + Vite 7. Development runs in Docker Compose with hot reload.

## Tech Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Backend:** NestJS, Pino logging, optional Sentry + Loki
- **Frontend:** React 19, Vite 7, Vitest, Storybook
- **Dev environment:** Docker Compose (watch mode)
- **Package manager:** pnpm 10.13.1 (enforced), Node 24

## Common Commands

### Development
```bash
pnpm dev              # Docker Compose (foreground)
pnpm dev:watch        # Docker Compose with watch mode
pnpm backend:dev      # NestJS locally without Docker
pnpm frontend:dev     # Vite dev server locally without Docker
pnpm storybook        # Storybook on port 6006
```

### Build & Quality
```bash
pnpm build            # Turbo build all packages
pnpm lint             # ESLint both apps (backend with --fix)
pnpm lint:ci          # CI lint (no --fix, --max-warnings 0)
pnpm typecheck        # tsc --noEmit both apps
```

### Testing
```bash
pnpm backend:test           # Jest unit tests
pnpm backend:test:e2e       # Jest e2e (unit tests run first via Turbo)
pnpm frontend:test          # Vitest (unit + Storybook browser tests)
```

Run a single backend test by name:
```bash
cd apps/backend && pnpm test -- --testNamePattern="test name here"
```

Run a single frontend test file:
```bash
cd apps/frontend && pnpm test -- src/path/to/file.test.ts
```

## Architecture

### Monorepo Structure

Turborepo orchestrates tasks with a dependency pipeline: `build` → `test` → `test:e2e`. Both apps live under `apps/`.

### Backend (`apps/backend/`)

NestJS app bootstrapped in `src/main.ts`:
- Global prefix `/api`, CORS origin from `CORS_ORIGIN` env (default `localhost:3000`)
- Graceful shutdown on SIGINT/SIGTERM
- Pino HTTP logging with custom serializers (`http-serializers.ts`, `pino-stream.ts`)
- Optional Sentry (`sentry-init.ts`) and Loki log shipping via env vars

Module structure in `src/`:
- `app.module.ts` — wires LoggerModule, Sentry, global HTTP exception filter
- `logging/` — custom Pino adapter, logging service, types, and constants
- `http-exception-filter.ts` — global NestJS exception filter

Unit tests in `src/**/*.spec.ts`, e2e tests in `test/` with separate `jest-e2e.json` config.

### Frontend (`apps/frontend/`)

Vite + React app. `vite.config.ts` defines two Vitest projects:
1. **storybook** — Playwright Chromium browser tests via `@storybook/addon-vitest`
2. **frontend** — unit/integration tests in `src/**/*.{test,spec}.{ts,tsx}`

The Vite dev server proxies `/api` → `http://backend:3000` (the Docker service name).

### Docker Dev Setup

`docker-compose.dev.yml` maps:
- Backend: host `3001` → container `3000`
- Frontend: host `3000` → container `5173`

Watch mode hot-reloads on changes to `.ts`/`.tsx` files in `src/` and `test/`.

Backend requires a `.env` file (copy from `.env.example`). Key vars: `PORT`, `NODE_ENV`, `CORS_ORIGIN`, `SENTRY_DSN`, `LOKI_HOST`, `LOKI_LABEL_APP`.

### CI

`.github/workflows/ci.yml` runs parallel backend and frontend jobs on push/PR to `main`. Frontend CI installs Playwright separately for browser-based Vitest tests.

## Code Style

- Line length: 100 chars (both apps)
- Backend ESLint: `@typescript-eslint/no-explicit-any` is off; `no-floating-promises` and `no-unsafe-argument` are warnings
- Frontend ESLint: flat config (ESLint v9), React hooks + React refresh plugins
- Prettier config lives in `apps/backend/.prettierrc`; frontend formatting is via ESLint Prettier plugin
