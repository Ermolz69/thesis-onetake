-- Aggregates for OneTake analytics (Sprint 2.7)
-- Fill via periodic job or Materialized Views as needed.

-- Daily Active Users: one row per day with distinct user count
-- version: for ReplacingMergeTree so job can re-run (latest wins)
CREATE TABLE IF NOT EXISTS daily_active_users
(
    date    Date,
    dau     UInt64,
    version DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(version)
ORDER BY date;

-- Post daily metrics: views, likes, completion per post per day
CREATE TABLE IF NOT EXISTS post_daily_metrics
(
    date       Date,
    post_id    UUID,
    views      UInt64 DEFAULT 0,
    likes      UInt64 DEFAULT 0,
    completion UInt64 DEFAULT 0,
    version    DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(version)
ORDER BY (date, post_id);

-- Funnel: counts of unique sessions/users that reached each step
CREATE TABLE IF NOT EXISTS funnel_record_to_publish
(
    date            Date,
    step_name       LowCardinality(String),
    unique_sessions UInt64 DEFAULT 0,
    unique_users    UInt64 DEFAULT 0,
    version         DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(version)
ORDER BY (date, step_name);
