"""Personalization rules: watch-based, liked-based, trending fallback."""
import logging
import urllib.parse
from typing import Any

import requests
from clickhouse_driver import Client

from .config import (
    CLICKHOUSE_HOST,
    CLICKHOUSE_PORT,
    CLICKHOUSE_USER,
    CLICKHOUSE_PASSWORD,
    CORE_API_URL,
)
from .similar_by_tags import get_similar_by_tags
from .trending import get_trending_post_ids

logger = logging.getLogger(__name__)


def _ch_client() -> Client:
    return Client(
        host=CLICKHOUSE_HOST,
        port=CLICKHOUSE_PORT,
        user=CLICKHOUSE_USER,
        password=CLICKHOUSE_PASSWORD,
    )


def _get_post_tags(post_id: str) -> list[str]:
    """Fetch tags for a post from Core API."""
    try:
        url = f"{CORE_API_URL.rstrip('/')}/api/posts/{post_id}"
        resp = requests.get(url, timeout=3)
        resp.raise_for_status()
        data = resp.json()
        tags = data.get("tags") if isinstance(data, dict) else []
        return list(tags) if isinstance(tags, list) else []
    except Exception as e:
        logger.warning("_get_post_tags post_id=%s failed: %s", post_id, e)
        return []


def get_liked_based(
    user_id: str,
    limit: int,
    exclude_ids: list[str],
) -> list[tuple[str, float, str]]:
    """Posts similar to what the user liked (post_like events in ClickHouse)."""
    if not user_id:
        return []
    try:
        client = _ch_client()
        rows = client.execute(
            """
            SELECT entity_id
            FROM default.events
            WHERE event_name = 'post_like'
              AND user_id = %(user_id)s
              AND entity_type = 'post'
              AND entity_id IS NOT NULL
              AND ts >= now() - INTERVAL 30 DAY
            GROUP BY entity_id
            ORDER BY max(ts) DESC
            LIMIT 10
            """,
            {"user_id": user_id},
        )
        post_ids = [str(r[0]) for r in rows if r and r[0]]
        if not post_ids:
            return []
        tags_set: set[str] = set()
        for pid in post_ids[:5]:
            tags_set.update(_get_post_tags(pid))
        tags_list = list(tags_set)[:10]
        if not tags_list:
            return get_trending_post_ids(limit, exclude_ids, interval_hours=72)
        return get_similar_by_tags(tags_list, limit, exclude_ids)
    except Exception as e:
        logger.exception("get_liked_based failed: %s", e)
        return []


def get_watch_based(
    user_id: str,
    limit: int,
    exclude_ids: list[str],
) -> list[tuple[str, float, str]]:
    """Posts similar to what the user watched (post_view / watch_complete). watch_complete weighted higher."""
    if not user_id:
        return []
    try:
        client = _ch_client()
        rows = client.execute(
            """
            SELECT entity_id, event_name
            FROM default.events
            WHERE user_id = %(user_id)s
              AND entity_type = 'post'
              AND entity_id IS NOT NULL
              AND event_name IN ('post_view', 'watch_complete')
              AND ts >= now() - INTERVAL 14 DAY
            ORDER BY
              CASE event_name WHEN 'watch_complete' THEN 2 ELSE 1 END,
              ts DESC
            LIMIT 15
            """,
            {"user_id": user_id},
        )
        if not rows:
            return []
        tags_set: set[str] = set()
        for r in rows:
            if r and r[0]:
                tags_set.update(_get_post_tags(str(r[0])))
        tags_list = list(tags_set)[:10]
        if not tags_list:
            return get_trending_post_ids(limit, exclude_ids, interval_hours=72)
        return get_similar_by_tags(tags_list, limit, exclude_ids)
    except Exception as e:
        logger.exception("get_watch_based failed: %s", e)
        return []


def get_trending_fallback(limit: int, exclude_ids: list[str]) -> list[tuple[str, float, str]]:
    """Fallback: trending 72h then 24h."""
    out: list[tuple[str, float, str]] = []
    out.extend(get_trending_post_ids(limit, exclude_ids, interval_hours=72))
    exclude_ids = exclude_ids + [p[0] for p in out]
    remaining = limit - len(out)
    if remaining > 0:
        out.extend(get_trending_post_ids(remaining, exclude_ids, interval_hours=24))
    return out[:limit]
