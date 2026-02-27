import os

GRPC_PORT = int(os.environ.get("GRPC_PORT", "50051"))
CLICKHOUSE_HOST = os.environ.get("CLICKHOUSE_HOST", "localhost")
CLICKHOUSE_PORT = int(os.environ.get("CLICKHOUSE_PORT", "9000"))
CLICKHOUSE_USER = os.environ.get("CLICKHOUSE_USER", "default")
CLICKHOUSE_PASSWORD = os.environ.get("CLICKHOUSE_PASSWORD", "default")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "200"))
BATCH_INTERVAL_SEC = float(os.environ.get("BATCH_INTERVAL_SEC", "1.5"))
