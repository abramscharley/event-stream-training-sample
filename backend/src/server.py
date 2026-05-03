from __future__ import annotations

import sys
import json
import time
import os
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Dict
from pathlib import Path
from urllib.parse import urlparse, parse_qs

# Allow running this file directly.
ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(ROOT / "backend"))

from src.app import run_demo

# Runtime evidence for the frontend `/api/demo` debugging flow.
# This file is intentionally kept so future debug sessions can reuse the same trace mechanism.
_RAW_DEBUG_SESSION_ID = os.environ.get("DEBUG_SESSION_ID", "local-debug")


def _safe_debug_session_id(value: str) -> str:
    """Prevent path traversal by enforcing a strict allowlist for the log filename."""
    # Allow only [A-Za-z0-9_-], up to a reasonable length.
    if re.fullmatch(r"[A-Za-z0-9_-]{1,64}", value or ""):
        return value
    return "local-debug"


DEBUG_SESSION_ID = _safe_debug_session_id(_RAW_DEBUG_SESSION_ID)
LOG_PATH = ROOT / ".cursor" / f"debug-{DEBUG_SESSION_ID}.log"


def _write_debug_log(*, hypothesisId: str, location: str, message: str, data: Dict[str, Any] | None = None) -> None:
    """Write one NDJSON debug record for the current debug session."""
    record: Dict[str, Any] = {
        "sessionId": DEBUG_SESSION_ID,
        "hypothesisId": hypothesisId,
        "location": location,
        "message": message,
        "timestamp": int(time.time() * 1000),
    }
    if data is not None:
        record["data"] = data

    # Ensure the directory exists, but avoid touching other sessions' logs.
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, payload: Dict[str, Any]) -> None:
        body = json.dumps(payload)
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        # Support browser clients during local dev.
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body.encode("utf-8"))))
        self.end_headers()
        self.wfile.write(body.encode("utf-8"))

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed_path = urlparse(self.path)

        if parsed_path.path in ("/", "/health"):
            self._send_json(200, {"ok": True})
            return

        if parsed_path.path == "/api/demo":
            debug_enabled = parse_qs(parsed_path.query).get("debug", ["0"])[0] in ("1", "true", "yes")
            try:
                if debug_enabled:
                    _write_debug_log(
                        hypothesisId="H1_backend_unreachable_or_502",
                        location="backend/src/server.py:do_GET(api/demo)",
                        message="Request received",
                        data={"path": self.path},
                    )
                payload = run_demo()
            except Exception as e:  # pragma: no cover
                if debug_enabled:
                    _write_debug_log(
                        hypothesisId="H1_backend_unreachable_or_502",
                        location="backend/src/server.py:do_GET(api/demo)",
                        message="run_demo exception",
                        data={"error": str(e)},
                    )
                self._send_json(500, {"error": str(e)})
                return

            if debug_enabled:
                _write_debug_log(
                    hypothesisId="H2_backend_payload_shape",
                    location="backend/src/server.py:do_GET(api/demo)",
                    message="Request served successfully",
                    data={
                        "keys": sorted(payload.keys()),
                        "has_normalized_event": "normalized_event" in payload,
                    },
                )
            self._send_json(200, payload)
            return

        self._send_json(404, {"error": f"Unknown path: {self.path}"})


def main() -> None:
    # Keep port explicit so the frontend proxy can target it.
    server = HTTPServer(("0.0.0.0", 8000), Handler)
    print("Backend API running on http://localhost:8000")
    server.serve_forever()


if __name__ == "__main__":
    main()

