"""Authentication service for token management.

This service handles token-related operations that go beyond simple
creation/verification, including token revocation and blacklist management.
"""

from datetime import UTC, datetime, timedelta

from colony_manager.domain.models.login_attempt import LoginAttempt
from colony_manager.domain.models.token_blacklist import TokenBlacklist
from colony_manager.domain.models.token_issuance import TokenIssuance
from colony_manager.domain.models.user import User
from colony_manager.domain.ports.login_attempt_repository import LoginAttemptRepository
from colony_manager.domain.ports.token_blacklist_repository import TokenBlacklistRepository
from colony_manager.domain.ports.token_issuance_repository import TokenIssuanceRepository
from colony_manager.domain.ports.user_repository import UserRepository
from colony_manager.domain.util.token import verify_token

# Account lockout configuration
LOCKOUT_MAX_ATTEMPTS = 5  # Number of failed attempts before lockout
LOCKOUT_WINDOW_MINUTES = 15  # Time window for counting attempts
LOCKOUT_DURATION_MINUTES = 15  # How long to lock the account


class AuthService:
    """Service for authentication and token management operations.

    This service handles:
    - Token revocation (logout)
    - Bulk token revocation (password change, compromised account)
    - Token blacklist management
    - Login attempt tracking and account lockout
    - Token issuance tracking
    """

    def __init__(
        self,
        token_blacklist_repository: TokenBlacklistRepository,
        user_repository: UserRepository,
        login_attempt_repository: LoginAttemptRepository | None = None,
        token_issuance_repository: TokenIssuanceRepository | None = None,
        refresh_reuse_detection_enabled: bool = False,
    ) -> None:
        self._token_blacklist_repository = token_blacklist_repository
        self._user_repository = user_repository
        self._login_attempt_repository = login_attempt_repository
        self._token_issuance_repository = token_issuance_repository
        self._refresh_reuse_detection_enabled = refresh_reuse_detection_enabled

    def revoke_token(
        self,
        token: str,
        secret_key: str,
        reason: str | None = None,
    ) -> TokenBlacklist:
        """Revoke a single token by adding it to the blacklist.

        Args:
            token: The JWT token string to revoke.
            secret_key: Secret key for decoding the token.
            reason: Optional reason for revocation (e.g., "logout", "password_change").

        Returns:
            Created blacklist entry.

        Raises:
            ValueError: If token is invalid or cannot be decoded.
        """
        try:
            payload = verify_token(token, secret_key, token_type="access")
        except Exception as e:
            raise ValueError(f"Invalid token: {e}") from e

        token_id = payload.get("jti")
        if not token_id:
            raise ValueError("Token does not contain jti claim")

        user_id = int(payload["sub"])
        expires_at = datetime.fromtimestamp(payload["exp"], tz=UTC)

        blacklist_entry = TokenBlacklist(
            token_id=token_id,
            user_id=user_id,
            expires_at=expires_at,
            revoked_at=datetime.now(UTC),
            reason=reason,
        )

        return self._token_blacklist_repository.create(blacklist_entry)

    def refresh_token_is_usable(self, token_jti: str, user_id: int) -> bool:
        """Report whether a presented refresh token may be used, revoking the
        user's whole session family when it was consumed by rotation.

        The refresh endpoint already revokes the token it consumes
        (``reason="rotation"``), so a *replay* of that token means either a
        legitimate retry that raced the rotation or - much more likely - a
        stolen token being replayed. To contain the damage, a replay triggers
        revoke-all ("reuse detected") so the attacker cannot keep refreshing
        the session family while the legitimate client is locked out of a
        single rotated token.

        Only rotation-cause entries trigger the family revoke: a token revoked
        by the owner (logout / admin / password change) must not escalate into
        revoking unrelated sessions.

        Args:
            token_jti: The JTI of the presented refresh token.
            user_id: The user the token claims to belong to.

        Returns:
            True if the token may be used, False if it should be rejected. When
            False is returned because of a rotation replay, the user's session
            family has been revoked beforehand.
        """
        if not self._refresh_reuse_detection_enabled:
            return not self._token_blacklist_repository.is_blacklisted(token_jti)

        entry = self._token_blacklist_repository.get(token_jti)
        if entry is None:
            # Not blacklisted, or its blacklist entry has expired (an expired
            # token would have been rejected before this check anyway) - usable.
            return True
        if entry.reason == "rotation":
            # An already-consumed refresh token is being presented again.
            self.revoke_all_user_tokens(user_id, reason="reuse_detected")
        return False

    def revoke_refresh_token(
        self,
        token: str,
        secret_key: str,
        reason: str | None = None,
    ) -> TokenBlacklist:
        """Revoke a refresh token by marking its issuance revoked and blacklisting it.

        Mirrors ``revoke_token`` for access tokens, plus marks the issuance
        record revoked so the session no longer counts as active. Used by:

        - Refresh-token rotation: the consumed refresh token is invalidated
          when a new pair is issued (see ``/auth/refresh``).
        - Logout: the refresh cookie's token must not survive the session, so
          it cannot be used to mint a fresh access token after revoke.

        Args:
            token: The JWT refresh token string to revoke.
            secret_key: Secret key for decoding the token.
            reason: Reason for revocation (e.g., "rotation", "logout").

        Returns:
            Created blacklist entry.

        Raises:
            ValueError: If token is invalid or cannot be decoded as a refresh token.
        """
        try:
            payload = verify_token(token, secret_key, token_type="refresh")
        except Exception as e:
            raise ValueError(f"Invalid token: {e}") from e

        token_id = payload.get("jti")
        if not token_id:
            raise ValueError("Token does not contain jti claim")

        user_id = int(payload["sub"])
        expires_at = datetime.fromtimestamp(payload["exp"], tz=UTC)
        now = datetime.now(UTC)

        # Mark the issuance record revoked (if tracking is configured) so the
        # token no longer counts as an active session.
        if self._token_issuance_repository is not None:
            self._token_issuance_repository.revoke_token(token_id, now)

        blacklist_entry = TokenBlacklist(
            token_id=token_id,
            user_id=user_id,
            expires_at=expires_at,
            revoked_at=now,
            reason=reason,
        )

        return self._token_blacklist_repository.create(blacklist_entry)

    def get_user(self, user_id: int) -> User | None:
        """Get user by ID.

        Args:
            user_id: ID of the user to retrieve.

        Returns:
            User if found, None otherwise.
        """
        return self._user_repository.get_by_id(user_id)

    def create_tokens_with_tracking(
        self,
        user: User,
        secret_key: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[str, str]:
        """Create access and refresh tokens with issuance tracking.

        Args:
            user: User to create tokens for.
            secret_key: Secret key for signing tokens.
            ip_address: IP address of the request.
            user_agent: User agent string from the request.

        Returns:
            Tuple of (access_token, refresh_token).
        """
        from colony_manager.domain.util.token import create_access_token, create_refresh_token

        access_token = create_access_token(user, secret_key)
        refresh_token = create_refresh_token(user, secret_key)

        # Track token issuance if repository is configured
        if self._token_issuance_repository is not None:
            import jwt

            # User must have an ID to track tokens
            if user.id is None:
                raise ValueError("Cannot track tokens for user without ID")

            access_payload = jwt.decode(
                access_token, secret_key, algorithms=["HS256"], options={"verify_exp": False}
            )
            refresh_payload = jwt.decode(
                refresh_token, secret_key, algorithms=["HS256"], options={"verify_exp": False}
            )

            now = datetime.now(UTC)

            # Track access token
            self._token_issuance_repository.create(
                TokenIssuance(
                    user_id=user.id,
                    token_id=access_payload["jti"],
                    token_type="access",
                    issued_at=now,
                    expires_at=datetime.fromtimestamp(access_payload["exp"], tz=UTC),
                    revoked_at=None,
                    ip_address=ip_address,
                    user_agent=user_agent,
                )
            )

            # Track refresh token
            self._token_issuance_repository.create(
                TokenIssuance(
                    user_id=user.id,
                    token_id=refresh_payload["jti"],
                    token_type="refresh",
                    issued_at=now,
                    expires_at=datetime.fromtimestamp(refresh_payload["exp"], tz=UTC),
                    revoked_at=None,
                    ip_address=ip_address,
                    user_agent=user_agent,
                )
            )

        return access_token, refresh_token

    def revoke_all_user_tokens(
        self,
        user_id: int,
        reason: str | None = None,
    ) -> int:
        """Revoke all tokens for a user.

        This method revokes all active tokens by:
        1. Adding all active token IDs to the blacklist
        2. Marking all token issuances as revoked

        Order matters - see the comment in the body about why the blacklist
        step runs first.

        Args:
            user_id: ID of the user whose tokens to revoke.
            reason: Optional reason for revocation.

        Returns:
            Number of tokens revoked.
        """
        # Blacklist the user's active token IDs BEFORE marking the issuance
        # records revoked. The blacklist implementation discovers active tokens
        # by reading the issuance table (``revoked_at IS NULL``) - if we revoked
        # the records first it would find nothing and no token IDs would be
        # blacklisted, leaving access tokens and refresh replays usable at the
        # JTI-checking endpoints despite the revoke-all. Marking the issuance
        # records revoked afterwards is still done for session accounting.
        blacklist_count = self._token_blacklist_repository.revoke_all_user_tokens(user_id, reason)

        revoked_count = 0
        if self._token_issuance_repository is not None:
            revoked_count = self._token_issuance_repository.revoke_all_user_tokens(
                user_id, datetime.now(UTC)
            )

        return max(revoked_count, blacklist_count)

    def cleanup_expired_tokens(self) -> int:
        """Remove expired entries from the token blacklist.

        Returns:
            Number of entries removed.
        """
        return self._token_blacklist_repository.cleanup_expired()

    def cleanup_old_token_issuances(self, days_to_keep: int = 90) -> int:
        """Remove old token issuance records.

        Args:
            days_to_keep: Number of days to keep issuance records.

        Returns:
            Number of records removed.
        """
        if self._token_issuance_repository is None:
            return 0

        cutoff = datetime.now(UTC) - timedelta(days=days_to_keep)
        return self._token_issuance_repository.cleanup_old_issuances(cutoff)

    def track_login_attempt(
        self,
        username: str,
        success: bool,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> LoginAttempt:
        """Record a login attempt.

        Args:
            username: Username that was attempted.
            success: Whether the login was successful.
            ip_address: IP address of the attempt.
            user_agent: User agent string from the request.

        Returns:
            Created login attempt record.
        """
        if self._login_attempt_repository is None:
            # Create a dummy record if repository not configured
            return LoginAttempt(
                username=username,
                ip_address=ip_address,
                attempted_at=datetime.now(UTC),
                success=success,
                user_agent=user_agent,
            )

        attempt = LoginAttempt(
            username=username,
            ip_address=ip_address,
            attempted_at=datetime.now(UTC),
            success=success,
            user_agent=user_agent,
        )
        return self._login_attempt_repository.create(attempt)

    def is_account_locked(self, username: str) -> bool:
        """Check if an account is locked due to too many failed attempts.

        Args:
            username: Username to check.

        Returns:
            True if the account is locked, False otherwise.
        """
        if self._login_attempt_repository is None:
            return False

        window_start = datetime.now(UTC) - timedelta(minutes=LOCKOUT_WINDOW_MINUTES)
        failed_count = self._login_attempt_repository.count_failed_attempts(
            username=username,
            since=window_start,
        )

        return failed_count >= LOCKOUT_MAX_ATTEMPTS

    def cleanup_old_login_attempts(self, days_to_keep: int = 30) -> int:
        """Remove old login attempt records.

        Args:
            days_to_keep: Number of days to keep attempt records.

        Returns:
            Number of records removed.
        """
        if self._login_attempt_repository is None:
            return 0

        cutoff = datetime.now(UTC) - timedelta(days=days_to_keep)
        return self._login_attempt_repository.cleanup_old_attempts(cutoff)
