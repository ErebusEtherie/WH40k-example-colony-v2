"""Application service for colony user membership management.

This service orchestrates colony-user membership operations, including adding
members, updating roles, and integration with the audit logging system.
"""

from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.colony_user import ColonyUser, ColonyUserRole
from colony_manager.domain.ports.audit_log_repository import AuditLogRepository
from colony_manager.domain.ports.colony_user_repository import ColonyUserRepository


class ColonyUserService:
    """Service for managing colony-user memberships.
    
    This service handles membership CRUD operations and ensures proper audit logging.
    """
    
    def __init__(
        self,
        membership_repository: ColonyUserRepository,
        audit_log_repository: AuditLogRepository | None = None,
    ) -> None:
        self._membership_repository = membership_repository
        self._audit_log_repository = audit_log_repository
    
    def add_member(
        self,
        colony_id: int,
        user_id: int,
        role: ColonyUserRole,
        invited_by: int | None = None,
    ) -> ColonyUser:
        """Add a user to a colony.
        
        Args:
            colony_id: ID of the colony.
            user_id: ID of the user to add.
            role: Role to assign to the user.
            invited_by: User ID who invited this user (optional).
            
        Returns:
            Created membership.
            
        Raises:
            ValueError: If user is already a member.
        """
        membership = ColonyUser(
            colony_id=colony_id,
            user_id=user_id,
            role=role,
            invited_by=invited_by,
        )
        
        created_membership = self._membership_repository.create(membership)
        
        # Log the creation
        if self._audit_log_repository:
            from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction
            
            if created_membership.id is None:
                raise RuntimeError("Created membership has no ID")
            
            audit_log = AuditLog(
                entity_type="colony_membership",
                entity_id=created_membership.id,
                action=AuditLogAction.CREATE,
                field="role",
                new_value=role.value,
                changed_by=invited_by or user_id,
                colony_id=colony_id,
            )
            self._audit_log_repository.create(audit_log)
        
        return created_membership
    
    def get_membership(self, membership_id: int) -> ColonyUser | None:
        """Get a membership by ID."""
        return self._membership_repository.get_by_id(membership_id)
    
    def get_membership_by_colony_and_user(
        self, colony_id: int, user_id: int
    ) -> ColonyUser | None:
        """Get a user's membership in a specific colony."""
        return self._membership_repository.get_by_colony_and_user(colony_id, user_id)
    
    def get_members_by_colony(self, colony_id: int) -> list[ColonyUser]:
        """Get all members of a colony."""
        return self._membership_repository.get_by_colony(colony_id)
    
    def get_colonies_by_user(self, user_id: int) -> list[ColonyUser]:
        """Get all colonies a user is a member of."""
        return self._membership_repository.get_by_user(user_id)
    
    def update_member_role(
        self,
        membership_id: int,
        new_role: ColonyUserRole,
        changed_by: int,
    ) -> ColonyUser:
        """Update a member's role.
        
        Args:
            membership_id: ID of the membership.
            new_role: New role to assign.
            changed_by: User ID making the change.
            
        Returns:
            Updated membership.
            
        Raises:
            NotFoundError: If membership not found.
        """
        membership = self._membership_repository.get_by_id(membership_id)
        if membership is None:
            raise NotFoundError(f"Membership with ID {membership_id} not found")
        
        old_role = membership.role
        membership.role = new_role
        
        updated_membership = self._membership_repository.update(membership)
        
        # Log the update
        if self._audit_log_repository:
            from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction
            
            audit_log = AuditLog(
                entity_type="colony_membership",
                entity_id=membership_id,
                action=AuditLogAction.UPDATE,
                field="role",
                old_value=old_role.value,
                new_value=new_role.value,
                changed_by=changed_by,
                colony_id=membership.colony_id,
            )
            self._audit_log_repository.create(audit_log)
        
        return updated_membership
    
    def remove_member(self, membership_id: int, changed_by: int | None = None) -> None:
        """Remove a user from a colony.
        
        Args:
            membership_id: ID of the membership to remove.
            changed_by: User ID making the change (optional).
            
        Raises:
            NotFoundError: If membership not found.
        """
        membership = self._membership_repository.get_by_id(membership_id)
        if membership is None:
            raise NotFoundError(f"Membership with ID {membership_id} not found")
        
        colony_id = membership.colony_id
        self._membership_repository.delete(membership_id)
        
        # Log the deletion
        if self._audit_log_repository and changed_by:
            from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction
            
            audit_log = AuditLog(
                entity_type="colony_membership",
                entity_id=membership_id,
                action=AuditLogAction.DELETE,
                changed_by=changed_by,
                colony_id=colony_id,
            )
            self._audit_log_repository.create(audit_log)