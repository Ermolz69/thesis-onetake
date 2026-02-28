import uuid
from datetime import datetime
from clickhouse_driver import Client
from .config import CLICKHOUSE_HOST, CLICKHOUSE_PORT, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD

EVENTS_TABLE = "default.events"
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS default.events
(
    event_id    UUID,
    ts          DateTime64(3),
    user_id     Nullable(UUID),
    session_id  String,
    event_name  LowCardinality(String),
    route       String,
    entity_type Nullable(LowCardinality(String)),
    entity_id   Nullable(UUID),
    props_json  String,
    trace_id    String
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(ts)
ORDER BY (event_name, ts, user_id, entity_id)
"""


def _parse_uuid(s: str | None):
    if not s:
        return None
    try:
        return uuid.UUID(s)
    except (ValueError, TypeError):
        return None


def _ts_to_datetime(ts_ms: int):
    return datetime.utcfromtimestamp(ts_ms / 1000.0)


class ClickHouseWriter:
    def __init__(self):
        self._client: Client | None = None

    def _get_client(self) -> Client:
        if self._client is None:
            self._client = Client(
                host=CLICKHOUSE_HOST,
                port=CLICKHOUSE_PORT,
                user=CLICKHOUSE_USER,
                password=CLICKHOUSE_PASSWORD,
            )
            self._client.execute(CREATE_TABLE_SQL)
        return self._client

    def insert_batch(self, rows: list[dict]) -> None:
        if not rows:
            return
        client = self._get_client()
        data = [
            (
                _parse_uuid(r.get("event_id")),
                _ts_to_datetime(r["ts"]),
                _parse_uuid(r.get("user_id")) if r.get("user_id") else None,
                r.get("session_id") or "",
                r.get("event_name") or "",
                r.get("route") or "",
                r.get("entity_type") or None,
                _parse_uuid(r.get("entity_id")) if r.get("entity_id") else None,
                r.get("props_json") or "{}",
                r.get("trace_id") or "",
            )
            for r in rows
        ]
        client.execute(
            f"""INSERT INTO {EVENTS_TABLE}
            (event_id, ts, user_id, session_id, event_name, route, entity_type, entity_id, props_json, trace_id)
            VALUES""",
            data,
        )
