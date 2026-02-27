"""Entry point for Analytics Ingest gRPC service."""
from .server import serve

if __name__ == "__main__":
    serve()
