import logging
import threading
import time
from concurrent import futures

import grpc

from .config import GRPC_PORT, BATCH_SIZE, BATCH_INTERVAL_SEC
from .clickhouse_writer import ClickHouseWriter
from .batch_buffer import BatchBuffer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import generated proto (path from service: libs/onetake_proto)
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "libs" / "onetake_proto"))
from analytics.v1 import analytics_pb2, analytics_pb2_grpc


class AnalyticsIngestServicer(analytics_pb2_grpc.AnalyticsIngestServicer):
    def __init__(self, buffer: BatchBuffer):
        self._buffer = buffer

    def TrackEvent(self, request, context):
        try:
            row = {
                "event_id": request.event_id or None,
                "ts": request.ts,
                "user_id": request.user_id or None,
                "session_id": request.session_id or "",
                "event_name": request.event_name or "",
                "route": request.route or "",
                "entity_type": request.entity_type or None,
                "entity_id": request.entity_id or None,
                "props_json": request.props_json or "{}",
                "trace_id": request.trace_id or "",
            }
            self._buffer.add(row)
            return analytics_pb2.TrackEventResponse(accepted=True)
        except Exception as e:
            logger.exception("TrackEvent error")
            return analytics_pb2.TrackEventResponse(accepted=False, error=str(e))


def serve():
    writer = ClickHouseWriter()
    buffer = BatchBuffer(
        writer=writer,
        batch_size=BATCH_SIZE,
        interval_sec=BATCH_INTERVAL_SEC,
    )
    buffer.start()

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    analytics_pb2_grpc.add_AnalyticsIngestServicer_to_server(
        AnalyticsIngestServicer(buffer), server
    )
    server.add_insecure_port(f"[::]:{GRPC_PORT}")
    server.start()
    logger.info("Analytics Ingest gRPC server listening on port %s", GRPC_PORT)
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
