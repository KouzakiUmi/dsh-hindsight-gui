"""Hindsight's official HTTP extension: authenticated, in-process graceful shutdown.

No external process signalling, console attachment, shell or database initialization here.
"""
import argparse
import hmac
import ipaddress
import json
import os
import re
import signal
import sys
import threading
from importlib.metadata import version
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request
from hindsight_api.extensions.http import HttpExtension

EXTENSION = "dsh_hindsight_control:ControlExtension"
PREFIX = "/dsh-control"


class ControlExtension(HttpExtension):
    def __init__(self, config):
        super().__init__(config)
        self.token = os.environ.get("DSH_HINDSIGHT_CONTROL_TOKEN", "")
        self.nonce = os.environ.get("DSH_HINDSIGHT_CONTROL_NONCE", "")
        self.port = int(os.environ.get("DSH_HINDSIGHT_CONTROL_PORT", "0"))
        if not re.fullmatch(r"[a-f0-9]{64}", self.token) or not re.fullmatch(r"[a-f0-9]{32}", self.nonce) or not 0 < self.port < 65536:
            raise RuntimeError("Invalid private control configuration")
        self.stopping = False

    def _authorize(self, request, tokens, pids, nonces):
        peer = request.client.host if request.client else ""
        try:
            local = ipaddress.ip_address(peer).is_loopback
        except ValueError:
            local = False
        if not local or request.headers.get("origin") is not None:
            raise HTTPException(403, "Local control requests only")
        hosts = {f"127.0.0.1:{self.port}", f"localhost:{self.port}"}
        if self.port == 80:
            hosts.update({"127.0.0.1", "localhost"})
        if request.headers.get("host") not in hosts:
            raise HTTPException(403, "Invalid control host")
        if not tokens or len(tokens) != 1 or not re.fullmatch(r"[a-f0-9]{64}", tokens[0]) or not hmac.compare_digest(tokens[0], self.token):
            raise HTTPException(403, "Control authentication failed")
        if not pids or len(pids) != 1 or pids[0] != str(os.getpid()) or not nonces or len(nonces) != 1 or not re.fullmatch(r"[a-f0-9]{32}", nonces[0]) or not hmac.compare_digest(nonces[0], self.nonce):
            raise HTTPException(409, "Control process identity changed")

    def _identity(self):
        return {"version": 1, "pid": os.getpid(), "nonce": self.nonce, "stopping": self.stopping}

    async def _shutdown(self):
        # Runs on the event-loop thread AFTER the acknowledgement has been sent.
        # Unlike os.kill(pid, SIGTERM) on Windows, this invokes this process's handler.
        if self.stopping:
            return
        self.stopping = True
        signal.raise_signal(signal.SIGTERM)

    def get_router(self, memory):
        router = APIRouter(prefix=PREFIX)

        @router.get("/identity", include_in_schema=False)
        async def identity(request: Request, x_dsh_control_token: Annotated[list[str] | None, Header()] = None,
                           x_dsh_control_pid: Annotated[list[str] | None, Header()] = None,
                           x_dsh_control_nonce: Annotated[list[str] | None, Header()] = None):
            self._authorize(request, x_dsh_control_token, x_dsh_control_pid, x_dsh_control_nonce)
            return self._identity()

        @router.post("/stop", status_code=202, include_in_schema=False)
        async def stop(request: Request, background_tasks: BackgroundTasks,
                       x_dsh_control_token: Annotated[list[str] | None, Header()] = None,
                       x_dsh_control_pid: Annotated[list[str] | None, Header()] = None,
                       x_dsh_control_nonce: Annotated[list[str] | None, Header()] = None):
            self._authorize(request, x_dsh_control_token, x_dsh_control_pid, x_dsh_control_nonce)
            handler = signal.getsignal(signal.SIGTERM)
            if threading.current_thread() is not threading.main_thread() or not callable(handler):
                raise HTTPException(409, "Graceful signal handler is not active")
            if not self.stopping:
                background_tasks.add_task(self._shutdown)
            # A dropped response must not permanently latch the service before
            # its background callback actually ran. The callback sends at most once.
            return {**self._identity(), "stopping": True}

        return router


def compatibility():
    # Version-pinned adapter: .env loading is checked against the installed 0.10.2
    # source; it is not a claimed stable public API. Fail before stopping a server.
    if version("hindsight-api") != "0.10.2":
        raise RuntimeError("This control adapter currently requires hindsight-api 0.10.2")
    from hindsight_api.config import load_dotenv_for_entrypoint
    # .env is authoritative in 0.10.2, but cannot replace host-generated control credentials.
    names = ("DSH_HINDSIGHT_CONTROL_TOKEN", "DSH_HINDSIGHT_CONTROL_NONCE", "DSH_HINDSIGHT_CONTROL_PORT")
    private = {name: os.environ.get(name) for name in names}
    launch = {name: value for name, value in os.environ.items()
              if name.startswith('HINDSIGHT_API_') and name != 'HINDSIGHT_API_HTTP_EXTENSION'}
    load_dotenv_for_entrypoint()
    if any(os.environ.get(name) != value for name, value in launch.items()):
        raise RuntimeError('.env conflicts with the supplied launch environment; refusing to stop the old service')
    for name, value in private.items():
        if value is None:
            os.environ.pop(name, None)
        else:
            os.environ[name] = value
    if os.environ.get("HINDSIGHT_API_HTTP_EXTENSION", "") not in {"", EXTENSION}:
        raise RuntimeError("An existing HTTP extension is configured; it will not be overwritten")
    if os.environ.get("HINDSIGHT_API_WORKERS", "1") != "1":
        raise RuntimeError("Cooperative control currently requires one worker")
    if not callable(getattr(signal, "raise_signal", None)):
        raise RuntimeError("In-process signals are not supported")
    return {"version": 1, "python": sys.version.split()[0], "hindsight": version("hindsight-api"),
            "fastapi": version("fastapi"), "uvicorn": version("uvicorn")}


def configure_entrypoint():
    # The pinned CLI reloads .env with override=True. Run that same loader and
    # conflict checks before injecting our empty-slot extension, never skip them.
    compatibility()
    ControlExtension({})
    os.environ["HINDSIGHT_API_HTTP_EXTENSION"] = EXTENSION


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--preflight", action="store_true")
    parser.add_argument("--port", type=int)
    args = parser.parse_args()
    try:
        result = compatibility()
        if args.preflight:
            print(json.dumps(result))
            return
        if not args.port or not 0 < args.port < 65536:
            raise RuntimeError("Invalid server port")
        # Re-check the launch-only secrets before Hindsight initializes resources.
        os.environ["DSH_HINDSIGHT_CONTROL_PORT"] = str(args.port)
        ControlExtension({})
        import hindsight_api.main as hindsight_cli
        hindsight_cli.load_dotenv_for_entrypoint = configure_entrypoint
        sys.argv = ["hindsight-api", "--host", "127.0.0.1", "--port", str(args.port), "--workers", "1"]
        hindsight_cli.main()
    except Exception:
        # Unknown exception text may contain credentials from third-party config.
        print("Hindsight control bootstrap failed: check interpreter, version, HTTP extension and workers; no forceful termination attempted.", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
