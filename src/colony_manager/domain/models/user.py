"""Domain model for user authentication."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class UserRole(str, Enum):
    """User role enumeration for authorization."""

    ADMIN = "admin"
    COLONY_MANAGER = "colony_manager"
    VIEWER = "viewer"


class User(BaseModel):
    """User domain model for authentication and authorization.

    This model represents a user account in the system. Passwords should
    never be stored in plain text - always use hashed passwords.
    """

    id: int | None = None
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=5, max_length=100)
    password_hash: str = Field(min_length=1)  # Never store plain text passwords
    role: UserRole = UserRole.VIEWER
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None

    # Note: Colony membership is managed via ColonyUser model, not this field.
    # The managed_colony_id field was removed in favor of proper many-to-many
    # relationships through the ColonyUser model with role-based access control.

    model_config = {"use_enum_values": False}
