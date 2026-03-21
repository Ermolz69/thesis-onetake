from __future__ import annotations

from services.reco_service.trending import get_trending_post_ids


class _FakeClient:
    def __init__(self, **_: object) -> None:
        pass

    def execute(self, query: str, params: dict[str, int]) -> list[tuple[str, int]]:
        assert "post_view" in query
        assert params["interval_hours"] == 24
        return [("post-1", 9), ("post-2", 7), ("post-3", 3)]


def test_trending_returns_ordered_items_with_reason_and_exclusions(monkeypatch) -> None:
    monkeypatch.setattr("services.reco_service.trending.Client", _FakeClient)

    result = get_trending_post_ids(limit=2, exclude_ids=["post-2"], interval_hours=24)

    assert result == [
        ("post-1", 9.0, "trending_views_24h"),
        ("post-3", 3.0, "trending_views_24h"),
    ]
