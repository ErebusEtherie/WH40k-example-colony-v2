"""Database helpers for the persistence adapters."""

from __future__ import annotations

from pathlib import Path


def build_database_url(path: str | Path) -> str:
    resolved = Path(path).expanduser().resolve()
    resolved.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{resolved.as_posix()}"
