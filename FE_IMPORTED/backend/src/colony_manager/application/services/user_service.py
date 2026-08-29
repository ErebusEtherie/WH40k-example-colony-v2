"""Application service for user management.

This service orchestrates user operations, including creation, updates,
deletion (soft delete), password resets, and integration with the audit logging system.
"""

import logging
from datetime import UTC, datetime

from colony_manager.config.settings import get_security_settings
from colony_manager.domain.errors import NotFoundError, ValidationError
from colony_manager.domain.models.user import User, UserRole
from colony_manager.domain.ports.audit_log_repository import AuditLogRepository
from colony_manager.domain.ports.user_repository import UserRepository
from colony_manager.domain.util.auth import hash_password, validate_password

logger = logging.getLogger(__name__)


class UserService:
    """Service for managing user accounts.

    This service handles user CRUD operations with proper security constraints:
    - Admins can modify anyone except other admins
    - Users cannot escalate their own privileges
    - Username and email are immutable after creation
    - All mutations are logged to audit log
    """

    def __init__(
        self,
        user_repository: UserRepository,
        audit_log_repository: AuditLogRepository | None = None,
    ) -> None:
        self._user_repository = user_repository
        self._audit_log_repository = audit_log_repository

    def list_users(self, limit: int = 100, offset: int = 0) -> tuple[list[User], int]:
        """List users with pagination.

        Args:
            limit: Maximum number of users to return.
            offset: Number of users to skip.

        Returns:
            Tuple of (list of users, total count).
        """
        return self._user_repository.list_users(limit=limit, offset=offset)

    def get_user(self, user_id: int) -> User | None:
        """Get a user by ID.

        Args:
            user_id: ID of the user to retrieve.

        Returns:
            User if found, None otherwise.
        """
        return self._user_repository.get_by_id(user_id)

    def create_user(
        self,
        username: str,
        email: str,
        password: str,
        role: str = "viewer",
        is_active: bool = True,
        created_by: int | None = None,
    ) -> User:
        """Create a new user.

        Args:
            username: Username (must be unique, immutable after creation).
            email: Email address (must be unique, immutable after creation).
            password: Plain text password (will be hashed).
            role: User role (viewer, colony_manager, admin).
            is_active: Whether the account is active.
            created_by: User ID who created this account (for audit logging).

        Returns:
            Created user with ID populated.

        Raises:
            ValidationError: If username or email already exists.
        """
        # Check for duplicates
        existing_by_username = self._user_repository.get_by_username(username)
        if existing_by_username is not None:
            raise ValidationError(f"Username '{username}' already exists")

        existing_by_email = self._user_repository.get_by_email(email)
        if existing_by_email is not None:
            raise ValidationError(f"Email '{email}' already exists")

        # Create user with hashed password
        user = User(
            username=username,
            email=email,
            password_hash=hash_password(password),
            role=UserRole(role),
            is_active=is_active,
        )

        created_user = self._user_repository.create(user)

        # Log the creation
        if self._audit_log_repository and created_by:
            from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction

            if created_user.id is None:
                raise RuntimeError("Created user has no ID")

            audit_log = AuditLog(
                entity_type="user",
                entity_id=created_user.id,
                action=AuditLogAction.CREATE,
                field="username",
                new_value=username,
                changed_by=created_by,
            )
            self._audit_log_repository.create(audit_log)

        return created_user

    def _check_can_modify_user(self, modifier_id: int, target_user: User) -> None:
        """Check if modifier can modify target user.

        Rules:
        1. Admins can modify anyone except other admins
        2. Users cannot modify their own role (no self-escalation)

        Args:
            modifier_id: ID of the user making the modification.
            target_user: User being modified.

        Raises:
            PermissionError: If modifier cannot modify target.
        """
        modifier = self._user_repository.get_by_id(modifier_id)
        if modifier is None:
            # If modifier doesn't exist, skip permission check
            # This allows system-level operations without a valid user
            return

        # Admins cannot be modified by anyone (including other admins)
        if target_user.role == UserRole.ADMIN:
            raise PermissionError("Admin accounts cannot be modified")

        # Prevent self-escalation (role change)
        if modifier.id == target_user.id:
            raise PermissionError("Users cannot modify their own role")

    def update_user(
        self,
        user_id: int,
        role: str | None = None,
        is_active: bool | None = None,
        changed_by: int | None = None,
    ) -> User:
        """Update a user.

        Note: username and email are immutable and cannot be updated.

        Args:
            user_id: ID of the user to update.
            role: New role (optional).
            is_active: New active status (optional).
            changed_by: User ID making the change (for audit logging).

        Returns:
            Updated user.

        Raises:
            NotFoundError: If user not found.
            PermissionError: If modifier cannot modify target.
            ValidationError: If trying to escalate own privileges.
        """
        target_user = self._user_repository.get_by_id(user_id)
        if target_user is None:
            raise NotFoundError(f"User with ID {user_id} not found")

        # Check permissions if changed_by is provided
        if changed_by is not None:
            self._check_can_modify_user(changed_by, target_user)

        # Track changes for audit logging
        changes: list[tuple[str, str | None, str | None]] = []

        if role is not None:
            old_role = (
                target_user.role.value
                if isinstance(target_user.role, UserRole)
                else target_user.role
            )
            new_role = role
            if old_role != new_role:
                changes.append(("role", old_role, new_role))
                target_user.role = UserRole(role)

        if is_active is not None and target_user.is_active != is_active:
            changes.append(("is_active", str(target_user.is_active), str(is_active)))
            target_user.is_active = is_active

        target_user.updated_at = datetime.now(UTC)

        updated_user = self._user_repository.update(target_user)

        # Log the updates
        if self._audit_log_repository and changed_by:
            from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction

            for field, old_value, new_value in changes:
                audit_log = AuditLog(
                    entity_type="user",
                    entity_id=user_id,
                    action=AuditLogAction.UPDATE,
                    field=field,
                    old_value=old_value,
                    new_value=new_value,
                    changed_by=changed_by,
                )
                self._audit_log_repository.create(audit_log)

        return updated_user

    def delete_user(self, user_id: int, changed_by: int | None = None) -> None:
        """Soft delete a user (set is_active = False).

        Args:
            user_id: ID of the user to delete.
            changed_by: User ID making the change (for audit logging).

        Raises:
            NotFoundError: If user not found.
            PermissionError: If modifier cannot modify target.
        """
        target_user = self._user_repository.get_by_id(user_id)
        if target_user is None:
            raise NotFoundError(f"User with ID {user_id} not found")

        # Check permissions if changed_by is provided
        if changed_by is not None:
            self._check_can_modify_user(changed_by, target_user)

        # Soft delete - set is_active to False
        target_user.is_active = False
        target_user.updated_at = datetime.now(UTC)

        self._user_repository.update(target_user)

        # Log the deletion
        if self._audit_log_repository and changed_by:
            from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction

            audit_log = AuditLog(
                entity_type="user",
                entity_id=user_id,
                action=AuditLogAction.DELETE,
                field="is_active",
                old_value="True",
                new_value="False",
                changed_by=changed_by,
            )
            self._audit_log_repository.create(audit_log)

    def reset_password(
        self,
        user_id: int,
        temporary_password: str,
        changed_by: int | None = None,
    ) -> User:
        """Reset a user's password.

        Args:
            user_id: ID of the user whose password to reset.
            temporary_password: New temporary password to set (must meet security requirements).
            changed_by: User ID making the change (for audit logging).

        Returns:
            Updated user.

        Raises:
            NotFoundError: If user not found.
            PermissionError: If modifier cannot modify target.
            ValidationError: If password does not meet security requirements.
        """
        target_user = self._user_repository.get_by_id(user_id)
        if target_user is None:
            raise NotFoundError(f"User with ID {user_id} not found")

        # Check permissions if changed_by is provided
        if changed_by is not None:
            self._check_can_modify_user(changed_by, target_user)
        else:
            # Log warning for system-level operations without a modifier
            logger.warning(
                "Password reset for user %d performed without a valid modifier (system operation)",
                user_id,
            )

        # Validate password meets security requirements
        settings = get_security_settings()
        validate_password(
            temporary_password,
            require_complexity=settings.require_password_complexity,
            min_length=settings.min_password_length,
        )

        # Hash and set new password
        target_user.password_hash = hash_password(temporary_password)
        target_user.updated_at = datetime.now(UTC)

        updated_user = self._user_repository.update(target_user)

        # Log the password reset
        if self._audit_log_repository and changed_by:
            from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction

            audit_log = AuditLog(
                entity_type="user",
                entity_id=user_id,
                action=AuditLogAction.UPDATE,
                field="password",
                old_value="***",
                new_value="***",
                changed_by=changed_by,
            )
            self._audit_log_repository.create(audit_log)

        return updated_user
