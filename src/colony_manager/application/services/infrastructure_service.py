"""Infrastructure service for managing colony infrastructure."""

from colony_manager.domain.enums import InfrastructureState
from colony_manager.domain.models.audit_log import AuditLogAction
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.audit_log import AuditLog
from colony_manager.domain.models.infrastructure import Infrastructure
from colony_manager.domain.ports.audit_log_repository import AuditLogRepository
from colony_manager.domain.ports.colony_repository import ColonyRepository
from colony_manager.domain.ports.infrastructure_repository import InfrastructureRepository


class InfrastructureService:
    """Service layer for infrastructure management."""

    def __init__(
        self,
        repository: InfrastructureRepository,
        colony_repository: ColonyRepository,
        audit_log_repository: AuditLogRepository | None = None,
    ) -> None:
        self._repository = repository
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
                action=AuditLogAction(action),
                field=field,
                old_value=old_value,
                new_value=new_value,
                changed_by=changed_by,
                colony_id=colony_id,
            )
            self._audit_log_repository.create(audit_log)
        except Exception:
            pass

    def create_infrastructure(
        self, infrastructure: Infrastructure, changed_by: int | None = None
    ) -> Infrastructure:
        """Create new infrastructure for a colony.
        
        Args:
            infrastructure: The infrastructure domain object to create.
            changed_by: Optional user ID who made the change (for audit logging).
            
        Returns:
            The created infrastructure with ID assigned.
        """
        # Verify colony exists
        colony = self._colony_repository.get(infrastructure.colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {infrastructure.colony_id} not found")
        result = self._repository.create(infrastructure)
        
        # Log audit entry
        if self._audit_log_repository is not None and changed_by is not None and result.id is not None:
            self._log_audit(
                colony_id=infrastructure.colony_id,
                entity_type="infrastructure",
                entity_id=result.id,
                action="create",
                field=None,
                old_value=None,
                new_value=result.infrastructure_type.value,
                changed_by=changed_by,
            )
        
        return result

    def get_infrastructure(self, infrastructure_id: int) -> Infrastructure:
        """Get infrastructure by ID."""
        infra = self._repository.get(infrastructure_id)
        if infra is None:
            raise NotFoundError(f"Infrastructure {infrastructure_id} not found")
        return infra

    def update_infrastructure_state(
        self,
        infrastructure_id: int,
        state: InfrastructureState,
        changed_by: int | None = None,
    ) -> Infrastructure:
        """Update infrastructure state.
        
        Args:
            infrastructure_id: ID of the infrastructure to update.
            state: New state for the infrastructure.
            changed_by: Optional user ID who made the change (for audit logging).
            
        Returns:
            The updated infrastructure.
        """
        infra = self.get_infrastructure(infrastructure_id)
        old_state = infra.state
        infra.state = state
        result = self._repository.update(infra)
        
        # Log audit entry
        if self._audit_log_repository is not None and changed_by is not None and result.id is not None:
            self._log_audit(
                colony_id=infra.colony_id,
                entity_type="infrastructure",
                entity_id=result.id,
                action="update",
                field="state",
                old_value=old_state.value,
                new_value=state.value,
                changed_by=changed_by,
            )
        
        return result

    def delete_infrastructure(
        self, infrastructure_id: int, changed_by: int | None = None
    ) -> None:
        """Delete infrastructure.
        
        Args:
            infrastructure_id: ID of the infrastructure to delete.
            changed_by: Optional user ID who made the change (for audit logging).
        """
        infra = self._repository.get(infrastructure_id)
        if infra is not None:
            colony_id = infra.colony_id
            infra_type = infra.infrastructure_type.value
            self._repository.delete(infrastructure_id)
            
            # Log audit entry
            if self._audit_log_repository is not None and changed_by is not None:
                self._log_audit(
                    colony_id=colony_id,
                    entity_type="infrastructure",
                    entity_id=infrastructure_id,
                    action="delete",
                    field=None,
                    old_value=infra_type,
                    new_value=None,
                    changed_by=changed_by,
                )
        else:
            # Silently ignore delete of non-existent infrastructure (idempotent)
            self._repository.delete(infrastructure_id)

    def list_by_colony(self, colony_id: int) -> list[Infrastructure]:
        """List all infrastructure for a colony."""
        return self._repository.list_by_colony(colony_id)
    
    def colony_exists(self, colony_id: int) -> bool:
        """Check if a colony exists."""
        return self._colony_repository.get(colony_id) is not None