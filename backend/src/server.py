from __future__ import annotations

import sys
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Dict
from pathlib import Path

# Allow running this file directly.
ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(ROOT / "backend"))

from src.app import run_demo


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
        if self.path in ("/", "/health"):
            self._send_json(200, {"ok": True})
            return

        if self.path == "/api/demo":
            try:
                payload = run_demo()
            except Exception as e:  # pragma: no cover
                self._send_json(500, {"error": str(e)})
                return
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

