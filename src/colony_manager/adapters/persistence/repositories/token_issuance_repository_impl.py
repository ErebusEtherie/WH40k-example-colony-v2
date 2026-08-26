"""SQLAlchemy implementation of TokenIssuanceRepository."""

from datetime import datetime

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from colony_manager.adapters.persistence.orm_models import TokenIssuanceORM
from colony_manager.domain.models.token_issuance import TokenIssuance
from colony_manager.domain.ports.token_issuance_repository import TokenIssuanceRepository


class SqlAlchemyTokenIssuanceRepository(TokenIssuanceRepository):
    """SQLAlchemy implementation of TokenIssuanceRepository."""

    def __init__(self, database_url: str = "sqlite:///:memory:") -> None:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        engine = create_engine(database_url)
        self._session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def _get_session(self) -> Session:
        """Get a database session."""

        return self._session_factory()

    def create(self, issuance: TokenIssuance) -> TokenIssuance:
        """Record a token issuance."""
        with self._get_session() as session:
            orm_entry = TokenIssuanceORM(
                user_id=issuance.user_id,
                token_id=issuance.token_id,
                token_type=issuance.token_type,
                issued_at=issuance.issued_at,
                expires_at=issuance.expires_at,
                revoked_at=issuance.revoked_at,
                ip_address=issuance.ip_address,
                user_agent=issuance.user_agent,
            )

            session.add(orm_entry)
            session.commit()
            session.refresh(orm_entry)

            return TokenIssuance(
                id=orm_entry.id,
                user_id=orm_entry.user_id,
                token_id=orm_entry.token_id,
                token_type=orm_entry.token_type,
                issued_at=orm_entry.issued_at,
                expires_at=orm_entry.expires_at,
                revoked_at=orm_entry.revoked_at,
                ip_address=orm_entry.ip_address,
                user_agent=orm_entry.user_agent,
            )

    def get_active_tokens(self, user_id: int) -> list[TokenIssuance]:
        """Get all active tokens for a user."""
        from sqlalchemy import func

        with self._get_session() as session:
            query = select(TokenIssuanceORM).where(
                TokenIssuanceORM.user_id == user_id,
                TokenIssuanceORM.revoked_at.is_(None),
                TokenIssuanceORM.expires_at > func.now(),
            )

            results = session.execute(query).scalars().all()

            return [
                TokenIssuance(
                    id=orm_entry.id,
                    user_id=orm_entry.user_id,
                    token_id=orm_entry.token_id,
                    token_type=orm_entry.token_type,
                    issued_at=orm_entry.issued_at,
                    expires_at=orm_entry.expires_at,
                    revoked_at=orm_entry.revoked_at,
                    ip_address=orm_entry.ip_address,
                    user_agent=orm_entry.user_agent,
                )
                for orm_entry in results
            ]

    def revoke_token(self, token_id: str, revoked_at: datetime) -> bool:
        """Revoke a specific token."""
        with self._get_session() as session:
            query = (
                update(TokenIssuanceORM)
                .where(
                    TokenIssuanceORM.token_id == token_id,
                    TokenIssuanceORM.revoked_at.is_(None),
                )
                .values(revoked_at=revoked_at)
            )

            result = session.execute(query)
            session.commit()

            return bool(result.rowcount > 0)  # type: ignore[attr-defined]  # SQLAlchemy Result has rowcount at runtime

    def revoke_all_user_tokens(self, user_id: int, revoked_at: datetime) -> int:
        """Revoke all tokens for a user."""
        with self._get_session() as session:
            query = (
                update(TokenIssuanceORM)
                .where(
                    TokenIssuanceORM.user_id == user_id,
                    TokenIssuanceORM.revoked_at.is_(None),
                )
                .values(revoked_at=revoked_at)
            )

            result = session.execute(query)
            session.commit()

            return result.rowcount or 0  # type: ignore[attr-defined]

    def cleanup_old_issuances(self, before: datetime) -> int:
        """Remove old token issuance records."""
        with self._get_session() as session:
            query = delete(TokenIssuanceORM).where(TokenIssuanceORM.expires_at < before)
            result = session.execute(query)
            session.commit()
            return result.rowcount or 0  # type: ignore[attr-defined]
