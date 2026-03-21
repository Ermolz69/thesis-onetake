from __future__ import annotations

from typing import Any

from services.reco_service.similar_by_tags import get_similar_by_tags


class _FakeResponse:
    def __init__(self, payload: dict[str, Any]) -> None:
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, Any]:
        return self._payload


def test_similar_by_tags_filters_duplicates_and_excludes(monkeypatch) -> None:
    responses = {
        "rpg": {"posts": [{"id": "post-1"}, {"id": "post-2"}]},
        "boss": {"posts": [{"id": "post-2"}, {"id": "post-3"}]},
    }

    def fake_get(url: str, timeout: int) -> _FakeResponse:
        assert timeout == 5
        if "tag=rpg" in url:
            return _FakeResponse(responses["rpg"])
        return _FakeResponse(responses["boss"])

    monkeypatch.setattr("services.reco_service.similar_by_tags.requests.get", fake_get)

    result = get_similar_by_tags(["rpg", "boss"], limit=3, exclude_ids=["post-3"])

    assert result == [
        ("post-1", 1.0, "similar_by_tags"),
        ("post-2", 1.0, "similar_by_tags"),
    ]
