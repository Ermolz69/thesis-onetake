# OneTake Analytics

Python workspace for Analytics Ingest and Recommendations gRPC services.

- **analytics_ingest**: gRPC server that receives events from Core and writes to ClickHouse.
- **reco_service**: gRPC server that returns post recommendations (trending stub).

## Generate Python from proto

From repo root (thesis):

```bash
cd OneTakeAnalytics
uv run python scripts/generate_proto.py
```

Or with pip/poetry: install deps then `python scripts/generate_proto.py`.

## Run services locally

```bash
# Analytics Ingest (expects ClickHouse and GRPC_PORT, CLICKHOUSE_* env)
uv run python -m services.analytics_ingest.main

# Reco Service
uv run python -m services.reco_service.main
```

## Docker

See root `docker-compose.yml`. Services are built from `OneTakeAnalytics/docker/`.
