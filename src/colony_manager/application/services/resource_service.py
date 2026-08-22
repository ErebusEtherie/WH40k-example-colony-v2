"""Application service for planetary resource management."""

from __future__ import annotations

from datetime import date

from colony_manager.domain.enums import ResourceType
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.audit_log import AuditLog
from colony_manager.domain.models.resource import ColonyResource
from colony_manager.domain.ports.audit_log_repository import AuditLogRepository
from colony_manager.domain.ports.colony_repository import ColonyRepository
from colony_manager.domain.ports.resource_repository import ResourceRepository


class ResourceService:
    """Manage planetary resources for colonies."""

    def __init__(
        self,
        resource_repository: ResourceRepository,
        colony_repository: ColonyRepository,
        audit_log_repository: AuditLogRepository | None = None,
    ) -> None:
        self._resource_repository = resource_repository
        self._colony_repository = colony_repository
        self._audit_log_repository = audit_log_repository

    def _log_audit(
        self,
        colony_id: int,
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

    def add_resource(
        self,
        colony_id: int,
        resource_type: str,
        name: str,
        abundance: int,
        notes: str = "",
        discovered_date: date | None = None,
        changed_by: int | None = None,
    ) -> ColonyResource:
        """Add a new planetary resource to a colony.
        
        Args:
            colony_id: ID of the colony.
            resource_type: Type of resource (e.g., "mineral", "agricultural").
            name: Name of the resource.
            abundance: Abundance level.
            notes: Optional notes about the resource.
            discovered_date: Date of discovery (defaults to today).
            changed_by: Optional user ID who made the change (for audit logging).
            
        Returns:
            The created resource.
        """
        # Verify colony exists
        colony = self._colony_repository.get(colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {colony_id} not found")

        resource = ColonyResource(
            colony_id=colony_id,
            resource_type=ResourceType(resource_type),
            name=name,
            abundance=abundance,
            notes=notes,
            discovered_date=discovered_date or date.today(),
        )
        result = self._resource_repository.create(resource)
        
        # Log audit entry
        if self._audit_log_repository is not None and changed_by is not None and result.id is not None:
            self._log_audit(
                colony_id=colony_id,
                entity_type="resource",
                entity_id=result.id,
                action="create",
                field=None,
                old_value=None,
                new_value=result.name,
                changed_by=changed_by,
            )
        
        return result

    def get_resource(self, resource_id: int) -> ColonyResource:
        """Get a specific resource by ID."""
        return self._resource_repository.get(resource_id)

    def list_resources(self, colony_id: int) -> list[ColonyResource]:
        """List all resources for a colony."""
        return self._resource_repository.get_by_colony(colony_id)

    def update_resource(
        self,
        resource_id: int,
        abundance: int | None = None,
        notes: str | None = None,
        changed_by: int | None = None,
    ) -> ColonyResource:
        """Update a resource's abundance or notes.
        
        Args:
            resource_id: ID of the resource to update.
            abundance: New abundance value (optional).
            notes: New notes value (optional).
            changed_by: Optional user ID who made the change (for audit logging).
            
        Returns:
            The updated resource.
        """
        resource = self._resource_repository.get(resource_id)
        
        changes = []
        if abundance is not None:
            changes.append(("abundance", str(resource.abundance), str(abundance)))
            resource.abundance = abundance
        if notes is not None:
            changes.append(("notes", resource.notes, notes))
            resource.notes = notes
        
        result = self._resource_repository.update(resource)
        
        # Log audit entries for each change
        if self._audit_log_repository is not None and changed_by is not None and result.id is not None:
            for field, old_val, new_val in changes:
                self._log_audit(
                    colony_id=resource.colony_id,
                    entity_type="resource",
                    entity_id=result.id,
                    action="update",
                    field=field,
                    old_value=old_val,
                    new_value=new_val,
                    changed_by=changed_by,
                )
        
        return result

    def remove_resource(
        self, resource_id: int, changed_by: int | None = None
    ) -> None:
        """Remove a resource from a colony.
        
        Args:
            resource_id: ID of the resource to remove.
            changed_by: Optional user ID who made the change (for audit logging).
        """
        resource = self._resource_repository.get(resource_id)
        colony_id = resource.colony_id if resource else None
        resource_name = resource.name if resource else None
        self._resource_repository.delete(resource_id)
        
        # Log audit entry
        if self._audit_log_repository is not None and changed_by is not None and colony_id is not None:
            self._log_audit(
                colony_id=colony_id,
                entity_type="resource",
                entity_id=resource_id,
                action="delete",
                field=None,
                old_value=resource_name,
                new_value=None,
                changed_by=changed_by,
            )
    
    def colony_exists(self, colony_id: int) -> bool:
        """Check if a colony exists."""
        return self._colony_repository.get(colony_id) is not None