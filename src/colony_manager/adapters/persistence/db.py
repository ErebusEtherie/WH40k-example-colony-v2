"""Database helpers for the persistence adapters."""

from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine

from colony_manager.adapters.persistence.orm_models import Base


def build_database_url(path: str | Path) -> str:
    """Build SQLite database URL from path."""
    resolved = Path(path).expanduser().resolve()
    resolved.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{resolved.as_posix()}"


def init_db(db_path: str | Path) -> None:
    """Initialize database tables."""
    engine = create_engine(build_database_url(db_path))
    Base.metadata.create_all(engine)
