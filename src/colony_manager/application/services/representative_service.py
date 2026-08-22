"""Application service for representative use cases."""

from __future__ import annotations

from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.audit_log import AuditLog
from colony_manager.domain.models.representative import Representative
from colony_manager.domain.ports.audit_log_repository import AuditLogRepository
from colony_manager.domain.ports.colony_repository import ColonyRepository
from colony_manager.domain.ports.representative_repository import RepresentativeRepository


class RepresentativeService:
    """Create, update, and manage representatives and their colony assignment.
    
    This service orchestrates representative operations including creation,
    colony assignment, and unassignment. It coordinates between the colony
    and representative repositories to maintain bidirectional consistency.
    """

    def __init__(
        self,
        colony_repository: ColonyRepository,
        representative_repository: RepresentativeRepository,
        audit_log_repository: AuditLogRepository | None = None,
    ) -> None:
        """Initialize the service with repository dependencies.
        
        Args:
            colony_repository: Repository for colony persistence.
            representative_repository: Repository for representative persistence.
            audit_log_repository: Optional repository for audit logging.
        """
        self._colony_repository = colony_repository
        self._representative_repository = representative_repository
        self._audit_log_repository = audit_log_repository

    def _log_audit(
        self,
        colony_id: int | None,
        entity_type: str,
        entity_id: int,
        action: str,
        field: str | None,
        old_value: str | None,
        new_value: str | None,
        changed_by: int,
    ) -> None:
        """Create an audit log entry if audit logging is enabled."""
        if self._audit_log_repository is None:
            return
        
        try:
            audit_log = AuditLog(
                entity_type=entity_type,
                entity_id=entity_id,
                action=action,
                field=field,
                old_value=old_value,
                new_value=new_value,
                changed_by=changed_by,
                colony_id=colony_id,
            )
            self._audit_log_repository.create(audit_log)
        except Exception:
            pass

    def create_representative(
        self, representative: Representative, changed_by: int | None = None
    ) -> Representative:
        """Create a new representative.
        
        Args:
            representative: The representative domain object to create.
            changed_by: Optional user ID who made the change (for audit logging).
            
        Returns:
            The created representative with ID assigned.
        """
        result = self._representative_repository.create(representative)
        
        # Log audit entry
        if self._audit_log_repository is not None and changed_by is not None and result.id is not None:
            self._log_audit(
                colony_id=representative.assigned_to_colony_id,
                entity_type="representative",
                entity_id=result.id,
                action="create",
                field=None,
                old_value=None,
                new_value=result.name,
                changed_by=changed_by,
            )
        
        return result

    def get_representative_by_id(self, representative_id: int) -> Representative:
        """Get a representative by ID.
        
        Args:
            representative_id: ID of the representative.
            
        Returns:
            The representative.
            
        Raises:
            NotFoundError: If representative does not exist.
        """
        representative = self._representative_repository.get(representative_id)
        if representative is None:
            raise NotFoundError(f"Representative {representative_id} not found")
        return representative

    def assign_to_colony(
        self, colony_id: int, representative_id: int, changed_by: int | None = None
    ) -> Representative:
        """Assign a representative to a colony.
        
        Updates both the colony's representative_id and the representative's
        assigned_to_colony_id to maintain bidirectional consistency.
        
        Args:
            colony_id: ID of the colony to assign to.
            representative_id: ID of the representative to assign.
            changed_by: Optional user ID who made the change (for audit logging).
            
        Returns:
            The updated representative.
            
        Raises:
            NotFoundError: If colony or representative does not exist.
        """
        colony = self._colony_repository.get(colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {colony_id} not found")
        representative = self._representative_repository.get(representative_id)
        if representative is None:
            raise NotFoundError(f"Representative {representative_id} not found")
        
        old_colony_id = representative.assigned_to_colony_id
        colony.representative_id = representative_id
        self._colony_repository.update(colony)
        representative.assigned_to_colony_id = colony_id
        result = self._representative_repository.update(representative)
        
        # Log audit entry
        if self._audit_log_repository is not None and changed_by is not None:
            self._log_audit(
                colony_id=colony_id,
                entity_type="representative",
                entity_id=representative_id,
                action="assign",
                field="assigned_to_colony_id",
                old_value=str(old_colony_id) if old_colony_id else None,
                new_value=str(colony_id),
                changed_by=changed_by,
            )
        
        return result

    def unassign_from_colony(
        self, representative_id: int, changed_by: int | None = None
    ) -> Representative:
        """Unassign a representative from their colony.
        
        Clears the representative's assigned_to_colony_id and updates the
        colony's representative_id to None.
        
        Args:
            representative_id: ID of the representative to unassign.
            changed_by: Optional user ID who made the change (for audit logging).
            
        Returns:
            The updated representative.
            
        Raises:
            NotFoundError: If representative does not exist.
        """
        representative = self._representative_repository.get(representative_id)
        if representative is None:
            raise NotFoundError(f"Representative {representative_id} not found")
        
        old_colony_id = representative.assigned_to_colony_id
        if representative.assigned_to_colony_id is not None:
            colony = self._colony_repository.get(representative.assigned_to_colony_id)
            if colony is not None:
                colony.representative_id = None
                self._colony_repository.update(colony)
        representative.assigned_to_colony_id = None
        result = self._representative_repository.update(representative)
        
        # Log audit entry
        if self._audit_log_repository is not None and changed_by is not None and old_colony_id is not None:
            self._log_audit(
                colony_id=old_colony_id,
                entity_type="representative",
                entity_id=representative_id,
                action="unassign",
                field="assigned_to_colony_id",
                old_value=str(old_colony_id),
                new_value=None,
                changed_by=changed_by,
            )
        
        return result
