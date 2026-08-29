"""SQLAlchemy implementation of UserRepository."""

from datetime import UTC, datetime

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from colony_manager.adapters.persistence.mappers import domain_to_orm_user, orm_to_domain_user
from colony_manager.adapters.persistence.orm_models import UserORM
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.user import User
from colony_manager.domain.ports.user_repository import UserRepository


class SqlAlchemyUserRepository(UserRepository):
    """SQLAlchemy implementation of UserRepository.

    This implementation uses SQLAlchemy for database operations and follows
    the repository pattern defined in the domain layer.
    """

    def __init__(self, database_url: str = "sqlite:///:memory:") -> None:
        self._engine = create_engine(database_url)
        self._session_factory = sessionmaker(bind=self._engine, autoflush=False, autocommit=False)

    def _get_session(self) -> Session:
        """Get a database session."""
        return self._session_factory()

    def create(self, user: User) -> User:
        """Create a new user in the database."""
        with self._get_session() as session:
            # Check for existing username
            existing = session.execute(
                select(UserORM).where(UserORM.username == user.username)
            ).scalar_one_or_none()

            if existing:
                raise ValueError(f"Username '{user.username}' already exists")

            # Check for existing email
            existing = session.execute(
                select(UserORM).where(UserORM.email == user.email)
            ).scalar_one_or_none()

            if existing:
                raise ValueError(f"Email '{user.email}' already exists")

            # Set timestamps
            now = datetime.now(UTC).date()
            orm_user = domain_to_orm_user(user)
            orm_user.created_at = now
            orm_user.updated_at = now

            session.add(orm_user)
            session.commit()
            session.refresh(orm_user)

            return orm_to_domain_user(orm_user)

    def get_by_id(self, user_id: int) -> User | None:
        """Get user by ID."""
        with self._get_session() as session:
            orm_user = session.get(UserORM, user_id)
            if orm_user is None:
                return None
            return orm_to_domain_user(orm_user)

    def get_by_username(self, username: str) -> User | None:
        """Get user by username."""
        with self._get_session() as session:
            orm_user = session.execute(
                select(UserORM).where(UserORM.username == username)
            ).scalar_one_or_none()

            if orm_user is None:
                return None
            return orm_to_domain_user(orm_user)

    def get_by_email(self, email: str) -> User | None:
        """Get user by email."""
        with self._get_session() as session:
            orm_user = session.execute(
                select(UserORM).where(UserORM.email == email)
            ).scalar_one_or_none()

            if orm_user is None:
                return None
            return orm_to_domain_user(orm_user)

    def update(self, user: User) -> User:
        """Update an existing user."""
        if user.id is None:
            raise NotFoundError("User ID is required for update")

        with self._get_session() as session:
            orm_user = session.get(UserORM, user.id)

            if orm_user is None:
                raise NotFoundError(f"User with ID {user.id} not found")

            # Check if username is taken by another user
            if orm_user.username != user.username:
                existing = session.execute(
                    select(UserORM).where(UserORM.username == user.username)
                ).scalar_one_or_none()

                if existing:
                    raise ValueError(f"Username '{user.username}' already exists")

            # Check if email is taken by another user
            if orm_user.email != user.email:
                existing = session.execute(
                    select(UserORM).where(UserORM.email == user.email)
                ).scalar_one_or_none()

                if existing:
                    raise ValueError(f"Email '{user.email}' already exists")

            # Update fields
            orm_user.username = user.username
            orm_user.email = user.email
            orm_user.password_hash = user.password_hash
            orm_user.role = user.role.value if hasattr(user.role, "value") else user.role
            orm_user.is_active = user.is_active
            orm_user.updated_at = datetime.now(UTC).date()

            session.commit()
            session.refresh(orm_user)

            return orm_to_domain_user(orm_user)

    def delete(self, user_id: int) -> None:
        """Delete a user."""
        with self._get_session() as session:
            orm_user = session.get(UserORM, user_id)

            if orm_user is None:
                raise NotFoundError(f"User with ID {user_id} not found")

            session.delete(orm_user)
            session.commit()

    def list_users(self, limit: int = 100, offset: int = 0) -> tuple[list[User], int]:
        """List users with pagination."""
        with self._get_session() as session:
            # Get total count
            from sqlalchemy import func

            total = session.execute(select(func.count(UserORM.id))).scalar() or 0

            # Get paginated results
            result = session.execute(select(UserORM).offset(offset).limit(limit))
            orm_users = result.scalars().all()
            return [orm_to_domain_user(orm) for orm in orm_users], total
