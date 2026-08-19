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


T = TypeVar("T")


class PaginatedResponse[T](BaseModel):
    """Paginated list response."""

    items: list[T]
    total: int
    page: int
    page_size: int