"""SQLAlchemy implementation of LoginAttemptRepository."""

from datetime import datetime

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from colony_manager.adapters.persistence.orm_models import LoginAttemptORM
from colony_manager.domain.models.login_attempt import LoginAttempt
from colony_manager.domain.ports.login_attempt_repository import LoginAttemptRepository


class SqlAlchemyLoginAttemptRepository(LoginAttemptRepository):
    """SQLAlchemy implementation of LoginAttemptRepository.
    
    This implementation uses SQLAlchemy for database operations and follows
    the repository pattern defined in the domain layer.
    """
    
    def __init__(self, database_url: str = "sqlite:///:memory:") -> None:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        engine = create_engine(database_url)
        self._session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    
    def _get_session(self) -> Session:
        """Get a database session."""
        
        return self._session_factory()
    
    def create(self, attempt: LoginAttempt) -> LoginAttempt:
        """Record a login attempt."""
        with self._get_session() as session:
            orm_entry = LoginAttemptORM(
                username=attempt.username,
                ip_address=attempt.ip_address,
                attempted_at=attempt.attempted_at,
                success=attempt.success,
                user_agent=attempt.user_agent,
            )
            
            session.add(orm_entry)
            session.commit()
            session.refresh(orm_entry)
            
            return LoginAttempt(
                id=orm_entry.id,
                username=orm_entry.username,
                ip_address=orm_entry.ip_address,
                attempted_at=orm_entry.attempted_at,
                success=orm_entry.success,
                user_agent=orm_entry.user_agent,
            )
    
    def count_failed_attempts(
        self,
        username: str,
        since: datetime,
        ip_address: str | None = None,
    ) -> int:
        """Count failed login attempts for a username since a given time."""
        with self._get_session() as session:
            query = select(func.count(LoginAttemptORM.id)).where(
                LoginAttemptORM.username == username,
                LoginAttemptORM.success == False,
                LoginAttemptORM.attempted_at >= since,
            )
            
            if ip_address:
                query = query.where(LoginAttemptORM.ip_address == ip_address)
            
            result = session.execute(query)
            return result.scalar() or 0
    
    def cleanup_old_attempts(self, before: datetime) -> int:
        """Remove old login attempt records."""
        with self._get_session() as session:
            query = delete(LoginAttemptORM).where(
                LoginAttemptORM.attempted_at < before
            )
            result = session.execute(query)
            session.commit()
            return result.rowcount or 0  # type: ignore[attr-defined]