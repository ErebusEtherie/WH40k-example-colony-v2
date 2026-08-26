"""Repository port for login attempt tracking.

Defines the interface for login attempt persistence operations. Implementations
should be provided in adapters/persistence/.
"""

from datetime import datetime
from typing import Protocol

from colony_manager.domain.models.login_attempt import LoginAttempt


class LoginAttemptRepository(Protocol):
    """Protocol defining the interface for login attempt repository operations.

    This follows the dependency inversion principle - the domain defines
    what it needs, and adapters provide the implementation.
    """

    def create(self, attempt: LoginAttempt) -> LoginAttempt:
        """Record a login attempt.

        Args:
            attempt: Login attempt entry to create.

        Returns:
            Created entry with ID populated.
        """
        ...

    def count_failed_attempts(
        self,
        username: str,
        since: datetime,
        ip_address: str | None = None,
    ) -> int:
        """Count failed login attempts for a username since a given time.

        Args:
            username: Username to check.
            since: Count attempts after this datetime.
            ip_address: Optional IP address to filter by (for per-IP tracking).

        Returns:
            Number of failed attempts.
        """
        ...

    def cleanup_old_attempts(self, before: datetime) -> int:
        """Remove old login attempt records.

        Args:
            before: Remove attempts before this datetime.

        Returns:
            Number of records removed.
        """
        ...
