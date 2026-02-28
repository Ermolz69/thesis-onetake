"""Similar posts by tags: fetch from Core API by tag."""
import logging
import urllib.parse
import requests

from .config import CORE_API_URL

logger = logging.getLogger(__name__)


def get_similar_by_tags(
    tags: list[str],
    limit: int,
    exclude_ids: list[str],
) -> list[tuple[str, float, str]]:
    """Return list of (post_id, score, reason) from Core GET /api/posts?tag=..."""
    if not tags:
        return []
    exclude_set = set(exclude_ids)
    result = []
    seen = set()
    for tag in tags[:5]:  # max 5 tags to avoid too many requests
        try:
            url = f"{CORE_API_URL.rstrip('/')}/api/posts?tag={urllib.parse.quote(tag)}&pageSize={limit}"
            resp = requests.get(url, timeout=5)
            resp.raise_for_status()
            data = resp.json()
            posts = data.get("posts") if isinstance(data, dict) else (data if isinstance(data, list) else [])
            if not isinstance(posts, list):
                continue
            for post in posts:
                pid = post.get("id") if isinstance(post, dict) else getattr(post, "id", None)
                if pid is None:
                    continue
                pid = str(pid)
                if pid in exclude_set or pid in seen:
                    continue
                seen.add(pid)
                result.append((pid, 1.0, "similar_by_tags"))
                if len(result) >= limit:
                    return result
        except Exception as e:
            logger.warning("similar_by_tags tag=%s failed: %s", tag, e)
    return result
