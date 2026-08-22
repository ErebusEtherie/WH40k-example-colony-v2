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
                acquisition_plan="Gather resources",
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
                acquisition_plan="Gather resources",
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
            acquisition_plan="Gather resources",
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
            acquisition_plan="Hire teachers",
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
                    acquisition_plan="Test",
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
                acquisition_plan="Test",
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
                acquisition_plan="Test",
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
                acquisition_plan="Test",
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
                acquisition_plan="Test",
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
                acquisition_plan="Test",
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
                acquisition_plan="Test",
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
                acquisition_plan="Test",
                created_by=1,
            )
        assert "description" in str(exc_info.value)

    def test_acquisition_plan_min_length_1(self):
        """acquisition_plan must be at least 1 character."""
        with pytest.raises(ValidationError) as exc_info:
            DevelopmentPlan(
                colony_id=1,
                upgrade_type="infrastructure",
                target_name="Test",
                priority=3,
                description="Test",
                acquisition_plan="",
                created_by=1,
            )
        assert "acquisition_plan" in str(exc_info.value)

    def test_acquisition_plan_max_length_2000(self):
        """acquisition_plan must be at most 2000 characters."""
        with pytest.raises(ValidationError) as exc_info:
            DevelopmentPlan(
                colony_id=1,
                upgrade_type="infrastructure",
                target_name="Test",
                priority=3,
                description="Test",
                acquisition_plan="a" * 2001,
                created_by=1,
            )
        assert "acquisition_plan" in str(exc_info.value)

    def test_progress_min_value_0(self):
        """progress must be at least 0."""
        with pytest.raises(ValidationError) as exc_info:
            DevelopmentPlan(
                colony_id=1,
                upgrade_type="infrastructure",
                target_name="Test",
                priority=3,
                description="Test",
                acquisition_plan="Test",
                progress=-1,
                created_by=1,
            )
        assert "progress" in str(exc_info.value)

    def test_progress_max_value_100(self):
        """progress must be at most 100."""
        with pytest.raises(ValidationError) as exc_info:
            DevelopmentPlan(
                colony_id=1,
                upgrade_type="infrastructure",
                target_name="Test",
                priority=3,
                description="Test",
                acquisition_plan="Test",
                progress=101,
                created_by=1,
            )
        assert "progress" in str(exc_info.value)


class TestDevelopmentPlanDefaults:
    """Tests for DevelopmentPlan default values."""

    def test_progress_defaults_to_0(self):
        """progress defaults to 0."""
        plan = DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test",
            priority=3,
            description="Test",
            acquisition_plan="Test",
            created_by=1,
        )
        assert plan.progress == 0

    def test_status_defaults_to_planned(self):
        """status defaults to PLANNED."""
        plan = DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test",
            priority=3,
            description="Test",
            acquisition_plan="Test",
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
            acquisition_plan="Test",
            created_by=1,
        )
        assert plan.created_at is None

    def test_completed_at_defaults_to_none(self):
        """completed_at defaults to None."""
        plan = DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test",
            priority=3,
            description="Test",
            acquisition_plan="Test",
            created_by=1,
        )
        assert plan.completed_at is None

    def test_can_set_explicit_status(self):
        """status can be explicitly set."""
        plan = DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test",
            priority=3,
            description="Test",
            acquisition_plan="Test",
            created_by=1,
            status=DevelopmentPlanStatus.COMPLETED,
        )
        assert plan.status == DevelopmentPlanStatus.COMPLETED

    def test_can_set_completed_at(self):
        """completed_at can be set."""
        from datetime import datetime
        now = datetime.now()
        plan = DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test",
            priority=3,
            description="Test",
            acquisition_plan="Test",
            created_by=1,
            status=DevelopmentPlanStatus.COMPLETED,
            completed_at=now,
        )
        assert plan.completed_at == now
