"""Common API schemas."""

from typing import TypeVar

from pydantic import BaseModel


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


T = TypeVar("T")


class PaginatedResponse[T](BaseModel):
    """Paginated list response."""

    items: list[T]
    meta: PaginationMeta