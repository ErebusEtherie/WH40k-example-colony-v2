"""Pydantic schemas for audit log API requests and responses."""

from datetime import datetime

from pydantic import BaseModel, Field


class AuditLogActionEnum(str):
    """Enum for audit log actions."""

    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


class AuditLogFilter(BaseModel):
    """Schema for filtering audit log queries."""

    entity_type: str | None = Field(default=None, max_length=50)
    start_date: datetime | None = None
    end_date: datetime | None = None
    limit: int = Field(default=100, ge=1, le=500)
    offset: int = Field(default=0, ge=0)


class AuditLogListItem(BaseModel):
    """Lightweight schema for audit log list items (paginated endpoints)."""

    id: int
    entity_type: str
    entity_id: int
    action: str
    field: str | None
    changed_by: int
    changed_at: datetime
    colony_id: int


class AuditLogResponse(BaseModel):
    """Schema for audit log response."""

    id: int
    entity_type: str
    entity_id: int
    action: str
    field: str | None
    old_value: str | None
    new_value: str | None
    changed_by: int
    changed_at: datetime
    colony_id: int

    model_config = {"from_attributes": True}
