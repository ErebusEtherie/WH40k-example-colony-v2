"""Support Upgrade service for managing colony support upgrades."""

from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction
from colony_manager.domain.models.support_upgrade import SupportUpgrade
from colony_manager.domain.ports.audit_log_repository import AuditLogRepository
from colony_manager.domain.ports.colony_repository import ColonyRepository
from colony_manager.domain.ports.support_upgrade_repository import SupportUpgradeRepository


class SupportUpgradeService:
    """Service layer for support upgrade management."""

    def __init__(
        self,
        repository: SupportUpgradeRepository,
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

    def create_upgrade(
        self, upgrade: SupportUpgrade, changed_by: int | None = None
    ) -> SupportUpgrade:
        """Create new support upgrade for a colony.
        
        Args:
            upgrade: The support upgrade domain object to create.
            changed_by: Optional user ID who made the change (for audit logging).
            
        Returns:
            The created support upgrade with ID assigned.
        """
        # Verify colony exists
        colony = self._colony_repository.get(upgrade.colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {upgrade.colony_id} not found")
        result = self._repository.create(upgrade)
        
        # Log audit entry
        if self._audit_log_repository is not None and changed_by is not None and result.id is not None:
            self._log_audit(
                colony_id=upgrade.colony_id,
                entity_type="support_upgrade",
                entity_id=result.id,
                action=AuditLogAction.CREATE,
                field=None,
                old_value=None,
                new_value=result.upgrade_type.value,
                changed_by=changed_by,
            )
        
        return result

    def get_upgrade(self, upgrade_id: int) -> SupportUpgrade:
        """Get support upgrade by ID."""
        upgrade = self._repository.get(upgrade_id)
        if upgrade is None:
            raise NotFoundError(f"SupportUpgrade {upgrade_id} not found")
        return upgrade

    def update_upgrade(
        self, upgrade: SupportUpgrade, changed_by: int | None = None
    ) -> SupportUpgrade:
        """Update support upgrade.
        
        Args:
            upgrade: The support upgrade with updated values.
            changed_by: Optional user ID who made the change (for audit logging).
            
        Returns:
            The updated support upgrade.
        """
        # Verify upgrade exists
        self.get_upgrade(upgrade.id)
        
        result = self._repository.update(upgrade)
        
        # Log audit entry for update
        if self._audit_log_repository is not None and changed_by is not None and result.id is not None:
            self._log_audit(
                colony_id=upgrade.colony_id,
                entity_type="support_upgrade",
                entity_id=result.id,
                action=AuditLogAction.UPDATE,
                field=None,
                old_value=None,
                new_value=f"Updated {result.upgrade_type.value}",
                changed_by=changed_by,
            )
        
        return result

    def delete_upgrade(
        self, upgrade_id: int, changed_by: int | None = None
    ) -> None:
        """Delete support upgrade.
        
        Args:
            upgrade_id: ID of the support upgrade to delete.
            changed_by: Optional user ID who made the change (for audit logging).
        """
        upgrade = self._repository.get(upgrade_id)
        if upgrade is not None:
            colony_id = upgrade.colony_id
            upgrade_type = upgrade.upgrade_type.value
            self._repository.delete(upgrade_id)
            
            # Log audit entry
            if self._audit_log_repository is not None and changed_by is not None:
                self._log_audit(
                    colony_id=colony_id,
                    entity_type="support_upgrade",
                    entity_id=upgrade_id,
                    action=AuditLogAction.DELETE,
                    field=None,
                    old_value=upgrade_type,
                    new_value=None,
                    changed_by=changed_by,
                )
        else:
            # Silently ignore delete of non-existent upgrade (idempotent)
            self._repository.delete(upgrade_id)

    def list_by_colony(self, colony_id: int) -> list[SupportUpgrade]:
        """List all support upgrades for a colony."""
        return self._repository.list_by_colony(colony_id)
    
    def colony_exists(self, colony_id: int) -> bool:
        """Check if a colony exists."""
        return self._colony_repository.get(colony_id) is not None