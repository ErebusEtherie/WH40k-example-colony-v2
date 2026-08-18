"""Common API schemas."""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str
    status_code: int
    path: str | None = None


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated list response."""

    items: list[T]
    total: int
    page: int
    page_size: int