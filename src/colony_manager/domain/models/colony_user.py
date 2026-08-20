"""Domain model for colony user membership.

ColonyUser represents the many-to-many relationship between users and colonies,
with role-based access control for collaborative colony management.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class ColonyUserRole(str, Enum):
    """Role enumeration for colony membership.
    
    Roles determine what actions a user can perform within a colony context.
    """
    
    OWNER = "owner"  # Full control, can manage members
    EDITOR = "editor"  # Can edit colony data
    VIEWER = "viewer"  # Read-only access


class ColonyUser(BaseModel):
    """Domain model for colony-user membership.
    
    This model represents the relationship between a user and a colony,
    including their role and permissions within that colony context.
    
    Attributes:
        id: Database ID (None if not yet persisted).
        colony_id: ID of the colony.
        user_id: ID of the user.
        role: User's role within this colony (owner, editor, viewer).
        joined_at: Timestamp when the user joined the colony.
        invited_by: User ID who invited this user (None if self-joined or system-created).
    """
    
    id: int | None = None
    colony_id: int
    user_id: int
    role: ColonyUserRole = ColonyUserRole.VIEWER
    joined_at: datetime | None = None
    invited_by: int | None = None