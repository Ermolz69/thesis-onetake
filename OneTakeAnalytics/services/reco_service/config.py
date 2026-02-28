import os
from pathlib import Path

from dotenv import load_dotenv

# .env в корені OneTakeAnalytics (рівень вище services/reco_service)
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(_env_path)

GRPC_PORT = int(os.environ.get("GRPC_PORT", "50052"))
CLICKHOUSE_HOST = os.environ.get("CLICKHOUSE_HOST", "localhost")
CLICKHOUSE_PORT = int(os.environ.get("CLICKHOUSE_PORT", "9000"))
CLICKHOUSE_USER = os.environ.get("CLICKHOUSE_USER", "default")
CLICKHOUSE_PASSWORD = os.environ.get("CLICKHOUSE_PASSWORD", "default")
CORE_API_URL = os.environ.get("CORE_API_URL", "http://localhost:5000")
CACHE_TTL_MINUTES = int(os.environ.get("CACHE_TTL_MINUTES", "15"))
CACHE_ENABLED = os.environ.get("CACHE_ENABLED", "true").lower() in ("true", "1", "yes")
