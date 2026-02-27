-- Raw events table for OneTake analytics (v1)
-- See ROADMAP section 4.1

CREATE TABLE IF NOT EXISTS events
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
ORDER BY (event_name, ts, user_id, entity_id);
