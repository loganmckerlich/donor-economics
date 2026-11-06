"""Serves the markdown files in ``economics-knowledgebase/`` to the frontend."""

import os
from pathlib import Path

KB_DIR = Path(
    os.environ.get(
        "KNOWLEDGEBASE_DIR",
        Path(__file__).resolve().parents[2] / "economics-knowledgebase",
    )
)


def _slug(path: Path) -> str:
    return "overview" if path.stem.lower() == "readme" else path.stem.lower()


def _files() -> dict[str, Path]:
    """slug -> file, in reading order (overview first, then numbered notes)."""
    paths = sorted(KB_DIR.glob("*.md"), key=lambda p: (p.stem.lower() != "readme", p.name))
    return {_slug(p): p for p in paths}


def _title(text: str, fallback: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return fallback


def list_docs() -> list[dict]:
    return [
        {"slug": slug, "title": _title(p.read_text(encoding="utf-8"), slug)}
        for slug, p in _files().items()
    ]


def get_doc(slug: str) -> dict | None:
    # Look the slug up in the directory listing: never build a path from user input.
    path = _files().get(slug)
    if path is None:
        return None
    text = path.read_text(encoding="utf-8")
    return {"slug": slug, "title": _title(text, slug), "markdown": text}
