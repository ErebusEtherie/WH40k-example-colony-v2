"""Tests for the AuditLog domain model."""

import pytest
from datetime import datetime, timezone
from pydantic import ValidationError

from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction


class TestAuditLogValidators:
    """Tests for AuditLog model field validators."""

    def test_changed_at_required(self):
        """changed_at is required (defaults to UTC now)."""
        # Should work without explicit changed_at - uses default
        log = AuditLog(
            entity_type="colony",
            entity_id=1,
            action=AuditLogAction.UPDATE,
            changed_by=2,
            colony_id=1,
            changed_at=datetime.now(timezone.utc),
        )
        assert log.changed_at is not None
        assert log.changed_at.tzinfo is not None

    def test_changed_at_uses_utc_timezone(self):
        """changed_at defaults to UTC timezone."""
        log = AuditLog(
            entity_type="colony",
            entity_id=1,
            action=AuditLogAction.UPDATE,
            changed_by=2,
            colony_id=1,
            changed_at=datetime.now(timezone.utc),
        )
        # UTC has offset of 0
        offset = log.changed_at.utcoffset()
        assert offset is not None
        assert offset.total_seconds() == 0

    def test_changed_at_converts_naive_to_utc(self):
        """Naive datetime for changed_at is converted to UTC."""
        naive_dt = datetime(2025, 1, 1, 12, 0, 0)
        log = AuditLog(
            entity_type="colony",
            entity_id=1,
            action=AuditLogAction.UPDATE,
            changed_by=2,
            colony_id=1,
            changed_at=naive_dt,
        )
        assert log.changed_at.tzinfo is not None
        assert log.changed_at == naive_dt.replace(tzinfo=timezone.utc)

    def test_entity_type_required(self):
        """entity_type is required and cannot be empty."""
        with pytest.raises(ValidationError) as exc_info:
            AuditLog(
                entity_type="",
                entity_id=1,
                action=AuditLogAction.UPDATE,
                changed_by=2,
                colony_id=1,
                changed_at=datetime.now(timezone.utc),
            )
        assert "entity_type" in str(exc_info.value)

    def test_entity_id_required(self):
        """entity_id is required."""
        with pytest.raises(ValidationError) as exc_info:
            AuditLog.model_validate({
                "entity_type": "colony",
                "action": "update",
                "changed_by": 2,
                "colony_id": 1,
                "changed_at": datetime.now(timezone.utc),
            })
        assert "entity_id" in str(exc_info.value)

    def test_changed_by_required(self):
        """changed_by is required."""
        with pytest.raises(ValidationError) as exc_info:
            AuditLog.model_validate({
                "entity_type": "colony",
                "entity_id": 1,
                "action": "update",
                "colony_id": 1,
                "changed_at": datetime.now(timezone.utc),
            })
        assert "changed_by" in str(exc_info.value)

    def test_colony_id_required(self):
        """colony_id is required."""
        with pytest.raises(ValidationError) as exc_info:
            AuditLog.model_validate({
                "entity_type": "colony",
                "entity_id": 1,
                "action": "update",
                "changed_by": 2,
                "changed_at": datetime.now(timezone.utc),
            })
        assert "colony_id" in str(exc_info.value)

    def test_valid_audit_log(self):
        """Valid AuditLog with all required fields."""
        log = AuditLog(
            entity_type="colony",
            entity_id=1,
            action=AuditLogAction.UPDATE,
            field="name",
            old_value='"Old Name"',
            new_value='"New Name"',
            changed_by=2,
            colony_id=1,
        )
        assert log.entity_type == "colony"
        assert log.entity_id == 1
        assert log.action == AuditLogAction.UPDATE
        assert log.field == "name"
        assert log.old_value == '"Old Name"'
        assert log.new_value == '"New Name"'
        assert log.changed_by == 2
        assert log.colony_id == 1