"""
Periodic job to refresh ClickHouse aggregate tables from events.
Run e.g. daily: python -m jobs.aggregates.refresh_aggregates
"""
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from clickhouse_driver import Client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load .env from OneTakeAnalytics root
_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(_root / ".env")

CLICKHOUSE_HOST = os.environ.get("CLICKHOUSE_HOST", "localhost")
CLICKHOUSE_PORT = int(os.environ.get("CLICKHOUSE_PORT", "9000"))
CLICKHOUSE_USER = os.environ.get("CLICKHOUSE_USER", "default")
CLICKHOUSE_PASSWORD = os.environ.get("CLICKHOUSE_PASSWORD", "default")
DAYS_BACK = int(os.environ.get("AGGREGATE_DAYS_BACK", "90"))


def get_client() -> Client:
    return Client(
        host=CLICKHOUSE_HOST,
        port=CLICKHOUSE_PORT,
        user=CLICKHOUSE_USER,
        password=CLICKHOUSE_PASSWORD,
    )


def refresh_daily_active_users(client: Client) -> None:
    """Populate daily_active_users from events (distinct user_id per day)."""
    client.execute(
        """
        INSERT INTO default.daily_active_users (date, dau, version)
        SELECT
            toDate(ts) AS date,
            uniqExact(user_id) AS dau,
            now() AS version
        FROM default.events
        WHERE ts >= now() - INTERVAL %(days)s DAY
          AND user_id IS NOT NULL
        GROUP BY date
        """,
        {"days": DAYS_BACK},
    )
    logger.info("Refreshed daily_active_users")


def refresh_post_daily_metrics(client: Client) -> None:
    """Populate post_daily_metrics: views, likes, completion per post per day."""
    client.execute(
        """
        INSERT INTO default.post_daily_metrics (date, post_id, views, likes, completion, version)
        SELECT
            toDate(ts) AS date,
            entity_id AS post_id,
            countIf(event_name = 'post_view') AS views,
            countIf(event_name = 'post_like') AS likes,
            countIf(event_name = 'watch_complete') AS completion,
            now() AS version
        FROM default.events
        WHERE ts >= now() - INTERVAL %(days)s DAY
          AND entity_type = 'post'
          AND entity_id IS NOT NULL
        GROUP BY date, entity_id
        """,
        {"days": DAYS_BACK},
    )
    logger.info("Refreshed post_daily_metrics")


def refresh_funnel(client: Client) -> None:
    """Populate funnel_record_to_publish: unique sessions/users per step per day."""
    steps = ["record_start", "record_stop", "upload_success", "publish_success"]
    for step in steps:
        client.execute(
            """
            INSERT INTO default.funnel_record_to_publish (date, step_name, unique_sessions, unique_users, version)
            SELECT
                toDate(ts) AS date,
                %(step)s AS step_name,
                uniqExact(session_id) AS unique_sessions,
                uniqExact(user_id) AS unique_users,
                now() AS version
            FROM default.events
            WHERE ts >= now() - INTERVAL %(days)s DAY
              AND event_name = %(step)s
            GROUP BY date
            """,
            {"step": step, "days": DAYS_BACK},
        )
    logger.info("Refreshed funnel_record_to_publish")


def main() -> int:
    try:
        client = get_client()
        refresh_daily_active_users(client)
        refresh_post_daily_metrics(client)
        refresh_funnel(client)
        return 0
    except Exception as e:
        logger.exception("refresh_aggregates failed: %s", e)
        return 1


if __name__ == "__main__":
    sys.exit(main())
