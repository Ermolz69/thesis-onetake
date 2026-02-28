# OneTakeAnalytics — Python services

Analytics Ingest (gRPC server, writes events to ClickHouse) and Recommendations (gRPC server, trending + similar-by-tags). Shared proto-generated code; config via **environment variables** and optional **`.env`** file (see below).

---

## Structure

```
OneTakeAnalytics/
  pyproject.toml
  .env.example       # copy to .env and fill
  libs/
    onetake_proto/  # generated from contracts/proto (reco, analytics)
  services/
    analytics_ingest/   # gRPC server → batch → ClickHouse
    reco_service/       # gRPC server → trending + similar_by_tags → Core HTTP
  contracts/         # symlink or copy of repo contracts/proto (for generation)
```

---

## Configuration (.env and env vars)

Config is read from **environment variables**. Values can be set in a **`.env`** file in the **project root** (`OneTakeAnalytics/.env`). Both services load it via `python-dotenv` before reading `os.environ`.

1. Copy the example:  
   `cp .env.example .env`
2. Edit `.env` with your ClickHouse and Core API settings.
3. Do not commit `.env` (it is in `.gitignore`).

If the same variable is set in the OS environment and in `.env`, the OS value wins. Useful for Docker (set env in compose) or different ports per process.

---

## Environment variables

| Variable | Used by | Description |
|----------|---------|-------------|
| **GRPC_PORT** | both | gRPC server port (e.g. 50051 ingest, 50052 reco — set per process if both run) |
| **CLICKHOUSE_HOST** | both | ClickHouse host |
| **CLICKHOUSE_PORT** | both | ClickHouse port (e.g. 9000) |
| **CLICKHOUSE_USER** | both | ClickHouse user |
| **CLICKHOUSE_PASSWORD** | both | ClickHouse password |
| **CORE_API_URL** | reco only | Core REST API base URL (for similar_by_tags) |
| **BATCH_SIZE** | ingest only | Ingest batch size |
| **BATCH_INTERVAL_SEC** | ingest only | Ingest flush interval (seconds) |

Defaults are in `services/*/config.py` (e.g. GRPC_PORT 50051/50052, localhost ClickHouse).

---

## Analytics Ingest service

- **Role:** gRPC server implementing `TrackEvent`. Buffers events, writes to ClickHouse (raw events table).
- **Run:** From repo root or OneTakeAnalytics root, with Python path set so that `services.analytics_ingest` and `libs.onetake_proto` are importable, e.g.:
  ```bash
  cd OneTakeAnalytics
  pip install -e .
  python -m services.analytics_ingest.main
  ```
  Or use the same pattern as your existing entry script (e.g. `main.py` in the service folder).
- **Proto:** `contracts/proto/analytics/v1/analytics.proto` — `TrackEventRequest` (event_id, ts, user_id, session_id, event_name, route, entity_type, entity_id, props_json, trace_id).

---

## Reco service

- **Role:** gRPC server implementing `GetRecommendations`. Returns list of (post_id, score, reason).
- **Logic:**
  - If `context_tags` is set: fetch posts by tag from Core HTTP (`GET /api/posts?tag=...`) → “similar_by_tags”.
  - Fill rest with **trending** (ClickHouse: post_view events, windows 24h and 72h; reasons e.g. `trending_views_24h`, `trending_views_72h`).
- **Run:** Same as above, e.g. `python -m services.reco_service.main` (or your existing entrypoint).
- **Proto:** `contracts/proto/reco/v1/reco.proto` — `GetRecommendationsRequest` (user_id, limit, feed_type, context_post_id, context_tags, exclude_post_ids, trace_id), `RecommendationItem` (post_id, score, reason).

---

## Dependencies

Install from project root:

```bash
pip install -e .
```

Main deps in `pyproject.toml`: `grpcio`, `grpcio-tools`, `clickhouse-driver`, `requests`, `python-dotenv`. Proto generation (if done in this repo) uses `grpcio-tools` and the `contracts/proto` tree; generated code lives under `libs/onetake_proto`.

---

## Summary

- **Config:** OS env + optional **`.env`** in `OneTakeAnalytics/` (loaded with `python-dotenv` in each service’s `config.py`).
- **Ingest:** gRPC → buffer → ClickHouse.
- **Reco:** gRPC → similar_by_tags (Core HTTP) + trending (ClickHouse) → recommendations.

Use `.env.example` as the template for `.env` and keep `.env` out of version control (it is listed in `.gitignore`). A `.dockerignore` in this folder excludes venv, cache, and `.env` from Docker build context when building the ingest/reco images.
