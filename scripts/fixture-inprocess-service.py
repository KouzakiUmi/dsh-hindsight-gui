"""Disposable ASGI fixture: imports the extension but never constructs a memory engine."""
import asyncio
from contextlib import asynccontextmanager
import json
import os
from pathlib import Path
import signal
import sys

print(json.dumps({"stage": "bootstrap"}), flush=True)
sys.path.insert(0, sys.argv[1])
from dsh_hindsight_control import ControlExtension, configure_entrypoint, EXTENSION
print(json.dumps({"stage": "extension-imported"}), flush=True)
configure_entrypoint()
configure_entrypoint()
assert os.environ['HINDSIGHT_API_HTTP_EXTENSION'] == EXTENSION
from fastapi import FastAPI
import uvicorn

port = int(sys.argv[2])
marker = Path(sys.argv[3])
received = []
expired = False
signal.signal(signal.SIGTERM, lambda signum, frame: received.append(signum))
extension = ControlExtension({})
original_shutdown = extension._shutdown


async def delayed_shutdown():
    # Deterministic window for concurrent duplicate requests, then the REAL signal path.
    await asyncio.sleep(0.5)
    await original_shutdown()


extension._shutdown = delayed_shutdown


def expire():
    global expired
    expired = True
    server.handle_exit(signal.SIGTERM, None)


@asynccontextmanager
async def lifespan(app):
    timer = asyncio.get_running_loop().call_later(25, expire)
    print(json.dumps({"ready": True, "pid": os.getpid(), "port": port}), flush=True)
    try:
        yield
    finally:
        timer.cancel()
        await asyncio.sleep(0.1)
        marker.write_text("CLEANED", encoding="utf-8")


app = FastAPI(lifespan=lifespan)
app.include_router(extension.get_router(None), prefix="/ext")
server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="error", access_log=False))
server.run()
print(json.dumps({"exited": True, "signals": len(received), "expired": expired}), flush=True)
