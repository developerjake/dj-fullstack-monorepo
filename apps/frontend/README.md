# Frontend

React 19 + Vite app for this monorepo. Prefer the [root README](../../README.md) for workspace setup, Docker, and CI.

## Local commands

From the repo root:

| Command | What it does |
|---------|--------------|
| `pnpm frontend:dev` | Vite dev server |
| `pnpm frontend:build` | Production build |
| `pnpm frontend:test` | Vitest (unit + Storybook browser projects) |
| `pnpm frontend:lint` | ESLint |
| `pnpm frontend:typecheck` | `tsc --noEmit` for app and Vite configs |
| `pnpm storybook` | Storybook on port 6006 |

## API proxy

Vite proxies `/api` to the Nest backend. Defaults to `http://backend:3000` (Docker Compose DNS). For host-local `pnpm frontend:dev` + `pnpm backend:dev`, copy `.env.example` to `.env.local` and set:

```bash
VITE_API_PROXY_TARGET=http://localhost:3000
```

## Layout

| Path | Role |
|------|------|
| `src/App.tsx` | Starter shell with an `/api` smoke check |
| `src/stories/` | Storybook stories (starts with `App`) |
| `src/__tests__/` | Vitest unit tests (jsdom) |
| `.storybook/` | Storybook + Vitest browser project config |
