"""SQLAlchemy implementation of AuditLogRepository."""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import desc, select

from colony_manager.adapters.persistence.mappers import (
    domain_to_orm_audit_log,
    orm_to_domain_audit_log,
)
from colony_manager.adapters.persistence.orm_models import AuditLogORM
from colony_manager.domain.models.audit_log import AuditLog
from colony_manager.domain.ports.audit_log_repository import AuditLogRepository


class SqlAlchemyAuditLogRepository(AuditLogRepository):
    """SQLAlchemy implementation of AuditLogRepository.

    This implementation uses SQLAlchemy for database operations and follows
    the repository pattern defined in the domain layer.
    """

    def __init__(self, database_url: str = "sqlite:///:memory:") -> None:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        self._engine = create_engine(database_url)
        self._session_factory = sessionmaker(bind=self._engine, autoflush=False, autocommit=False)

    def _get_session(self) -> Any:
        """Get a database session."""

        return self._session_factory()

    def create(self, audit_log: AuditLog) -> AuditLog:
        """Create a new audit log entry in the database."""
        with self._get_session() as session:
            orm_log = domain_to_orm_audit_log(audit_log)
            orm_log.changed_at = datetime.now(UTC)

            session.add(orm_log)
            session.commit()
            session.refresh(orm_log)

            return orm_to_domain_audit_log(orm_log)

    def get_by_id(self, log_id: int) -> AuditLog | None:
        """Get an audit log entry by ID."""
        with self._get_session() as session:
            query = select(AuditLogORM).where(AuditLogORM.id == log_id)
            result = session.execute(query)
            orm_log = result.scalar_one_or_none()

            if orm_log is None:
                return None

            return orm_to_domain_audit_log(orm_log)

    def get_by_colony(
        self,
        colony_id: int,
        limit: int = 100,
        offset: int = 0,
        entity_type: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[AuditLog]:
        """Get audit log entries for a colony with filtering and pagination."""
        with self._get_session() as session:
            query = select(AuditLogORM).where(AuditLogORM.colony_id == colony_id)

            if entity_type:
                query = query.where(AuditLogORM.entity_type == entity_type)

            if start_date:
                query = query.where(AuditLogORM.changed_at >= start_date)

            if end_date:
                query = query.where(AuditLogORM.changed_at <= end_date)

            # Order by changed_at descending (most recent first)
            query = query.order_by(desc(AuditLogORM.changed_at)).offset(offset).limit(limit)

            result = session.execute(query)
            orm_logs = result.scalars().all()
            return [orm_to_domain_audit_log(orm) for orm in orm_logs]

    def get_by_entity(self, entity_type: str, entity_id: int) -> list[AuditLog]:
        """Get audit log entries for a specific entity."""
        with self._get_session() as session:
            query = select(AuditLogORM).where(
                AuditLogORM.entity_type == entity_type,
                AuditLogORM.entity_id == entity_id,
            )
            query = query.order_by(desc(AuditLogORM.changed_at))

            result = session.execute(query)
            orm_logs = result.scalars().all()
            return [orm_to_domain_audit_log(orm) for orm in orm_logs]
