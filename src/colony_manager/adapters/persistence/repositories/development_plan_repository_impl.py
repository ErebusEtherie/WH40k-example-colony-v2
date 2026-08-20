"""SQLAlchemy implementation of DevelopmentPlanRepository."""

from datetime import UTC, datetime

from sqlalchemy import select

from colony_manager.adapters.persistence.mappers import domain_to_orm_development_plan, orm_to_domain_development_plan
from colony_manager.adapters.persistence.orm_models import DevelopmentPlanORM
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.development_plan import DevelopmentPlan
from colony_manager.domain.ports.development_plan_repository import DevelopmentPlanRepository


class SqlAlchemyDevelopmentPlanRepository(DevelopmentPlanRepository):
    """SQLAlchemy implementation of DevelopmentPlanRepository.
    
    This implementation uses SQLAlchemy for database operations and follows
    the repository pattern defined in the domain layer.
    """
    
    def __init__(self, database_url: str = "sqlite:///:memory:") -> None:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        self._engine = create_engine(database_url)
        self._session_factory = sessionmaker(bind=self._engine, autoflush=False, autocommit=False)
    
    def _get_session(self):
        """Get a database session."""
        return self._session_factory()
    
    def create(self, plan: DevelopmentPlan) -> DevelopmentPlan:
        """Create a new development plan in the database."""
        with self._get_session() as session:
            orm_plan = domain_to_orm_development_plan(plan)
            orm_plan.created_at = datetime.now(UTC)
            
            session.add(orm_plan)
            session.commit()
            session.refresh(orm_plan)
            
            return orm_to_domain_development_plan(orm_plan)
    
    def get_by_id(self, plan_id: int) -> DevelopmentPlan | None:
        """Get development plan by ID."""
        with self._get_session() as session:
            orm_plan = session.get(DevelopmentPlanORM, plan_id)
            if orm_plan is None:
                return None
            return orm_to_domain_development_plan(orm_plan)
    
    def get_by_colony(self, colony_id: int) -> list[DevelopmentPlan]:
        """Get all development plans for a colony."""
        with self._get_session() as session:
            result = session.execute(
                select(DevelopmentPlanORM).where(DevelopmentPlanORM.colony_id == colony_id)
            )
            orm_plans = result.scalars().all()
            return [orm_to_domain_development_plan(orm) for orm in orm_plans]
    
    def update(self, plan: DevelopmentPlan) -> DevelopmentPlan:
        """Update an existing development plan."""
        if plan.id is None:
            raise NotFoundError("Development plan ID is required for update")
        
        with self._get_session() as session:
            orm_plan = session.get(DevelopmentPlanORM, plan.id)
            
            if orm_plan is None:
                raise NotFoundError(f"Development plan with ID {plan.id} not found")
            
            # Update fields
            orm_plan.upgrade_type = plan.upgrade_type
            orm_plan.target_name = plan.target_name
            orm_plan.priority = plan.priority
            orm_plan.description = plan.description
            orm_plan.acquisition_plan = plan.acquisition_plan
            orm_plan.progress = plan.progress
            orm_plan.status = plan.status.value if hasattr(plan.status, "value") else plan.status
            if plan.completed_at:
                orm_plan.completed_at = plan.completed_at
            
            session.commit()
            session.refresh(orm_plan)
            
            return orm_to_domain_development_plan(orm_plan)
    
    def delete(self, plan_id: int) -> None:
        """Delete a development plan."""
        with self._get_session() as session:
            orm_plan = session.get(DevelopmentPlanORM, plan_id)
            
            if orm_plan is None:
                raise NotFoundError(f"Development plan with ID {plan_id} not found")
            
            session.delete(orm_plan)
            session.commit()