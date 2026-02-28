# OneTake — Thesis Monorepo

Monorepo for the OneTake platform: Core API (C#), React frontend, and Python analytics/recommendations services. Shared contracts (gRPC protos) and optional Docker/ClickHouse setup.

---

## Repository structure

| Path | Description |
|------|-------------|
| **OneTake-back-end/** | Core API — ASP.NET Core, Clean Architecture, PostgreSQL, gRPC clients to Analytics/Reco |
| **onetake-front-end/** | Web app — React 19, Vite, TypeScript, Zustand, FSD-like structure |
| **OneTakeAnalytics/** | Python services — Analytics Ingest (gRPC → ClickHouse), Reco (gRPC, trending + similar by tags) |
| **contracts/** | Shared gRPC protos (`analytics/v1`, `reco/v1`) used by C# and Python |

Each subproject has its own **.gitignore**; root `.gitignore` covers OS, IDE, Python venvs, env files (`.env`; `.env.example` is allowed), and build/test artifacts when running from repo root. Do not commit `.env` or secrets.

---

## What is implemented

- **Core (Backend):** Auth (JWT), users, posts (CRUD, like, visibility Public/Unlisted), comments, chunk upload (init → parts → finalize), analytics proxy (POST /api/analytics/events), recommended feed (calls Reco gRPC). Events (publish, upload) sent to Analytics Ingest via gRPC.
- **Frontend:** Home, Posts, Post details, Auth, Recording Studio (`/record` — screen/camera, trim, then upload), chunk upload with progress, recommended block on home, analytics tracking (record/upload/watch).
- **Analytics:** Ingest service receives events from Core and writes to ClickHouse; Reco service returns recommendations (trending 24h/72h, similar by tags via Core HTTP).
- **Contracts:** `contracts/proto` — analytics and reco protos; C# stubs in `OneTake.GrpcContracts`, Python in `OneTakeAnalytics/libs/onetake_proto`.

See each project’s **README.md** for setup, config, and API details.

---

## Quick start

1. **Backend:** See `OneTake-back-end/README.md`. Requires .NET 10, PostgreSQL. From repo root: `dotnet build OneTake-back-end/OneTake-back-end.slnx` or from `OneTake-back-end/`: `dotnet run --project OneTake.WebApi`. Optional: gRPC endpoints for Analytics/Reco.
2. **Frontend:** See `onetake-front-end/README.md`. From `onetake-front-end/`: `npm install` then `npm run dev`. Set `VITE_API_BASE_URL` to Core URL (e.g. `http://localhost:5213`).
3. **Analytics:** See `OneTakeAnalytics/README.md`. Copy `.env.example` to `.env`, install deps (`pip install -e .`), run ingest and/or reco service; ClickHouse required.

**Docker (from repo root):** `docker compose up -d postgres clickhouse` starts PostgreSQL and ClickHouse. Optionally build and run Analytics services: `docker compose up -d analytics_ingest reco_service`. See `docker-compose.yml`.

---

## Resetting Docker and database

If auth fails or the database is in a bad state, recreate everything from scratch.

**From repo root (`thesis`):**

```bash
docker compose down -v
docker compose up -d postgres clickhouse
```

Wait 10–15 seconds for Postgres and ClickHouse to start, then apply migrations and run the backend:

```bash
cd OneTake-back-end
dotnet ef database update --project OneTake.Infrastructure --startup-project OneTake.WebApi
dotnet run --project OneTake.WebApi
```

Postgres connection (must match `appsettings.json`): host `localhost`, port `5432`, database `onetake`, user/password `postgres` / `postgres`. If needed, set in root `.env`: `POSTGRES_PASSWORD=postgres`.

ClickHouse in compose listens on host ports **8124** (HTTP) and **9001** (native). When running Python services on the host, set in `OneTakeAnalytics/.env`: `CLICKHOUSE_PORT=9001`. If you see ClickHouse "Address already in use", run `docker compose down`, then `docker compose up -d postgres clickhouse` again.

---

## Tests

- **Backend:** From `OneTake-back-end/` run unit and integration tests; see `OneTake-back-end/README.md` (Tests and coverage).
- **Frontend:** From `onetake-front-end/` run `npm run lint` and `npm run format:check` (CI). See `CONTRIBUTING.md` for conventions.
