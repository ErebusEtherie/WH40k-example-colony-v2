"""API router for development plan endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from colony_manager.adapters.api import dependencies
from colony_manager.adapters.api.middleware.auth import get_current_user, require_role
from colony_manager.adapters.api.middleware.permissions import require_colony_permission
from colony_manager.adapters.api.schemas.development_plan import (
    DevelopmentPlanCreate,
    DevelopmentPlanResponse,
    DevelopmentPlanUpdate,
)
from colony_manager.application.services.development_plan_service import DevelopmentPlanService
from colony_manager.domain.models.development_plan import DevelopmentPlanStatus
from colony_manager.domain.models.user import User
from colony_manager.domain.ports.colony_user_repository import ColonyUserRepository

router = APIRouter(prefix="/development-plans", tags=["development_plans"])

# Error message constants
ERR_PLAN_NOT_FOUND = "Development plan not found"
ERR_PLAN_INCOMPLETE = "Development plan data is incomplete"
ERR_USER_NO_ID = "Authenticated user has no ID"


@router.post("/colonies/{colony_id}", response_model=DevelopmentPlanResponse, status_code=status.HTTP_201_CREATED)
def create_development_plan(
    colony_id: int,
    plan_data: DevelopmentPlanCreate,
    service: Annotated[DevelopmentPlanService, Depends(dependencies.get_development_plan_service)],
    current_user: Annotated[User, Depends(require_role("colony_manager"))],
) -> DevelopmentPlanResponse:
    """Create a new development plan for a colony.
    
    Development plans track long-term colony development goals.
    Requires colony_manager role or higher.
    """
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ERR_USER_NO_ID,
        )
    
    plan = service.create_plan(
        colony_id=colony_id,
        upgrade_type=plan_data.upgrade_type,
        target_name=plan_data.target_name,
        priority=plan_data.priority,
        description=plan_data.description,
        acquisition_plan=plan_data.acquisition_plan,
        created_by=current_user.id,
    )
    
    if plan.id is None or plan.created_at is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ERR_PLAN_INCOMPLETE,
        )
    
    return DevelopmentPlanResponse(
        id=plan.id,
        colony_id=plan.colony_id,
        upgrade_type=plan.upgrade_type,
        target_name=plan.target_name,
        priority=plan.priority,
        description=plan.description,
        acquisition_plan=plan.acquisition_plan,
        progress=plan.progress,
        status=plan.status.value,
        created_by=plan.created_by,
        created_at=plan.created_at,
        completed_at=plan.completed_at,
    )
@router.get("/{plan_id}", response_model=DevelopmentPlanResponse)
def get_development_plan(
    plan_id: int,
    service: Annotated[DevelopmentPlanService, Depends(dependencies.get_development_plan_service)],
    current_user: Annotated[User, Depends(get_current_user)],
    colony_user_repo: Annotated[ColonyUserRepository, Depends(dependencies.get_colony_user_repository)],
) -> DevelopmentPlanResponse:
    """Get a development plan by ID."""
    plan = service.get_plan(plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ERR_PLAN_NOT_FOUND)
    
    # Check permission on the colony the plan belongs to
    if current_user.id is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=ERR_USER_NO_ID)
    membership = colony_user_repo.get_by_colony_and_user(plan.colony_id, current_user.id)
    if membership is None and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail=f"User is not a member of colony {plan.colony_id}")
    if membership is None and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail=f"User is not a member of colony {plan.colony_id}")
    
    if plan.id is None or plan.created_at is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ERR_PLAN_INCOMPLETE,
        )
    
    return DevelopmentPlanResponse(
        id=plan.id,
        colony_id=plan.colony_id,
        upgrade_type=plan.upgrade_type,
        target_name=plan.target_name,
        priority=plan.priority,
        description=plan.description,
        acquisition_plan=plan.acquisition_plan,
        progress=plan.progress,
        status=plan.status.value,
        created_by=plan.created_by,
        created_at=plan.created_at,
        completed_at=plan.completed_at,
    )


@router.get("/colonies/{colony_id}", response_model=list[DevelopmentPlanResponse])
def get_development_plans_by_colony(
    colony_id: int,
    service: Annotated[DevelopmentPlanService, Depends(dependencies.get_development_plan_service)],
    current_user: Annotated[User, Depends(get_current_user)],
    colony_user_repo: Annotated[ColonyUserRepository, Depends(dependencies.get_colony_user_repository)],) -> list[DevelopmentPlanResponse]:
    """Get all development plans for a colony."""
    # Check permission on the colony
    if current_user.id is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=ERR_USER_NO_ID)
    membership = colony_user_repo.get_by_colony_and_user(colony_id, current_user.id)
    if membership is None and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail=f"User is not a member of colony {colony_id}")
    
    plans = service.get_plans_by_colony(colony_id)
    result: list[DevelopmentPlanResponse] = []
    for p in plans:
        if p.id is None or p.created_at is None:
            continue  # Skip plans with incomplete data
        result.append(
            DevelopmentPlanResponse(
                id=p.id,
                colony_id=p.colony_id,
                upgrade_type=p.upgrade_type,
                target_name=p.target_name,
                priority=p.priority,
                description=p.description,
                acquisition_plan=p.acquisition_plan,
                progress=p.progress,
                status=p.status.value,
                created_by=p.created_by,
                created_at=p.created_at,
                completed_at=p.completed_at,
            )
        )
    return result


@router.patch("/{plan_id}", response_model=DevelopmentPlanResponse)
def update_development_plan(
    plan_id: int,
    plan_data: DevelopmentPlanUpdate,
    service: Annotated[DevelopmentPlanService, Depends(dependencies.get_development_plan_service)],
    current_user: Annotated[User, Depends(require_role("colony_manager"))],
) -> DevelopmentPlanResponse:
    """Update a development plan. Requires colony_manager role or higher."""
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ERR_USER_NO_ID,
        )
    
    plan = service.get_plan(plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ERR_PLAN_NOT_FOUND)
    
    # Convert status enum if provided
    status_value = None
    if plan_data.status is not None:
        status_value = DevelopmentPlanStatus(plan_data.status)
    
    updated_plan = service.update_plan(
        plan_id=plan_id,
        upgrade_type=plan_data.upgrade_type,
        target_name=plan_data.target_name,
        priority=plan_data.priority,
        description=plan_data.description,
        acquisition_plan=plan_data.acquisition_plan,
        progress=plan_data.progress,
        status=status_value,
        changed_by=current_user.id,
    )
    
    if updated_plan.id is None or updated_plan.created_at is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ERR_PLAN_INCOMPLETE,
        )
    
    return DevelopmentPlanResponse(
        id=updated_plan.id,
        colony_id=updated_plan.colony_id,
        upgrade_type=updated_plan.upgrade_type,
        target_name=updated_plan.target_name,
        priority=updated_plan.priority,
        description=updated_plan.description,
        acquisition_plan=updated_plan.acquisition_plan,
        progress=updated_plan.progress,
        status=updated_plan.status.value,
        created_by=updated_plan.created_by,
        created_at=updated_plan.created_at,
        completed_at=updated_plan.completed_at,
    )


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_development_plan(
    plan_id: int,
    service: Annotated[DevelopmentPlanService, Depends(dependencies.get_development_plan_service)],
    current_user: Annotated[User, Depends(require_role("colony_manager"))],
) -> None:
    """Delete a development plan. Requires colony_manager role or higher."""
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ERR_USER_NO_ID,
        )
    
    plan = service.get_plan(plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ERR_PLAN_NOT_FOUND)
    
    service.delete_plan(plan_id, changed_by=current_user.id)


