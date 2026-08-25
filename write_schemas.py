content = """Pydantic schemas for development plan API requests and responses."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class DevelopmentPlanStatusEnum(str, Enum):
    """Enum for development plan status."""
    
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    ACQUIRED = "acquired"
    DELIVERED = "delivered"
