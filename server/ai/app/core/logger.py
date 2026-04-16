import logging
import asyncio
from typing import Set

class WebSocketLogHandler(logging.Handler):
    def __init__(self):
        super().__init__()
        self.queues: Set[asyncio.Queue] = set()
        self.main_loop = None

    def emit(self, record):
        msg = self.format(record)
        
        # If no users are connected or loop not registered, ignore
        if not self.queues or not self.main_loop:
            return

        try:
            for q in list(self.queues):
                self.main_loop.call_soon_threadsafe(q.put_nowait, msg)
        except Exception:
            pass 

    async def add_queue(self, q: asyncio.Queue):
        if not self.main_loop:
            self.main_loop = asyncio.get_running_loop()
        self.queues.add(q)

    async def remove_queue(self, q: asyncio.Queue):
        self.queues.discard(q)

ws_handler = WebSocketLogHandler()
ws_handler.setFormatter(logging.Formatter('[%(asctime)s] %(message)s', datefmt='%H:%M:%S'))

logger = logging.getLogger("ai_backend")
logger.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter('[%(asctime)s] %(message)s', datefmt='%H:%M:%S'))

# Add both handlers so it logs to terminal and web UI
logger.addHandler(ws_handler)
logger.addHandler(console_handler)

