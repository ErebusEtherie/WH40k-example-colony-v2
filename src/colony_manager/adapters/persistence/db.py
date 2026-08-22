"""Database helpers for the persistence adapters.

Database migrations are managed by Alembic. To initialize a new database:

    alembic upgrade head

For existing databases, run migrations with:

    alembic upgrade head

Do NOT use init_db() for production databases - it bypasses migration tracking.
"""

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
    """Initialize database tables.
    
    For production use, prefer running Alembic migrations directly via CLI:
    
        alembic upgrade head
    
    For tests and development, this creates all tables directly.
    
    Args:
        db_path: Path to the SQLite database file.
    """
    from sqlalchemy import create_engine
    
    engine = create_engine(build_database_url(db_path))
    Base.metadata.create_all(engine)
