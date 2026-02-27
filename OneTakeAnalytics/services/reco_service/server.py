import logging
import sys
from pathlib import Path
from concurrent import futures

import grpc

from .config import GRPC_PORT
from .trending import get_trending_post_ids

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "libs" / "onetake_proto"))
from reco.v1 import reco_pb2, reco_pb2_grpc


class RecoServicer(reco_pb2_grpc.RecoServiceServicer):
    def GetRecommendations(self, request, context):
        limit = request.limit or 10
        exclude_ids = list(request.exclude_post_ids) if request.exclude_post_ids else []
        items_tuples = get_trending_post_ids(limit, exclude_ids)
        items = [
            reco_pb2.RecommendationItem(post_id=pid, score=score, reason=reason)
            for pid, score, reason in items_tuples
        ]
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
