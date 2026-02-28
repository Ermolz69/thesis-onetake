import logging
import sys
from pathlib import Path
from concurrent import futures

import grpc

from .config import GRPC_PORT, CACHE_TTL_MINUTES, CACHE_ENABLED
from .cache import RecoCache
from .trending import get_trending_post_ids
from .similar_by_tags import get_similar_by_tags
from .personalize import get_watch_based, get_liked_based, get_trending_fallback

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "libs" / "onetake_proto"))
from reco.v1 import reco_pb2, reco_pb2_grpc

_reco_cache = RecoCache(ttl_minutes=CACHE_TTL_MINUTES, enabled=CACHE_ENABLED)


def _compute_recommendations(request) -> list:
    limit = request.limit or 10
    exclude_ids = list(request.exclude_post_ids) if request.exclude_post_ids else []
    context_tags = list(request.context_tags) if request.context_tags else []
    context_post_id = (request.context_post_id or "").strip()
    user_id = (request.user_id or "").strip()
    items_tuples = []

    if context_tags:
        similar = get_similar_by_tags(context_tags, limit, exclude_ids)
        items_tuples.extend(similar)
        exclude_ids = exclude_ids + [pid for pid, _, _ in similar]

    remaining = limit - len(items_tuples)
    if remaining > 0 and user_id:
        watch = get_watch_based(user_id, remaining, exclude_ids)
        items_tuples.extend(watch)
        exclude_ids = exclude_ids + [pid for pid, _, _ in watch]

    remaining = limit - len(items_tuples)
    if remaining > 0 and user_id:
        liked = get_liked_based(user_id, remaining, exclude_ids)
        items_tuples.extend(liked)
        exclude_ids = exclude_ids + [pid for pid, _, _ in liked]

    remaining = limit - len(items_tuples)
    if remaining > 0:
        fallback = get_trending_fallback(remaining, exclude_ids)
        items_tuples.extend(fallback)

    return items_tuples[:limit]


class RecoServicer(reco_pb2_grpc.RecoServiceServicer):
    def GetRecommendations(self, request, context):
        limit = request.limit or 10
        exclude_ids = list(request.exclude_post_ids) if request.exclude_post_ids else []
        context_tags = tuple(request.context_tags) if request.context_tags else ()
        context_post_id = (request.context_post_id or "").strip()
        user_id = (request.user_id or "").strip()
        feed_type = (request.feed_type or "HOME").strip()

        cache_key_exclude = tuple(sorted(exclude_ids))
        cached = _reco_cache.get(
            user_id=user_id,
            feed_type=feed_type,
            context_post_id=context_post_id,
            context_tags=context_tags,
            exclude_ids=cache_key_exclude,
        )
        if cached is not None:
            return reco_pb2.GetRecommendationsResponse(items=cached)

        items_tuples = _compute_recommendations(request)
        items = [
            reco_pb2.RecommendationItem(post_id=pid, score=score, reason=reason)
            for pid, score, reason in items_tuples
        ]
        _reco_cache.set(
            user_id=user_id,
            feed_type=feed_type,
            items=items,
            context_post_id=context_post_id,
            context_tags=context_tags,
            exclude_ids=cache_key_exclude,
        )
        return reco_pb2.GetRecommendationsResponse(items=items)


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    reco_pb2_grpc.add_RecoServiceServicer_to_server(RecoServicer(), server)
    server.add_insecure_port(f"[::]:{GRPC_PORT}")
    server.start()
    logger.info("Reco gRPC server listening on port %s", GRPC_PORT)
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
