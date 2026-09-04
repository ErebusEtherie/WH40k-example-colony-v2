"""CSRF protection middleware.

This middleware validates CSRF tokens on state-changing requests to prevent
Cross-Site Request Forgery attacks.
"""

from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """Validate CSRF tokens on state-changing requests.
    
    This middleware:
    - Skips CSRF validation for safe methods (GET, HEAD, OPTIONS)
    - Requires X-CSRF-Token header for POST, PUT, PATCH, DELETE
    - Validates token matches the cookie value
    - Skips authentication endpoints (login/register have rate limiting instead)
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip CSRF check for safe methods
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return await call_next(request)

        # Skip CSRF for auth endpoints (login/register have their own protection via rate limiting)
        if request.url.path.startswith("/api/v1/auth"):
            return await call_next(request)

        # Get CSRF token from header
        csrf_token = request.headers.get("X-CSRF-Token")

        if not csrf_token:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "CSRF token missing. Please refresh the page.", "path": request.url.path},
            )

        # Validate CSRF token against cookie
        cookie_token = request.cookies.get("csrf_token")

        if not cookie_token or csrf_token != cookie_token:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "CSRF token invalid. Please refresh the page.", "path": request.url.path},
            )

        return await call_next(request)