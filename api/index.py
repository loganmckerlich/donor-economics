"""Vercel entrypoint for the FastAPI backend.

The model package lives in ``src/`` and the API in ``backend/``; neither is installed as a
package on Vercel, so put both on the path and re-export the ASGI app.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for p in (ROOT / "src", ROOT / "backend"):
    sys.path.insert(0, str(p))

from app.main import app  # noqa: E402,F401
