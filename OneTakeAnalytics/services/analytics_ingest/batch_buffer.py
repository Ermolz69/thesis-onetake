import logging
import threading
import time
from collections import deque

logger = logging.getLogger(__name__)


class BatchBuffer:
    def __init__(self, writer, batch_size: int = 200, interval_sec: float = 1.5):
        self._writer = writer
        self._batch_size = batch_size
        self._interval_sec = interval_sec
        self._buffer: deque = deque()
        self._lock = threading.Lock()
        self._seen_ids: set[str] = set()
        self._seen_max = 10_000
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()

    def add(self, row: dict) -> None:
        event_id = row.get("event_id")
        with self._lock:
            if event_id and event_id in self._seen_ids:
                return
            self._buffer.append(row)
            if event_id:
                self._seen_ids.add(event_id)
                if len(self._seen_ids) > self._seen_max:
                    self._seen_ids.clear()

    def _flush(self) -> None:
        with self._lock:
            if not self._buffer:
                return
            batch = []
            for _ in range(min(self._batch_size, len(self._buffer))):
                batch.append(self._buffer.popleft())
        if batch:
            try:
                self._writer.insert_batch(batch)
                logger.debug("Flushed %s events to ClickHouse", len(batch))
            except Exception as e:
                logger.exception("ClickHouse insert failed: %s", e)
                with self._lock:
                    for r in batch:
                        self._buffer.appendleft(r)

    def _run(self) -> None:
        while not self._stop.wait(timeout=self._interval_sec):
            self._flush()

    def start(self) -> None:
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()
