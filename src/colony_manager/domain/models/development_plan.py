"""Domain model for development plans.

Development plans track long-term colony development goals. They are purely
informational - no automatic stat effects. Progress tracking is manual.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class DevelopmentPlanStatus(str, Enum):
    """Status enumeration for development plans."""
    
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    ACQUIRED = "acquired"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class DevelopmentPlan(BaseModel):
    """Domain model for colony development plans.
    
    Development plans track long-term colony development goals such as
    acquiring specific infrastructure or support upgrades. They are purely
    informational and do not automatically affect stats.
    
    Attributes:
        id: Database ID (None if not yet persisted).
        colony_id: ID of the colony this plan belongs to.
        upgrade_type: Type of upgrade being pursued ("infrastructure" or "support_upgrade").
        target_name: Name of the specific infrastructure/upgrade being pursued.
        priority: Priority level from 1 (lowest) to 5 (highest).
        description: Detailed description of the plan and its goals.
        acquisition_plan: Steps and strategy for acquiring the target.
        progress: Progress percentage from 0 to 100.
        status: Current status of the development plan.
        created_by: User ID of the user who created this plan.
        created_at: Timestamp when the plan was created.
        completed_at: Timestamp when the plan was completed (if applicable).
    """
    
    id: int | None = None
    colony_id: int
    upgrade_type: str = Field(pattern="^(infrastructure|support_upgrade)$")
    target_name: str = Field(min_length=1, max_length=200)
    priority: int = Field(ge=1, le=5)
    description: str = Field(min_length=1, max_length=2000)
    acquisition_plan: str = Field(min_length=1, max_length=2000)
    progress: int = Field(ge=0, le=100, default=0)
    status: DevelopmentPlanStatus = DevelopmentPlanStatus.PLANNED
    created_by: int
    created_at: datetime | None = None
    completed_at: datetime | None = None