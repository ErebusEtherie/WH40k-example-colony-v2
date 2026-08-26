"""Pydantic schemas for development plan API requests and responses."""

from enum import Enum


class DevelopmentPlanStatusEnum(str, Enum):
    """Enum for development plan status."""

    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    ACQUIRED = "acquired"
    DELIVERED = "delivered"
