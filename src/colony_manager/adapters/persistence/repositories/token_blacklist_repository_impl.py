"""SQLAlchemy implementation of TokenBlacklistRepository."""

from datetime import UTC, datetime

from sqlalchemy import delete, select

from colony_manager.adapters.persistence.orm_models import TokenBlacklistORM
from colony_manager.domain.models.token_blacklist import TokenBlacklist
from colony_manager.domain.ports.token_blacklist_repository import TokenBlacklistRepository


class SqlAlchemyTokenBlacklistRepository(TokenBlacklistRepository):
    """SQLAlchemy implementation of TokenBlacklistRepository.
    
    This implementation uses SQLAlchemy for database operations and follows
    the repository pattern defined in the domain layer.
    """
    
    def __init__(self, database_url: str = "sqlite:///:memory:") -> None:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        engine = create_engine(database_url)
        self._session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    
    def _get_session(self):
        """Get a database session."""
        return self._session_factory()
    
    def create(self, token_blacklist: TokenBlacklist) -> TokenBlacklist:
        """Add a token to the blacklist."""
        with self._get_session() as session:
            orm_entry = TokenBlacklistORM(
                token_id=token_blacklist.token_id,
                user_id=token_blacklist.user_id,
                expires_at=token_blacklist.expires_at,
                revoked_at=token_blacklist.revoked_at,
                reason=token_blacklist.reason,
            )
            
            session.add(orm_entry)
            session.commit()
            session.refresh(orm_entry)
            
            return TokenBlacklist(
                id=orm_entry.id,
                token_id=orm_entry.token_id,
                user_id=orm_entry.user_id,
                expires_at=orm_entry.expires_at,
                revoked_at=orm_entry.revoked_at,
                reason=orm_entry.reason,
            )
    
    def is_blacklisted(self, token_id: str) -> bool:
        """Check if a token ID is blacklisted and not yet expired."""
        with self._get_session() as session:
            now = datetime.now(UTC)
            query = select(TokenBlacklistORM).where(
                TokenBlacklistORM.token_id == token_id,
                TokenBlacklistORM.expires_at > now,
            )
            result = session.execute(query)
            return result.scalar_one_or_none() is not None
    
    def revoke_all_user_tokens(self, user_id: int, reason: str | None = None) -> int:
        """Revoke all tokens for a user by adding them to blacklist.
        
        This method queries the token_issuance table for all active (non-revoked,
        non-expired) tokens for the user and adds them to the blacklist.
        
        Args:
            user_id: ID of the user whose tokens to revoke.
            reason: Optional reason for revocation.
            
        Returns:
            Number of tokens revoked.
        """
        revoked_count = 0
        now = datetime.now(UTC)
        
        with self._get_session() as session:
            try:
                # Find all active tokens for this user from the issuance table
                from colony_manager.adapters.persistence.orm_models import TokenIssuanceORM
                
                query = select(TokenIssuanceORM).where(
                    TokenIssuanceORM.user_id == user_id,
                    TokenIssuanceORM.revoked_at == None,
                    TokenIssuanceORM.expires_at > now,
                )
                
                results = session.execute(query).scalars().all()
                
                # Add each active token to the blacklist (skip if already blacklisted)
                for issuance in results:
                    # Check if already blacklisted to prevent duplicates
                    existing = session.execute(
                        select(TokenBlacklistORM).where(
                            TokenBlacklistORM.token_id == issuance.token_id
                        )
                    ).scalar_one_or_none()
                    
                    if existing is None:
                        blacklist_entry = TokenBlacklistORM(
                            token_id=issuance.token_id,
                            user_id=user_id,
                            expires_at=issuance.expires_at,
                            revoked_at=now,
                            reason=reason,
                        )
                        session.add(blacklist_entry)
                        revoked_count += 1
                
                session.commit()
            except Exception:
                session.rollback()
                raise
        
        return revoked_count
    
    def cleanup_expired(self, before: datetime | None = None) -> int:
        """Remove expired blacklist entries."""
        with self._get_session() as session:
            if before is None:
                before = datetime.now(UTC)
            
            query = delete(TokenBlacklistORM).where(
                TokenBlacklistORM.expires_at < before
            )
            result = session.execute(query)
            session.commit()
            return result.rowcount or 0  # type: ignore[attr-defined]