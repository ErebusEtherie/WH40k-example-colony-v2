"""Rate limiting middleware for API endpoints.

This module provides rate limiting using slowapi (starlette-rate-limiter).
Rate limits are applied to authentication endpoints to prevent brute force attacks.

Configuration:
- Rate limiting can be enabled/disabled via RATE_LIMIT_ENABLED setting
- Limits are configured per-endpoint (e.g., 5 requests/minute for login)
- Uses IP address as the rate limit key (X-Forwarded-For aware)

Security Note: Rate limiting is critical for production deployments to prevent:
- Brute force password attacks
- Credential stuffing attacks
- Token enumeration attacks
"""

from collections.abc import Callable
from typing import TYPE_CHECKING

from fastapi import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from colony_manager.config.settings import get_security_settings

if TYPE_CHECKING:
    from starlette.responses import Response


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request, respecting X-Forwarded-For header.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Client IP address string
        
    Note:
        When behind a reverse proxy (nginx, Cloudflare, etc.), the X-Forwarded-For
        header contains the original client IP. This function respects that header
        while falling back to direct connection IP if not present.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2, ...
        # Take the first (original client) IP
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


def get_limiter() -> Limiter:
    """Get or create the rate limiter instance.
    
    Returns:
        Configured Limiter instance
        
    Note:
        Rate limiting is automatically disabled in test environment.
        The limiter is created once and stored at module level.
    """
    import os
    import sys
    
    # Disable rate limiting in test environment
    # Check for pytest in sys.modules (set during test collection/execution)
    is_test_env = "pytest" in sys.modules or os.getenv("PYTEST_CURRENT_TEST")
    
    if is_test_env:
        return Limiter(
            key_func=get_client_ip,
            default_limits=[],
            enabled=False,
        )
    
    settings = get_security_settings()
    return Limiter(
        key_func=get_client_ip,
        default_limits=[],  # No default limits - apply per-endpoint
        enabled=settings.rate_limit_enabled,
    )


def get_rate_limit_exceeded_handler() -> Callable[["Request", RateLimitExceeded], "Response"]:
    """Get the rate limit exceeded exception handler.
    
    Returns:
        Exception handler function for RateLimitExceeded
        
    Usage:
        app.add_exception_handler(RateLimitExceeded, get_rate_limit_exceeded_handler())
    """
    return _rate_limit_exceeded_handler


# Rate limit decorators for common scenarios
# These are applied to route handlers using @limiter.limit()

def login_rate_limit() -> str:
    """Rate limit for login endpoint.
    
    Returns:
        Rate limit string: 5 requests per minute per IP
        
    Security Rationale:
        - Prevents brute force password attacks
        - Allows legitimate users multiple attempts for typos
        - 5/minute = max 300 attempts/hour, which is sufficient for testing
          but slow enough to deter automated attacks
    """
    settings = get_security_settings()
    # Use configured max_login_attempts per minute
    return f"{settings.max_login_attempts}/minute"


def register_rate_limit() -> str:
    """Rate limit for registration endpoint.
    
    Returns:
        Rate limit string: 3 requests per minute per IP
        
    Security Rationale:
        - Prevents mass account creation attacks
        - Slows down spam/fake account creation
        - 3/minute is sufficient for legitimate users
    """
    return "3/minute"


def refresh_token_rate_limit() -> str:
    """Rate limit for token refresh endpoint.
    
    Returns:
        Rate limit string: 10 requests per minute per IP
        
    Security Rationale:
        - Higher limit than login since token refresh is automated
        - Prevents token enumeration attacks
        - 10/minute allows for normal app refresh cycles
    """
    return "10/minute"


def password_change_rate_limit() -> str:
    """Rate limit for password change endpoint.
    
    Returns:
        Rate limit string: 5 requests per minute per IP
        
    Security Rationale:
        - Prevents rapid password changes (account takeover indicator)
        - Allows legitimate user to retry if they mistype current password
    """
    return "5/minute"