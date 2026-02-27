"""Trending stub: top posts by view count from ClickHouse events."""
import logging
from clickhouse_driver import Client

from .config import CLICKHOUSE_HOST, CLICKHOUSE_PORT, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD

logger = logging.getLogger(__name__)

TRENDING_QUERY = """
SELECT
    entity_id AS post_id,
    count() AS view_count
FROM events
WHERE event_name = 'post_view'
  AND entity_type = 'post'
  AND entity_id IS NOT NULL
  AND ts >= now() - INTERVAL 7 DAY
GROUP BY entity_id
ORDER BY view_count DESC
LIMIT %(max_rows)s
"""


def get_trending_post_ids(limit: int, exclude_ids: list[str]) -> list[tuple[str, float, str]]:
    """Return list of (post_id, score, reason)."""
    try:
        client = Client(
            host=CLICKHOUSE_HOST,
            port=CLICKHOUSE_PORT,
            user=CLICKHOUSE_USER,
            password=CLICKHOUSE_PASSWORD,
        )
        rows = client.execute(TRENDING_QUERY, {"max_rows": limit + len(exclude_ids)})
        exclude_set = set(exclude_ids)
        result = []
        for (post_id, view_count) in rows:
            pid = str(post_id) if post_id else ""
            if not pid or pid in exclude_set:
                continue
            result.append((pid, float(view_count), "trending_by_views_7d"))
            if len(result) >= limit:
                break
        return result
    except Exception as e:
        logger.exception("get_trending_post_ids failed: %s", e)
        return []
