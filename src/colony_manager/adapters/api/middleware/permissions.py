"""Permission middleware for colony-level access control.

This module provides FastAPI dependencies for checking colony-specific permissions
based on user membership and role within each colony context.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status

from colony_manager.adapters.api.dependencies import get_colony_user_repository
from colony_manager.adapters.api.middleware.auth import get_current_user
from colony_manager.domain.models.colony_user import ColonyUserRole
from colony_manager.domain.models.user import User
from colony_manager.domain.ports.colony_user_repository import ColonyUserRepository


# Role hierarchy for colony permissions
COLONY_ROLE_HIERARCHY = {
    ColonyUserRole.VIEWER: 0,
    ColonyUserRole.EDITOR: 1,
    ColonyUserRole.OWNER: 2,
}

# Permission definitions - which roles have which permissions
COLONY_PERMISSIONS = {
    "view": {ColonyUserRole.VIEWER, ColonyUserRole.EDITOR, ColonyUserRole.OWNER},
    "edit": {ColonyUserRole.EDITOR, ColonyUserRole.OWNER},
    "admin": {ColonyUserRole.OWNER},
}


def get_colony_membership(
    current_user: Annotated[User, Depends(get_current_user)],
    colony_user_repository: Annotated[ColonyUserRepository, Depends(get_colony_user_repository)],
) -> ColonyUserRepository:
    """Get the colony user repository for dependency injection.
    
    This is a helper to make the repository available in other dependencies.
    """
    return colony_user_repository


def require_colony_role(colony_id: int, required_role: ColonyUserRole) -> object:
    """Create a dependency that requires a specific colony role.
    
    Args:
        colony_id: ID of the colony to check membership for.
        required_role: Minimum colony role required.
        
    Returns:
        A dependency function that checks colony membership and role.
        
    Raises:
        HTTPException: 403 if user lacks required role, 404 if not a member.
    """
    def check_colony_role(
        current_user: Annotated[User, Depends(get_current_user)],
        colony_user_repository: Annotated[ColonyUserRepository, Depends(get_colony_user_repository)],
    ) -> User:
        """Check if user has required role in the colony."""
        if current_user.id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authenticated user has no ID",
            )
        
        membership = colony_user_repository.get_by_colony_and_user(colony_id, current_user.id)
        
        if membership is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User is not a member of colony {colony_id}",
            )
        
        member_role = membership.role
        required_level = COLONY_ROLE_HIERARCHY.get(required_role, 0)
        member_level = COLONY_ROLE_HIERARCHY.get(member_role, 0)
        
        if member_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient colony permissions. Required role: {required_role.value}",
            )
        
        return current_user
    
    return check_colony_role


def require_colony_permission(colony_id: int, permission: str) -> object:
    """Create a dependency that requires a specific colony permission.
    
    Args:
        colony_id: ID of the colony to check membership for.
        permission: Permission name ("view", "edit", "admin").
        
    Returns:
        A dependency function that checks colony membership and permission.
        
    Raises:
        HTTPException: 403 if user lacks permission, 404 if not a member.
    """
    def check_permission(
        current_user: Annotated[User, Depends(get_current_user)],
        colony_user_repository: Annotated[ColonyUserRepository, Depends(get_colony_user_repository)],
    ) -> User:
        """Check if user has required permission in the colony."""
        # Check for admin bypass
        user_role = current_user.role.value if hasattr(current_user.role, "value") else current_user.role
        if user_role == "admin":
            return current_user
        
        if current_user.id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authenticated user has no ID",
            )
        
        membership = colony_user_repository.get_by_colony_and_user(colony_id, current_user.id)
        
        if membership is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User is not a member of colony {colony_id}",
            )
        
        allowed_roles = COLONY_PERMISSIONS.get(permission, set())
        
        if membership.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient colony permissions. Required permission: {permission}",
            )
        
        return current_user
    
    return check_permission