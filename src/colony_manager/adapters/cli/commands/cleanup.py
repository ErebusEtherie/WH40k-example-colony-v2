"""CLI commands for cleanup and maintenance tasks."""

import typer

from colony_manager.adapters.persistence.db import build_database_url
from colony_manager.adapters.persistence.repositories.token_blacklist_repository_impl import (
    SqlAlchemyTokenBlacklistRepository,
)
from colony_manager.adapters.persistence.repositories.login_attempt_repository_impl import (
    SqlAlchemyLoginAttemptRepository,
)
from colony_manager.adapters.persistence.repositories.token_issuance_repository_impl import (
    SqlAlchemyTokenIssuanceRepository,
)

cleanup_app = typer.Typer(help="Cleanup and maintenance commands")


@cleanup_app.command("token-blacklist")
def cleanup_token_blacklist(
    db_path: str = typer.Option("colony_manager.sqlite", "--db-path", help="Path to SQLite DB"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Show what would be deleted"),
):
    """Remove expired entries from the token blacklist."""
    from datetime import UTC, datetime
    from sqlalchemy import func, select
    from colony_manager.adapters.persistence.orm_models import TokenBlacklistORM
    
    database_url = build_database_url(db_path)
    repo = SqlAlchemyTokenBlacklistRepository(database_url)
    
    if dry_run:
        with repo._session_factory() as session:
            query = select(func.count(TokenBlacklistORM.id)).where(
                TokenBlacklistORM.expires_at < datetime.now(UTC)
            )
            count = session.execute(query).scalar() or 0
        typer.echo(f"Would remove {count} expired token blacklist entries")
    else:
        removed = repo.cleanup_expired()
        typer.echo(f"Removed {removed} expired token blacklist entries")


@cleanup_app.command("login-attempts")
def cleanup_login_attempts(
    db_path: str = typer.Option("colony_manager.sqlite", "--db-path", help="Path to SQLite DB"),
    days: int = typer.Option(30, "--days", help="Days to keep login attempt records"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Show what would be deleted"),
):
    """Remove old login attempt records."""
    from datetime import UTC, datetime, timedelta
    from sqlalchemy import func, select
    from colony_manager.adapters.persistence.orm_models import LoginAttemptORM
    
    database_url = build_database_url(db_path)
    repo = SqlAlchemyLoginAttemptRepository(database_url)
    cutoff = datetime.now(UTC) - timedelta(days=days)
    
    if dry_run:
        with repo._session_factory() as session:
            query = select(func.count(LoginAttemptORM.id)).where(
                LoginAttemptORM.attempted_at < cutoff
            )
            count = session.execute(query).scalar() or 0
        typer.echo(f"Would remove {count} login attempt records older than {days} days")
    else:
        removed = repo.cleanup_old_attempts(cutoff)
        typer.echo(f"Removed {removed} login attempt records older than {days} days")


@cleanup_app.command("token-issuance")
def cleanup_token_issuance(
    db_path: str = typer.Option("colony_manager.sqlite", "--db-path", help="Path to SQLite DB"),
    days: int = typer.Option(90, "--days", help="Days to keep token issuance records"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Show what would be deleted"),
):
    """Remove old token issuance records."""
    from datetime import UTC, datetime, timedelta
    from sqlalchemy import func, select
    from colony_manager.adapters.persistence.orm_models import TokenIssuanceORM
    
    database_url = build_database_url(db_path)
    repo = SqlAlchemyTokenIssuanceRepository(database_url)
    cutoff = datetime.now(UTC) - timedelta(days=days)
    
    if dry_run:
        with repo._session_factory() as session:
            query = select(func.count(TokenIssuanceORM.id)).where(
                TokenIssuanceORM.expires_at < cutoff
            )
            count = session.execute(query).scalar() or 0
        typer.echo(f"Would remove {count} token issuance records older than {days} days")
    else:
        removed = repo.cleanup_old_issuances(cutoff)
        typer.echo(f"Removed {removed} token issuance records older than {days} days")


@cleanup_app.command("all")
def cleanup_all(
    db_path: str = typer.Option("colony_manager.sqlite", "--db-path", help="Path to SQLite DB"),
    login_attempt_days: int = typer.Option(30, "--login-attempt-days", help="Days to keep login attempts"),
    token_issuance_days: int = typer.Option(90, "--token-issuance-days", help="Days to keep token issuances"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Show what would be deleted"),
):
    """Run all cleanup tasks."""
    from datetime import UTC, datetime, timedelta
    
    typer.echo("Running all cleanup tasks...")
    typer.echo()
    
    database_url = build_database_url(db_path)
    
    # Token blacklist
    tb_repo = SqlAlchemyTokenBlacklistRepository(database_url)
    removed = tb_repo.cleanup_expired()
    typer.echo(f"Removed {removed} expired token blacklist entries")
    
    # Login attempts
    la_repo = SqlAlchemyLoginAttemptRepository(database_url)
    cutoff = datetime.now(UTC) - timedelta(days=login_attempt_days)
    removed = la_repo.cleanup_old_attempts(cutoff)
    typer.echo(f"Removed {removed} login attempt records older than {login_attempt_days} days")
    
    # Token issuance
    ti_repo = SqlAlchemyTokenIssuanceRepository(database_url)
    cutoff = datetime.now(UTC) - timedelta(days=token_issuance_days)
    removed = ti_repo.cleanup_old_issuances(cutoff)
    typer.echo(f"Removed {removed} token issuance records older than {token_issuance_days} days")
    
    typer.echo()
    typer.echo("Cleanup complete!")