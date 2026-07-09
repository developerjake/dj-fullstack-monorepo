# Fullstack Monorepo

## Getting started

Follow these steps to clone the repo and run the full stack locally.

### Prerequisites

| Tool | Version / notes |
|------|-----------------|
| **Git** | Any recent version |
| **Node.js** | **24.x** (see `.nvmrc`; matches [CI](#continuous-integration)) |
| **pnpm** | **10.x** — root `package.json` sets `"packageManager": "pnpm@10.13.1"`. Enable with `corepack enable`, then `pnpm install` (or `corepack prepare pnpm@10.13.1 --activate`) |
| **Docker Desktop** (or Docker Engine + Compose v2) | Required for the recommended `pnpm dev` path |

Turbo is installed as a workspace dependency; you do not install it globally.

### 1. Get the code

```bash
git clone <your-repo-url>
cd fullstack-monorepo   # or whatever you named the folder
```

### 2. Configure environment

```bash
cp apps/backend/.env.example apps/backend/.env
```

You can leave Sentry and Loki blank — the app runs with stdout logging only. See [Environment variables](#environment-variables).

### 3. Install dependencies

```bash
pnpm install
```

### 4. Run with Docker (recommended)

```bash
pnpm dev
```

First start builds images and may take a few minutes. Then open:

| Surface | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:3000 |
| Backend API | http://localhost:3001/api |

**Success check:** the UI should show something like `API: Hello World!` (it calls `/api` through the Vite proxy). You can also hit the API directly:

```bash
curl http://localhost:3001/api
```

Detached mode (containers keep running after you close the terminal):

```bash
pnpm dev:detached
```

Stop the stack:

```bash
pnpm dev:down
```

Compose service names are `backend` and `frontend` (used for DNS inside the network, e.g. the Vite proxy target `http://backend:3000`). Container name prefixes follow your **folder name** by default (e.g. `fullstack-monorepo-backend-1`). Override with `COMPOSE_PROJECT_NAME=myapp` if you want a different prefix — no compose file edits required.

### 5. Optional: run without Docker

Use two terminals from the repo root:

```bash
# Terminal 1
pnpm backend:dev

# Terminal 2 — point Vite at the host Nest process
cp apps/frontend/.env.example apps/frontend/.env.local
pnpm frontend:dev
```

Then open http://localhost:5173 (Vite’s default host port). Nest still listens on `PORT` from `apps/backend/.env` (default `3000`).

### 6. Optional: smoke-check Storybook

Storybook is not started by `pnpm dev` — run it on the host:

```bash
pnpm storybook
```

Open http://localhost:6006 and confirm the **App** story renders (status text should be readable). Optional static build:

```bash
pnpm storybook:build
```

### 7. Optional: verify quality gates

```bash
pnpm lint:ci
pnpm typecheck
pnpm test
```

Frontend tests include Storybook browser tests; CI installs Playwright Chromium for that. Locally you may need:

```bash
pnpm --filter frontend exec playwright install chromium
```

### Smoke checklist

After a fresh clone, this is a solid “everything works” pass:

- [ ] `pnpm install` succeeds
- [ ] `pnpm dev` brings up UI at http://localhost:3000 and API at http://localhost:3001/api
- [ ] UI shows `API: Hello World!` (or `curl http://localhost:3001/api` returns `Hello World!`)
- [ ] `pnpm storybook` loads http://localhost:6006 and the **App** story is readable
- [ ] (Optional) `pnpm lint:ci`, `pnpm typecheck`, and `pnpm test` pass

## Prerequisites (summary)

Same tools as [Getting started](#getting-started): Node 24, pnpm 10.13.1 via Corepack, Docker for `pnpm dev`, and Turbo via workspace `devDependencies`.

## Project layout

| Path                       | Role                                                                                                                                                                 |
|----------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `apps/backend`             | NestJS API ([Nest CLI](https://docs.nestjs.com/))                                                                                                                    |
| `apps/frontend`            | React + Vite + TypeScript                                                                                                                                            |
| `apps/frontend/.storybook` | [Storybook](https://storybook.js.org/) config                                                                                                                        |
| `pnpm-workspace.yaml`      | Workspace packages (`apps/*`)                                                                                                                                        |
| `turbo.json`               | [Turborepo](https://turborepo.com/) task pipeline                                                                                                                    |
| `.github/dependabot.yml`   | [Dependabot version updates](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates) (npm, Actions, Docker) |
| `CLAUDE.md`                | [Claude Code](https://claude.ai/code) repo guidance (stack, commands, conventions)                                                                                   |
| `.claude/`                 | Claude Code project settings (permissions, hooks, etc.)                                                                                                              |

## Claude Code

This repository is set up for [Claude Code](https://claude.ai/code): [`CLAUDE.md`](./CLAUDE.md) gives the
assistant context about the monorepo, and [`.claude/`](./.claude) stores project-level configuration you can
version or keep local (for example tool permissions). If you use this repo as a template, update or replace both
to match your workflow.

## Overview

* This is a monorepo with a backend and a frontend.
* Task orchestration uses [Turborepo](https://turborepo.com/) (`turbo.json`) for build/test/dev scripts.
* **Docker:** `pnpm dev` runs both apps via `docker-compose.dev.yml` (hot reload via bind mounts).
* **Local:** `pnpm backend:dev` / `pnpm frontend:dev` without Docker (each runs the app's dev script through Turbo).
* Smoke routes live in [`apps/backend/src/app.controller.ts`](./apps/backend/src/app.controller.ts): a simple GET and a route that throws (for Sentry/logging checks).
* Logging uses [pino](https://github.com/pinojs/pino). Optionally ship logs to Grafana [Loki](https://grafana.com/oss/loki/) and use [Sentry](https://sentry.io/) for errors and performance.

## Common scripts

Root scripts call **[Turborepo](https://turborepo.com/)** (`turbo run …`) so tasks can be cached and filtered by package. Package-specific commands still live under `apps/backend/package.json` and `apps/frontend/package.json`.

### Docker and lifecycle

| Command                   | What it does                                                                 |
|---------------------------|------------------------------------------------------------------------------|
| `pnpm dev`                | Build and run backend + frontend in Docker (foreground)                      |
| `pnpm dev:watch`          | Same stack with Compose [watch](https://docs.docker.com/compose/file-watch/) |
| `pnpm dev:detached`       | Containers in background, then follow logs                                   |
| `pnpm dev:watch:detached` | Watch mode + detached + logs                                                 |
| `pnpm dev:down`           | Stop the dev compose stack                                                   |

### Build, tests, and quality

| Command                                              | What it does                                                                                                                                                            |
|------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `pnpm bootstrap`                                     | `pnpm install` then `pnpm run build` (Turbo builds all packages)                                                                                                        |
| `pnpm build`                                         | Production build for every workspace package                                                                                                                            |
| `pnpm backend:build` / `pnpm frontend:build`         | Build one app                                                                                                                                                           |
| `pnpm test`                                          | Unit / integration tests for every workspace package (Turbo)                                                                                                            |
| `pnpm backend:test` / `pnpm frontend:test`           | Unit / integration tests for one app (Vitest on the frontend includes Storybook browser tests where configured)                                                         |
| `pnpm backend:test:e2e`                              | Backend Jest e2e tests (`apps/backend/test`, `*.e2e-spec.ts`); Turbo runs **unit tests first** when this task is scheduled                                              |
| `pnpm lint`                                          | ESLint in **backend** and **frontend** (Turbo); **backend** uses **`--fix`** (can rewrite files)                                                                        |
| `pnpm lint:ci`                                       | ESLint task CI uses via Turbo: **backend** is check-only (`--max-warnings 0`, no `--fix`); **frontend** is the same as **`pnpm lint`** (`eslint .`, already check-only) |
| `pnpm typecheck`                                     | `tsc --noEmit` in both apps (Turbo)                                                                                                                                     |
| `pnpm backend:lint` / `pnpm frontend:lint`           | Lint one package (**`--fix`** on backend only)                                                                                                                          |
| `pnpm backend:typecheck` / `pnpm frontend:typecheck` | Typecheck a single package                                                                                                                                              |

**Formatting:** backend ESLint uses **Prettier** with **`printWidth: 100`** (`apps/backend/.prettierrc`). The frontend ESLint config enforces **`max-len` 100** for TypeScript and TSX.

**Note:** Use **`pnpm lint:ci`** before pushing when you want the same ESLint invocation as CI without backend auto-fix noise.

### Storybook and local dev servers

| Command                                  | What it does                                                         |
|------------------------------------------|----------------------------------------------------------------------|
| `pnpm backend:dev` / `pnpm frontend:dev` | Run one app locally with watch (Turbo → package `dev` / `start:dev`) |
| `pnpm storybook`                         | [Storybook](https://storybook.js.org/) dev server (port **6006**)    |
| `pnpm storybook:build`                   | Static Storybook build (`apps/frontend/storybook-static` by default) |

### Production-style Docker (optional)

| Command                                                    | What it does                                           |
|------------------------------------------------------------|--------------------------------------------------------|
| `pnpm docker:build`                                        | `docker compose build` (see root `docker-compose.yml`) |
| `pnpm docker:up` / `pnpm docker:down` / `pnpm docker:logs` | Run or inspect the production compose stack            |

## Storybook

The frontend ships with Storybook for developing and documenting UI in isolation. Use `pnpm storybook` / `pnpm storybook:build` from [Common scripts](#common-scripts) (not wired into Docker dev — run Storybook on the host, then open `http://localhost:6006`).

Config and addons live under [`apps/frontend/.storybook`](./apps/frontend/.storybook).

## Docker development

With `pnpm dev` (see [Getting started](#getting-started)), Compose maps:

- **Frontend:** `http://localhost:3000` → Vite (container port 5173)
- **Backend:** `http://localhost:3001` → Nest (container port 3000)

Ensure `CORS_ORIGIN` in `apps/backend/.env` matches how you open the app (e.g. `http://localhost:3000`).

Service names inside the Compose network are `backend` and `frontend`. There are no fixed `container_name` values in the compose files, so Docker prefixes containers with the project name (directory name, or `COMPOSE_PROJECT_NAME`).

## Environment variables

Copy `apps/backend/.env.example` → `apps/backend/.env`. Comments in the example file are the source of truth for optional / future fields; this table covers what the Nest app reads today.

| Variable | Required | Purpose |
|----------|----------|---------|
| `NODE_ENV` | No | `development` / `production` (logging defaults, Sentry sample rate, debug route) |
| `PORT` | No | HTTP port (default `3000` inside the container / local Nest) |
| `LOG_LEVEL` | No | Pino level override; otherwise `debug` in development, `info` in production |
| `CORS_ORIGIN` | No | Allowed browser origin (default `http://localhost:3000`) |
| `SENTRY_DSN` | No | Empty = Sentry disabled (SDK still loads, sends nothing) |
| `SENTRY_ENVIRONMENT` | No | Sentry environment tag (falls back to `NODE_ENV`) |
| `SENTRY_RELEASE` | No | Sentry release string |
| `SENTRY_TRACES_SAMPLE_RATE` | No | Trace sample rate `0`–`1` (defaults: `1` in development, `0.2` in production) |
| `SENTRY_SEND_DEFAULT_PII` | No | Set `true` only to opt into Sentry “default PII” (e.g. client IP) |
| `LOKI_URL` | No | Empty = logs to stdout only |
| `LOKI_USERNAME` / `LOKI_WRITE_API_KEY` | No | Basic auth for Loki push (e.g. Grafana Cloud) |
| `LOKI_SERVICE_NAME` | No | Loki `service` label |
| `LOKI_HEADERS` | No | Optional JSON object of extra push headers |

Frontend (host-local Vite only): `VITE_API_PROXY_TARGET` in `apps/frontend/.env.local` — see `apps/frontend/.env.example`.

## Optional observability (Sentry & Loki)

You do **not** need Grafana or Sentry to run the app. Leave `SENTRY_DSN` / `LOKI_URL` empty for local stdout-only logging.

HTTP access metadata (method, path, status, duration, etc.) is stored under the `http` field on each access log line. **pino-loki** sends that block as Loki structured metadata (`structuredMetaKey: http`) so Grafana can show it as fields. In **Explore**, if nested fields do not appear, parse the line with LogQL, e.g. `| json`, then filter on `http_path`, `http_method`, or the structured metadata keys your Loki version exposes.

## Continuous integration

GitHub Actions runs on every **push** and **pull request** targeting `main` (see [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)).

| Job          | Steps                                                                                                                                                                                                                          |
|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Backend**  | Install (`pnpm install --frozen-lockfile`), **lint + typecheck** (`turbo run lint:ci typecheck --filter=backend`), **unit + e2e tests** (`turbo run test test:e2e --filter=backend`), **build** (`pnpm backend:build`).        |
| **Frontend** | Same install, **lint + typecheck** (`turbo run lint:ci typecheck --filter=frontend`), **Playwright Chromium** install for Vitest/Storybook browser tests, **tests** (`pnpm frontend:test`), **build** (`pnpm frontend:build`). |

Workflow env pins **Node** and **pnpm** (`NODE_VERSION`, `PNPM_VERSION`, aligned with root `packageManager` and `.nvmrc`). Each job uses [pnpm/action-setup](https://github.com/pnpm/action-setup) v6, then [actions/cache](https://github.com/actions/cache) on the **pnpm store** (keyed by OS, Node version, and `pnpm-lock.yaml`) so installs reuse downloaded packages when the lockfile is unchanged.

Jobs run in **parallel** on `ubuntu-latest`. New pushes cancel older runs on the same branch or PR. Quality gates use **`lint:ci`** (read-only) and **`typecheck`** via **Turbo**; see root `package.json` and each app’s `package.json` for script definitions.

**Local parity:** run **`pnpm lint:ci`** and **`pnpm typecheck`** before pushing (same checks as CI for lint and types). For backend e2e alone, **`pnpm backend:test:e2e`** runs unit tests first (`test:e2e` depends on `test` in `turbo.json`).

## Dependency updates (Dependabot)

[Dependabot version updates](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates) are defined in [`.github/dependabot.yml`](./.github/dependabot.yml): weekly **npm** (pnpm workspace at repo root, `pnpm-lock.yaml`), **GitHub Actions** (workflow dependencies, grouped into one PR when possible), and **Docker** (root [`Dockerfile`](./Dockerfile) base images). Enable them under **Settings → Code security and analysis** if they are not already on ([Dependabot quickstart](https://docs.github.com/en/code-security/getting-started/dependabot-quickstart-guide#enabling-dependabot-version-updates)).

**Pull request labels:** The config tags Dependabot PRs with these labels. **Create them** under **Settings → Labels** on a new GitHub repository so PRs stay filterable and consistently colored (GitHub may auto-create missing names on first Dependabot PRs, but with default appearance only):

| Label            | Used for                                     |
|------------------|----------------------------------------------|
| `dependencies`   | All Dependabot PRs (npm, Actions, Docker)    |
| `javascript`     | npm / pnpm lockfile updates                  |
| `github-actions` | Action pin bumps (e.g. `actions/checkout`)   |
| `docker`         | Base image updates for the root `Dockerfile` |

**Note:** [`Dockerfile.dev`](./Dockerfile.dev) is not a separate Dependabot target; keep its `FROM` line aligned with production when Dependabot bumps the main `Dockerfile`, or refactor dev into a directory with its own `Dockerfile` and add another `package-ecosystem: docker` entry.

## Using this repo as a template for a new project

After cloning, rename and search-replace branding so the new project is yours. Typical places:

- [ ] **Root `package.json`** — change the `"name"` field (currently `fullstack-monorepo`). If you change the pnpm version, update `"packageManager"` and the `PNPM_VERSION` env in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) together.
- [ ] **`apps/backend/package.json`** and **`apps/frontend/package.json`** — change `"name"` if you rely on `pnpm --filter <name>` or want distinct npm package names (defaults `backend` / `frontend` work with the workspace).
- [ ] **`apps/backend/.env` and `.env.example`** — update `SERVICE_NAME`, `LOKI_SERVICE_NAME`, `SENTRY_RELEASE`, and any placeholder branding.
- [ ] **This `README.md`** — title, overview, clone path in Getting started, and links.
- [ ] **`LICENSE`** — update the copyright line (or replace with your preferred license).
- [ ] **`CLAUDE.md` and `.claude/`** — update or drop [Claude Code](https://claude.ai/code) guidance and project settings if you do not use Claude (optional).
- [ ] **Storybook** — update `apps/frontend/.storybook` or story titles if you rebrand (optional).
- [ ] **Docker / CI** — image names, registry paths, or compose project names if you add them later (current compose uses generic service names `backend` / `frontend`).
- [ ] **GitHub labels** — create **`dependencies`**, **`javascript`**, **`github-actions`**, and **`docker`** (see [Dependency updates (Dependabot)](#dependency-updates-dependabot)); enable **Dependabot version updates** in repo settings.
- [ ] **Sentry** — create a project in Sentry and set `SENTRY_DSN` when you want reporting (optional).
- [ ] **Grafana Cloud / Loki** — configure `LOKI_*` variables when you want centralized logs (optional).
