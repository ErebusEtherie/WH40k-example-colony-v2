"""Repository port for user management.

Defines the interface for user persistence operations. Implementations
should be provided in adapters/persistence/.
"""

from typing import Protocol

from colony_manager.domain.models.user import User


class UserRepository(Protocol):
    """Protocol defining the interface for user repository operations.

    This follows the dependency inversion principle - the domain defines
    what it needs, and adapters provide the implementation.
    """

    def create(self, user: User) -> User:
        """Create a new user.

        Args:
            user: User to create (should have password_hash already set)

        Returns:
            Created user with ID populated

        Raises:
            ValueError: If username or email already exists
        """
        ...

    def get_by_id(self, user_id: int) -> User | None:
        """Get user by ID.

        Args:
            user_id: User ID to retrieve

        Returns:
            User if found, None otherwise
        """
        ...

    def get_by_username(self, username: str) -> User | None:
        """Get user by username.

        Args:
            username: Username to look up

        Returns:
            User if found, None otherwise
        """
        ...

    def get_by_email(self, email: str) -> User | None:
        """Get user by email.

        Args:
            email: Email to look up

        Returns:
            User if found, None otherwise
        """
        ...

    def update(self, user: User) -> User:
        """Update an existing user.

        Args:
            user: User with updated fields (must have id set)

        Returns:
            Updated user

        Raises:
            ValueError: If user not found
        """
        ...

    def delete(self, user_id: int) -> None:
        """Delete a user.

        Args:
            user_id: ID of user to delete

        Raises:
            ValueError: If user not found
        """
        ...

    def list_users(self, limit: int = 100, offset: int = 0) -> tuple[list[User], int]:
        """List users with pagination.

        Args:
            limit: Maximum number of users to return
            offset: Number of users to skip

        Returns:
            Tuple of (list of users, total count)
        """
        ...
