"""Security headers middleware for production hardening.

This middleware adds security-focused HTTP headers to all responses:
- Strict-Transport-Security (HSTS) - production only
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: default-src 'self' (with CDN exceptions for /docs and /redoc)
- Referrer-Policy: strict-origin-when-cross-origin

HSTS is disabled in development mode to avoid interfering with local development
and testing tools that use HTTP.

Note: Swagger UI (/docs and /redoc) requires CDN resources from cdn.jsdelivr.net
and fastapi.tiangolo.com, so CSP is relaxed for those paths.
"""

import os
from collections.abc import Callable
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses.

    Attributes:
        hsts_enabled: Whether to include Strict-Transport-Security header.
            Disabled in development mode to allow HTTP local testing.
    """

    def __init__(self, app: Callable[..., Any]) -> None:
        super().__init__(app)
        environment = os.getenv("ENVIRONMENT", "development")
        self.hsts_enabled = environment != "development"

    async def dispatch(self, request: Request, call_next: Callable[..., Any]) -> Response:
        """Process request and add security headers to response."""
        response: Response = await call_next(request)

        # Always add these headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # CSP: Relax for Swagger UI docs which need CDN resources
        # Swagger UI loads JS/CSS from cdn.jsdelivr.net and favicon from fastapi.tiangolo.com
        path = request.url.path
        if path in ("/docs", "/docs/", "/redoc", "/redoc/"):
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "img-src 'self' https://fastapi.tiangolo.com data:; "
                "font-src 'self' https://cdn.jsdelivr.net;"
            )
        else:
            response.headers["Content-Security-Policy"] = "default-src 'self'"

        # HSTS only in production/staging
        if self.hsts_enabled:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response
