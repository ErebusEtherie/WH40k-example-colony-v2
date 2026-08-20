"""Application service for development plan management.

This service orchestrates development plan operations, including creation,
updates, and integration with the audit logging system.
"""

from datetime import datetime

from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.development_plan import DevelopmentPlan, DevelopmentPlanStatus
from colony_manager.domain.ports.audit_log_repository import AuditLogRepository
from colony_manager.domain.ports.development_plan_repository import DevelopmentPlanRepository


class DevelopmentPlanService:
    """Service for managing colony development plans.
    
    Development plans track long-term colony development goals. This service
    handles plan CRUD operations and ensures proper audit logging.
    """
    
    def __init__(
        self,
        plan_repository: DevelopmentPlanRepository,
        audit_log_repository: AuditLogRepository | None = None,
    ) -> None:
        self._plan_repository = plan_repository
        self._audit_log_repository = audit_log_repository
    
    def create_plan(
        self,
        colony_id: int,
        upgrade_type: str,
        target_name: str,
        priority: int,
        description: str,
        acquisition_plan: str,
        created_by: int,
    ) -> DevelopmentPlan:
        """Create a new development plan for a colony.
        
        Args:
            colony_id: ID of the colony.
            upgrade_type: Type of upgrade ("infrastructure" or "support_upgrade").
            target_name: Name of the target infrastructure/upgrade.
            priority: Priority level (1-5).
            description: Detailed description of the plan.
            acquisition_plan: Steps and strategy for acquiring the target.
            created_by: User ID creating the plan.
            
        Returns:
            Created development plan.
        """
        plan = DevelopmentPlan(
            colony_id=colony_id,
            upgrade_type=upgrade_type,
            target_name=target_name,
            priority=priority,
            description=description,
            acquisition_plan=acquisition_plan,
            created_by=created_by,
        )
        
        created_plan = self._plan_repository.create(plan)
        
        # Log the creation
        if self._audit_log_repository:
            from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction
            
            audit_log = AuditLog(
                entity_type="development_plan",
                entity_id=created_plan.id,
                action=AuditLogAction.CREATE,
                changed_by=created_by,
                colony_id=colony_id,
            )
            self._audit_log_repository.create(audit_log)
        
        return created_plan
    
    def get_plan(self, plan_id: int) -> DevelopmentPlan | None:
        """Get a development plan by ID."""
        return self._plan_repository.get_by_id(plan_id)
    
    def get_plans_by_colony(self, colony_id: int) -> list[DevelopmentPlan]:
        """Get all development plans for a colony."""
        return self._plan_repository.get_by_colony(colony_id)
    
    def update_plan(
        self,
        plan_id: int,
        upgrade_type: str | None = None,
        target_name: str | None = None,
        priority: int | None = None,
        description: str | None = None,
        acquisition_plan: str | None = None,
        progress: int | None = None,
        status: DevelopmentPlanStatus | None = None,
        changed_by: int | None = None,
    ) -> DevelopmentPlan:
        """Update an existing development plan."""
        plan = self._plan_repository.get_by_id(plan_id)
        if plan is None:
            raise NotFoundError(f"Development plan with ID {plan_id} not found")
        
        if upgrade_type is not None:
            plan.upgrade_type = upgrade_type
        if target_name is not None:
            plan.target_name = target_name
        if priority is not None:
            plan.priority = priority
        if description is not None:
            plan.description = description
        if acquisition_plan is not None:
            plan.acquisition_plan = acquisition_plan
        if progress is not None:
            plan.progress = progress
        if status is not None:
            plan.status = status
            if status == DevelopmentPlanStatus.COMPLETED and plan.completed_at is None:
                plan.completed_at = datetime.now()
        
        updated_plan = self._plan_repository.update(plan)
        
        # Log the update
        if self._audit_log_repository and changed_by:
            from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction
            
            audit_log = AuditLog(
                entity_type="development_plan",
                entity_id=plan_id,
                action=AuditLogAction.UPDATE,
                changed_by=changed_by,
                colony_id=plan.colony_id,
            )
            self._audit_log_repository.create(audit_log)
        
        return updated_plan
    
    def delete_plan(self, plan_id: int, changed_by: int | None = None) -> None:
        """Delete a development plan."""
        plan = self._plan_repository.get_by_id(plan_id)
        if plan is None:
            raise NotFoundError(f"Development plan with ID {plan_id} not found")
        
        colony_id = plan.colony_id
        self._plan_repository.delete(plan_id)
        
        # Log the deletion
        if self._audit_log_repository and changed_by:
            from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction
            
            audit_log = AuditLog(
                entity_type="development_plan",
                entity_id=plan_id,
                action=AuditLogAction.DELETE,
                changed_by=changed_by,
                colony_id=colony_id,
            )
            self._audit_log_repository.create(audit_log)