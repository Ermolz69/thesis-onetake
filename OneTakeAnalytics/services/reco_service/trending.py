"""Trending: top posts by view count from ClickHouse (7d, 24h, 72h)."""
import logging
from clickhouse_driver import Client

from .config import CLICKHOUSE_HOST, CLICKHOUSE_PORT, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD

logger = logging.getLogger(__name__)

TRENDING_QUERY_TEMPLATE = """
SELECT
    entity_id AS post_id,
    count() AS view_count
FROM default.events
WHERE event_name = 'post_view'
  AND entity_type = 'post'
  AND entity_id IS NOT NULL
  AND ts >= now() - INTERVAL %(interval_hours)s HOUR
GROUP BY entity_id
ORDER BY view_count DESC
LIMIT %(max_rows)s
"""

REASON_BY_HOURS = {24: "trending_views_24h", 72: "trending_views_72h", 168: "trending_by_views_7d"}


def get_trending_post_ids(
    limit: int,
    exclude_ids: list[str],
    interval_hours: int = 72,
) -> list[tuple[str, float, str]]:
    """Return list of (post_id, score, reason). interval_hours: 24, 72, or 168 (7d)."""
    reason = REASON_BY_HOURS.get(interval_hours, "trending_views_72h")
    try:
        client = Client(
            host=CLICKHOUSE_HOST,
            port=CLICKHOUSE_PORT,
            user=CLICKHOUSE_USER,
            password=CLICKHOUSE_PASSWORD,
        )
        rows = client.execute(
            TRENDING_QUERY_TEMPLATE,
            {"interval_hours": interval_hours, "max_rows": limit + len(exclude_ids)},
        )
        exclude_set = set(exclude_ids)
        result = []
        for (post_id, view_count) in rows:
            pid = str(post_id) if post_id else ""
            if not pid or pid in exclude_set:
                continue
            result.append((pid, float(view_count), reason))
            if len(result) >= limit:
                break
        return result
    except Exception as e:
        logger.exception("get_trending_post_ids failed: %s", e)
        return []
