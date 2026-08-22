"""Tests for DevelopmentPlanRepository - development plan persistence."""

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from colony_manager.adapters.persistence.db import init_db
from colony_manager.adapters.persistence.repositories.development_plan_repository_impl import SqlAlchemyDevelopmentPlanRepository
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.development_plan import DevelopmentPlan, DevelopmentPlanStatus


def _create_db_url(tmp_path: Path) -> str:
    """Helper to create and initialize a test database."""
    db_path = tmp_path / "test.db"
    init_db(db_path)
    return f"sqlite:///{db_path.as_posix()}"


class TestDevelopmentPlanCreate:
    """Tests for development plan creation."""

    def test_create_plan(self, tmp_path):
        """Test creating a new development plan."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        
        plan = DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Power Network",
            priority=1,
            description="Build power network",
            acquisition_plan="Purchase from merchant",
            progress=0,
            status=DevelopmentPlanStatus.PLANNED,
            created_by=50,
        )
        
        created = repo.create(plan)
        
        assert created.id is not None
        assert created.colony_id == 1
        assert created.upgrade_type == "infrastructure"
        assert created.target_name == "Power Network"
        assert created.priority == 1
        assert created.status == DevelopmentPlanStatus.PLANNED
        assert created.created_at is not None

    def test_create_plan_with_all_fields(self, tmp_path):
        """Test creating plan with all optional fields."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        
        plan = DevelopmentPlan(
            colony_id=1,
            upgrade_type="support_upgrade",
            target_name="Security Force",
            priority=2,
            description="Establish security force",
            acquisition_plan="Train colonists",
            progress=25,
            status=DevelopmentPlanStatus.IN_PROGRESS,
            created_by=50,
        )
        
        created = repo.create(plan)
        
        assert created.id is not None
        assert created.upgrade_type == "support_upgrade"
        assert created.progress == 25
        assert created.status == DevelopmentPlanStatus.IN_PROGRESS


class TestDevelopmentPlanGetById:
    """Tests for retrieving plan by ID."""

    def test_get_by_id_success(self, tmp_path):
        """Test retrieving plan by ID."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        
        created = repo.create(DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Water Treatment",
            priority=1,
            description="Clean water system",
            acquisition_plan="Build from scrap",
            progress=0,
            status=DevelopmentPlanStatus.PLANNED,
            created_by=50,
        ))
        
        retrieved = repo.get_by_id(created.id)
        
        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.target_name == "Water Treatment"

    def test_get_by_id_not_found(self, tmp_path):
        """Test retrieving non-existent plan returns None."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        
        result = repo.get_by_id(99999)
        
        assert result is None


class TestDevelopmentPlanGetByColony:
    """Tests for retrieving plans by colony."""

    def test_get_by_colony(self, tmp_path):
        """Test getting all plans for a colony."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        
        repo.create(DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Power Network",
            priority=1,
            description="Power",
            acquisition_plan="Buy",
            progress=0,
            status=DevelopmentPlanStatus.PLANNED,
            created_by=50,
        ))
        repo.create(DevelopmentPlan(
            colony_id=1,
            upgrade_type="support_upgrade",
            target_name="Security",
            priority=2,
            description="Security",
            acquisition_plan="Train",
            progress=0,
            status=DevelopmentPlanStatus.PLANNED,
            created_by=50,
        ))
        
        # Create plan for different colony
        repo.create(DevelopmentPlan(
            colony_id=2,
            upgrade_type="infrastructure",
            target_name="Roads",
            priority=1,
            description="Roads",
            acquisition_plan="Build",
            progress=0,
            status=DevelopmentPlanStatus.PLANNED,
            created_by=50,
        ))
        
        plans = repo.get_by_colony(colony_id=1)
        
        assert len(plans) == 2
        assert all(p.colony_id == 1 for p in plans)

    def test_get_by_colony_empty(self, tmp_path):
        """Test getting plans for colony with none."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        
        plans = repo.get_by_colony(colony_id=999)
        
        assert len(plans) == 0


class TestDevelopmentPlanUpdate:
    """Tests for updating development plans."""

    def test_update_progress(self, tmp_path):
        """Test updating plan progress."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        
        created = repo.create(DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test",
            priority=1,
            description="Test plan",
            acquisition_plan="Test",
            progress=0,
            status=DevelopmentPlanStatus.PLANNED,
            created_by=50,
        ))
        
        created.progress = 50
        updated = repo.update(created)
        
        assert updated.progress == 50

    def test_update_status(self, tmp_path):
        """Test updating plan status."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        
        created = repo.create(DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test",
            priority=1,
            description="Test plan",
            acquisition_plan="Test",
            progress=0,
            status=DevelopmentPlanStatus.PLANNED,
            created_by=50,
        ))
        
        created.status = DevelopmentPlanStatus.IN_PROGRESS
        updated = repo.update(created)
        
        assert updated.status == DevelopmentPlanStatus.IN_PROGRESS

    def test_update_completed_at(self, tmp_path):
        """Test updating completed_at field."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        
        created = repo.create(DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test",
            priority=1,
            description="Test plan",
            acquisition_plan="Test",
            progress=0,
            status=DevelopmentPlanStatus.PLANNED,
            created_by=50,
        ))
        
        now = datetime.now(UTC)
        created.progress = 100
        created.status = DevelopmentPlanStatus.COMPLETED
        created.completed_at = now
        updated = repo.update(created)
        
        assert updated.progress == 100
        assert updated.status == DevelopmentPlanStatus.COMPLETED
        assert updated.completed_at is not None

    def test_update_nonexistent_raises(self, tmp_path):
        """Test updating non-existent plan raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        
        plan = DevelopmentPlan(
            id=99999,
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test",
            priority=1,
            description="Test",
            acquisition_plan="Test",
            progress=0,
            status=DevelopmentPlanStatus.PLANNED,
            created_by=50,
        )
        
        with pytest.raises(NotFoundError, match="not found"):
            repo.update(plan)

    def test_update_without_id_raises(self, tmp_path):
        """Test updating without ID raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        
        plan = DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test",
            priority=1,
            description="Test",
            acquisition_plan="Test",
            progress=0,
            status=DevelopmentPlanStatus.PLANNED,
            created_by=50,
        )
        
        with pytest.raises(NotFoundError, match="ID is required"):
            repo.update(plan)


class TestDevelopmentPlanDelete:
    """Tests for deleting development plans."""

    def test_delete_success(self, tmp_path):
        """Test deleting a plan."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        
        created = repo.create(DevelopmentPlan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test",
            priority=1,
            description="Test",
            acquisition_plan="Test",
            progress=0,
            status=DevelopmentPlanStatus.PLANNED,
            created_by=50,
        ))
        
        repo.delete(created.id)
        
        # Verify deleted
        assert repo.get_by_id(created.id) is None

    def test_delete_nonexistent_raises(self, tmp_path):
        """Test deleting non-existent plan raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        
        with pytest.raises(NotFoundError, match="not found"):
            repo.delete(99999)
