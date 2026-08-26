"""Tests for TokenIssuanceRepository - token issuance tracking."""

from datetime import UTC, datetime, timedelta
from pathlib import Path


from colony_manager.adapters.persistence.db import init_db
from colony_manager.adapters.persistence.repositories.token_issuance_repository_impl import (
    SqlAlchemyTokenIssuanceRepository,
)
from colony_manager.domain.models.token_issuance import TokenIssuance


def _create_db_url(tmp_path: Path) -> str:
    """Helper to create and initialize a test database."""
    db_path = tmp_path / "test.db"
    init_db(db_path)
    return f"sqlite:///{db_path.as_posix()}"


class TestTokenIssuanceCreate:
    """Tests for token issuance creation."""

    def test_create_issuance(self, tmp_path):
        """Test recording a token issuance."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyTokenIssuanceRepository(db_url)

        now = datetime.now(UTC)
        issuance = TokenIssuance(
            user_id=1,
            token_id="test-token-jti-abc123",
            token_type="access",
            issued_at=now,
            expires_at=now + timedelta(minutes=30),
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0",
        )

        created = repo.create(issuance)

        assert created.id is not None
        assert created.user_id == 1
        assert created.token_id == "test-token-jti-abc123"
        assert created.token_type == "access"
        assert created.ip_address == "192.168.1.1"
        assert created.user_agent == "Mozilla/5.0"

    def test_create_refresh_token(self, tmp_path):
        """Test recording a refresh token issuance."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyTokenIssuanceRepository(db_url)

        now = datetime.now(UTC)
        issuance = TokenIssuance(
            user_id=1,
            token_id="refresh-token-xyz",
            token_type="refresh",
            issued_at=now,
            expires_at=now + timedelta(days=7),
        )

        created = repo.create(issuance)

        assert created.id is not None
        assert created.token_type == "refresh"

    def test_create_without_optional_fields(self, tmp_path):
        """Test creating issuance without optional fields."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyTokenIssuanceRepository(db_url)

        now = datetime.now(UTC)
        issuance = TokenIssuance(
            user_id=1,
            token_id="minimal-token",
            token_type="access",
            issued_at=now,
            expires_at=now + timedelta(minutes=30),
        )

        created = repo.create(issuance)

        assert created.id is not None
        assert created.ip_address is None
        assert created.user_agent is None


class TestTokenIssuanceGetActiveTokens:
    """Tests for retrieving active tokens."""

    def test_get_active_tokens(self, tmp_path):
        """Test getting all active tokens for a user."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyTokenIssuanceRepository(db_url)

        now = datetime.now(UTC)

        # Create 3 active tokens
        for i in range(3):
            repo.create(
                TokenIssuance(
                    user_id=1,
                    token_id=f"active-token-{i}",
                    token_type="access",
                    issued_at=now,
                    expires_at=now + timedelta(hours=1),
                )
            )

        active = repo.get_active_tokens(user_id=1)

        assert len(active) == 3
        assert all(t.revoked_at is None for t in active)

    def test_get_active_tokens_excludes_revoked(self, tmp_path):
        """Test that revoked tokens are not included."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyTokenIssuanceRepository(db_url)

        now = datetime.now(UTC)

        # Create active token
        repo.create(
            TokenIssuance(
                user_id=1,
                token_id="active-token",
                token_type="access",
                issued_at=now,
                expires_at=now + timedelta(hours=1),
            )
        )

        # Create revoked token
        repo.create(
            TokenIssuance(
                user_id=1,
                token_id="revoked-token",
                token_type="access",
                issued_at=now,
                expires_at=now + timedelta(hours=1),
                revoked_at=now,
            )
        )

        active = repo.get_active_tokens(user_id=1)

        assert len(active) == 1
        assert active[0].token_id == "active-token"

    def test_get_active_tokens_excludes_expired(self, tmp_path):
        """Test that expired tokens are not included."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyTokenIssuanceRepository(db_url)

        now = datetime.now(UTC)

        # Create active token
        repo.create(
            TokenIssuance(
                user_id=1,
                token_id="active-token",
                token_type="access",
                issued_at=now,
                expires_at=now + timedelta(hours=1),
            )
        )

        # Create expired token
        repo.create(
            TokenIssuance(
                user_id=1,
                token_id="expired-token",
                token_type="access",
                issued_at=now - timedelta(days=2),
                expires_at=now - timedelta(days=1),
            )
        )

        active = repo.get_active_tokens(user_id=1)

        assert len(active) == 1
        assert active[0].token_id == "active-token"

    def test_get_active_tokens_no_tokens(self, tmp_path):
        """Test getting tokens for user with no tokens."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyTokenIssuanceRepository(db_url)

        active = repo.get_active_tokens(user_id=999)

        assert len(active) == 0


class TestTokenIssuanceRevokeToken:
    """Tests for revoking individual tokens."""

    def test_revoke_token_success(self, tmp_path):
        """Test revoking a specific token."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyTokenIssuanceRepository(db_url)

        now = datetime.now(UTC)
        repo.create(
            TokenIssuance(
                user_id=1,
                token_id="to-revoke",
                token_type="access",
                issued_at=now,
                expires_at=now + timedelta(hours=1),
            )
        )

        result = repo.revoke_token("to-revoke", revoked_at=now)

        assert result is True

        # Verify token is now revoked
        active = repo.get_active_tokens(user_id=1)
        assert len(active) == 0

    def test_revoke_nonexistent_token(self, tmp_path):
        """Test revoking non-existent token returns False."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyTokenIssuanceRepository(db_url)

        now = datetime.now(UTC)
        result = repo.revoke_token("nonexistent", revoked_at=now)

        assert result is False

    def test_revoke_already_revoked_token(self, tmp_path):
        """Test revoking already revoked token returns False."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyTokenIssuanceRepository(db_url)

        now = datetime.now(UTC)

        # Create and revoke token
        repo.create(
            TokenIssuance(
                user_id=1,
                token_id="already-revoked",
                token_type="access",
                issued_at=now,
                expires_at=now + timedelta(hours=1),
                revoked_at=now - timedelta(minutes=10),
            )
        )

        result = repo.revoke_token("already-revoked", revoked_at=now)

        assert result is False


class TestTokenIssuanceRevokeAllUserTokens:
    """Tests for bulk token revocation."""

    def test_revoke_all_tokens_success(self, tmp_path):
        """Test revoking all tokens for a user."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyTokenIssuanceRepository(db_url)

        now = datetime.now(UTC)

        # Create 3 active tokens for user 1
        for i in range(3):
            repo.create(
                TokenIssuance(
                    user_id=1,
                    token_id=f"user1-token-{i}",
                    token_type="access",
                    issued_at=now,
                    expires_at=now + timedelta(hours=1),
                )
            )

        # Create 2 tokens for user 2
        for i in range(2):
            repo.create(
                TokenIssuance(
                    user_id=2,
                    token_id=f"user2-token-{i}",
                    token_type="access",
                    issued_at=now,
                    expires_at=now + timedelta(hours=1),
                )
            )

        # Revoke all for user 1
        count = repo.revoke_all_user_tokens(user_id=1, revoked_at=now)

        assert count == 3

        # Verify user 1 has no active tokens
        assert len(repo.get_active_tokens(user_id=1)) == 0

        # Verify user 2 still has active tokens
        assert len(repo.get_active_tokens(user_id=2)) == 2

    def test_revoke_all_no_tokens(self, tmp_path):
        """Test revoking when user has no tokens."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyTokenIssuanceRepository(db_url)

        now = datetime.now(UTC)
        count = repo.revoke_all_user_tokens(user_id=999, revoked_at=now)

        assert count == 0


class TestTokenIssuanceCleanup:
    """Tests for cleaning up old token issuances."""

    def test_cleanup_old_issuances(self, tmp_path):
        """Test removing old token issuance records."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyTokenIssuanceRepository(db_url)

        now = datetime.now(UTC)

        # Create old expired issuances
        for i in range(3):
            repo.create(
                TokenIssuance(
                    user_id=1,
                    token_id=f"old-token-{i}",
                    token_type="access",
                    issued_at=now - timedelta(days=10),
                    expires_at=now - timedelta(days=3),
                )
            )

        # Create recent expired issuance
        repo.create(
            TokenIssuance(
                user_id=1,
                token_id="recent-token",
                token_type="access",
                issued_at=now - timedelta(days=2),
                expires_at=now - timedelta(days=1),
            )
        )

        # Create valid (non-expired) issuance
        repo.create(
            TokenIssuance(
                user_id=1,
                token_id="valid-token",
                token_type="access",
                issued_at=now,
                expires_at=now + timedelta(hours=1),
            )
        )

        # Cleanup issuances expired before 2 days ago
        cutoff = now - timedelta(days=2)
        removed = repo.cleanup_old_issuances(before=cutoff)

        assert removed == 3

        # Verify old tokens are removed
        active = repo.get_active_tokens(user_id=1)
        assert len(active) == 1
        assert active[0].token_id == "valid-token"

    def test_cleanup_no_old_issuances(self, tmp_path):
        """Test cleanup when no old issuances exist."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyTokenIssuanceRepository(db_url)

        now = datetime.now(UTC)

        # Create only recent tokens
        repo.create(
            TokenIssuance(
                user_id=1,
                token_id="recent-token",
                token_type="access",
                issued_at=now - timedelta(hours=1),
                expires_at=now + timedelta(hours=1),
            )
        )

        cutoff = now - timedelta(days=1)
        removed = repo.cleanup_old_issuances(before=cutoff)

        assert removed == 0
        assert len(repo.get_active_tokens(user_id=1)) == 1
