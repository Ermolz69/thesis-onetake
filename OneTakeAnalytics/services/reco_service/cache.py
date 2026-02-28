"""In-memory TTL cache for recommendations."""
import logging
import threading
import time
from typing import Any

logger = logging.getLogger(__name__)


class RecoCache:
    def __init__(self, ttl_minutes: int, enabled: bool = True):
        self._ttl_seconds = ttl_minutes * 60
        self._enabled = enabled
        self._store: dict[str, tuple[Any, float]] = {}
        self._lock = threading.RLock()

    def _key(self, user_id: str, feed_type: str, context_post_id: str, context_tags: tuple[str, ...], exclude_ids: tuple[str, ...]) -> str:
        return f"{user_id}|{feed_type}|{context_post_id}|{','.join(sorted(context_tags))}|{','.join(sorted(exclude_ids))}"

    def get(self, user_id: str, feed_type: str, context_post_id: str = "", context_tags: tuple[str, ...] = (), exclude_ids: tuple[str, ...] = ()) -> list | None:
        if not self._enabled:
            return None
        k = self._key(user_id, feed_type, context_post_id, context_tags, exclude_ids)
        with self._lock:
            if k not in self._store:
                return None
            val, expires = self._store[k]
            if time.time() > expires:
                del self._store[k]
                return None
            return val

    def set(
        self,
        user_id: str,
        feed_type: str,
        items: list,
        context_post_id: str = "",
        context_tags: tuple[str, ...] = (),
        exclude_ids: tuple[str, ...] = (),
    ) -> None:
        if not self._enabled:
            return
        k = self._key(user_id, feed_type, context_post_id, context_tags, exclude_ids)
        with self._lock:
            self._store[k] = (items, time.time() + self._ttl_seconds)
