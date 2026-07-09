# Backend

NestJS API for this monorepo. Prefer the [root README](../../README.md) for workspace setup, Docker, and CI.

## Local commands

From the repo root:

| Command | What it does |
|---------|--------------|
| `pnpm backend:dev` | Nest watch mode (`start:dev`) |
| `pnpm backend:build` | Production build |
| `pnpm backend:test` | Jest unit tests |
| `pnpm backend:test:e2e` | Jest e2e (`test/` + `/api` prefix) |
| `pnpm backend:lint` | ESLint with `--fix` |
| `pnpm backend:typecheck` | `tsc --noEmit` |

Or from this package: `pnpm start:dev`, `pnpm test`, `pnpm test:e2e`, etc.

## Layout

| Path | Role |
|------|------|
| `src/main.ts` | Bootstrap (CORS, `/api` prefix, pino-http, graceful shutdown) |
| `src/load-env.ts` | Loads `.env` before Sentry/Loki module init |
| `src/app.controller.ts` | Smoke routes (`GET /api`, `GET /api/debug-sentry` in non-production) |
| `src/logging/` | Logging adapter used by Nest |
| `.env.example` | Documented env vars — copy to `.env` |

## Observability

Sentry and Loki are optional. Leave `SENTRY_DSN` / `LOKI_URL` empty for local stdout-only logging. See the root README for details.
