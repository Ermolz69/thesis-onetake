from __future__ import annotations

from services.reco_service.cache import RecoCache


def test_cache_returns_saved_items_before_ttl(monkeypatch) -> None:
    timeline = iter([100.0, 120.0, 120.0])
    monkeypatch.setattr("services.reco_service.cache.time.time", lambda: next(timeline))

    cache = RecoCache(ttl_minutes=1)
    expected = [("post-1", 1.0, "similar_by_tags")]

    cache.set("user-1", "HOME", expected, context_tags=("rpg",), exclude_ids=("post-9",))

    assert (
        cache.get("user-1", "HOME", context_tags=("rpg",), exclude_ids=("post-9",)) == expected
    )


def test_cache_expires_items_after_ttl(monkeypatch) -> None:
    timeline = iter([100.0, 170.0, 170.0])
    monkeypatch.setattr("services.reco_service.cache.time.time", lambda: next(timeline))

    cache = RecoCache(ttl_minutes=1)
    cache.set("user-1", "HOME", [("post-1", 1.0, "similar_by_tags")])

    assert cache.get("user-1", "HOME") is None
