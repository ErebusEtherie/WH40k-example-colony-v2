"""Tests for DevelopmentPlan domain model validators and properties."""

import pytest

from pydantic import ValidationError

from colony_manager.domain.models.development_plan import DevelopmentPlan, DevelopmentPlanStatus


class TestDevelopmentPlanValidators:
    """Tests for DevelopmentPlan field validators."""

    def test_colony_id_required(self):
        """colony_id is required."""
        with pytest.raises(ValidationError) as exc_info:
            DevelopmentPlan(
                upgrade_type="infrastructure",
                target_name="Power Network",
                priority=3,
                description="Build power network",
                target_type="Gather resources",
                created_by=1,
            )
        assert "colony_id" in str(exc_info.value)

    def test_created_by_required(self):
        """created_by is required."""
        with pytest.raises(ValidationError) as exc_info:
            DevelopmentPlan(
                colony_id=1,
                upgrade_type="infrastructure",
                target_name="Power Network",
                priority=3,
                description="Build power network",
                target_type="Gather resources",
            )
        assert "created_by" in str(exc_info.value)

    def test_upgrade_type_pattern_infrastructure(self):
        """upgrade_type accepts 'infrastructure'."""
        plan = DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Power Network",
            priority=3,
            description="Build power network",
            target_type="Gather resources",
            created_by=1,
        )
        assert plan.upgrade_type == "infrastructure"

    def test_upgrade_type_pattern_support_upgrade(self):
        """upgrade_type accepts 'support_upgrade'."""
        plan = DevelopmentPlan(
            colony_id=1,
            upgrade_type="support_upgrade",
            target_name="Scholam",
            priority=3,
            description="Build scholam",
            target_type="Hire teachers",
            created_by=1,
        )
        assert plan.upgrade_type == "support_upgrade"

    def test_upgrade_type_rejects_invalid_values(self):
        """upgrade_type rejects values other than 'infrastructure' or 'support_upgrade'."""
        for invalid_type in ["upgrade", "building", "INFRASTRUCTURE", ""]:
            with pytest.raises(ValidationError) as exc_info:
                DevelopmentPlan(
                    colony_id=1,
                    upgrade_type=invalid_type,
                    target_name="Test",
                    priority=3,
                    description="Test",
                    target_type="Test",
                    created_by=1,
                )
            assert "upgrade_type" in str(exc_info.value)

    def test_target_name_min_length_1(self):
        """target_name must be at least 1 character."""
        with pytest.raises(ValidationError) as exc_info:
            DevelopmentPlan(
                colony_id=1,
                upgrade_type="infrastructure",
                target_name="",
                priority=3,
                description="Test",
                target_type="Test",
                created_by=1,
            )
        assert "target_name" in str(exc_info.value)

    def test_target_name_max_length_200(self):
        """target_name must be at most 200 characters."""
        with pytest.raises(ValidationError) as exc_info:
            DevelopmentPlan(
                colony_id=1,
                upgrade_type="infrastructure",
                target_name="a" * 201,
                priority=3,
                description="Test",
                target_type="Test",
                created_by=1,
            )
        assert "target_name" in str(exc_info.value)

    def test_priority_min_value_1(self):
        """priority must be at least 1."""
        with pytest.raises(ValidationError) as exc_info:
            DevelopmentPlan(
                colony_id=1,
                upgrade_type="infrastructure",
                target_name="Test",
                priority=0,
                description="Test",
                target_type="Test",
                created_by=1,
            )
        assert "priority" in str(exc_info.value)

    def test_priority_max_value_5(self):
        """priority must be at most 5."""
        with pytest.raises(ValidationError) as exc_info:
            DevelopmentPlan(
                colony_id=1,
                upgrade_type="infrastructure",
                target_name="Test",
                priority=6,
                description="Test",
                target_type="Test",
                created_by=1,
            )
        assert "priority" in str(exc_info.value)

    def test_priority_valid_range(self):
        """priority accepts values 1-5."""
        for p in [1, 2, 3, 4, 5]:
            plan = DevelopmentPlan(
                colony_id=1,
                upgrade_type="infrastructure",
                target_name="Test",
                priority=p,
                description="Test",
                target_type="Test",
                created_by=1,
            )
            assert plan.priority == p

    def test_description_min_length_1(self):
        """description must be at least 1 character."""
        with pytest.raises(ValidationError) as exc_info:
            DevelopmentPlan(
                colony_id=1,
                upgrade_type="infrastructure",
                target_name="Test",
                priority=3,
                description="",
                target_type="Test",
                created_by=1,
            )
        assert "description" in str(exc_info.value)

    def test_description_max_length_2000(self):
        """description must be at most 2000 characters."""
        with pytest.raises(ValidationError) as exc_info:
            DevelopmentPlan(
                colony_id=1,
                upgrade_type="infrastructure",
                target_name="Test",
                priority=3,
                description="a" * 2001,
                target_type="Test",
                created_by=1,
            )
        assert "description" in str(exc_info.value)

    def test_target_type_min_length_1(self):
        """target_type must be at least 1 character."""
        with pytest.raises(ValidationError) as exc_info:
            DevelopmentPlan(
                colony_id=1,
                upgrade_type="infrastructure",
                target_name="Test",
                priority=3,
                description="Test",
                target_type="",
                created_by=1,
            )
        assert "target_type" in str(exc_info.value)

    def test_target_type_max_length_100(self):
        """target_type must be at most 100 characters."""
        with pytest.raises(ValidationError) as exc_info:
            DevelopmentPlan(
                colony_id=1,
                upgrade_type="infrastructure",
                target_name="Test",
                priority=3,
                description="Test",
                target_type="a" * 101,
                created_by=1,
            )
        assert "target_type" in str(exc_info.value)


class TestDevelopmentPlanDefaults:
    """Tests for DevelopmentPlan default values."""

    def test_status_defaults_to_planned(self):
        """status defaults to PLANNED."""
        plan = DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test",
            priority=3,
            description="Test",
            target_type="Test",
            created_by=1,
        )
        assert plan.status == DevelopmentPlanStatus.PLANNED

    def test_created_at_defaults_to_none(self):
        """created_at defaults to None."""
        plan = DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test",
            priority=3,
            description="Test",
            target_type="Test",
            created_by=1,
        )
        assert plan.created_at is None

    def test_can_set_explicit_status(self):
        """status can be explicitly set."""
        plan = DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test",
            priority=3,
            description="Test",
            target_type="Test",
            created_by=1,
            status=DevelopmentPlanStatus.DELIVERED,
        )
        assert plan.status == DevelopmentPlanStatus.DELIVERED
