"""Common API schemas."""

import math
from typing import TypeVar

from pydantic import BaseModel, computed_field


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str
    status_code: int
    path: str | None = None


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


class PaginationMeta(BaseModel):
    """Pagination metadata."""

    total: int
    offset: int
    limit: int
    has_more: bool

    @computed_field  # type: ignore[prop-decorator]
    @property
    def total_pages(self) -> int:
        """Calculate total number of pages."""
        # Defensive: limit is validated as ge=1 in query params, but guard against invalid data
        if self.limit <= 0:
            return 0
        return math.ceil(self.total / self.limit)


T = TypeVar("T")


class PaginatedResponse[T](BaseModel):
    """Paginated list response."""

    items: list[T]
    meta: PaginationMeta
