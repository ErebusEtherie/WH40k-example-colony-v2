"""Server-Sent Events (SSE) router for real-time notifications."""

import json
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from colony_manager.adapters.api.middleware.auth import get_current_user
from colony_manager.adapters.api.notification_service import (
    NotificationService,
    get_notification_service,
)
from colony_manager.domain.models.user import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


async def event_generator(
    user_id: int,
    notification_service: NotificationService,
) -> AsyncGenerator[str, None]:
    """Generate SSE events from notification queue."""
    queue = notification_service.subscribe(user_id)
    try:
        while True:
            notification = await queue.get()
            # SSE format: data: {json}\n\n
            yield f"data: {json.dumps(notification.to_dict())}\n\n"
    except GeneratorExit:
        # Client disconnected
        notification_service.unsubscribe(user_id, queue)


@router.get("/stream")
async def notification_stream(
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[NotificationService, Depends(get_notification_service)],
) -> StreamingResponse:
    """Stream real-time notifications via Server-Sent Events.

    Connect to this endpoint to receive a stream of notifications about:
    - Colony changes
    - Event creation/updates/deletion
    - Development plan changes
    - Colony user changes

    The connection will remain open and push notifications as they occur.
    Clients should implement automatic reconnection logic.
    """
    if current_user.id is None:
        # Should not happen due to auth middleware, but handle gracefully
        return StreamingResponse(
            iter([]),
            media_type="text/event-stream",
        )

    return StreamingResponse(
        event_generator(current_user.id, notification_service),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering if behind nginx
        },
    )
