"""Support Upgrade service for managing colony support upgrades."""

from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.support_upgrade import SupportUpgrade
from colony_manager.domain.ports.colony_repository import ColonyRepository
from colony_manager.domain.ports.support_upgrade_repository import SupportUpgradeRepository


class SupportUpgradeService:
    """Service layer for support upgrade management."""

    def __init__(
        self,
        repository: SupportUpgradeRepository,
        colony_repository: ColonyRepository,
    ) -> None:
        self._repository = repository
        self._colony_repository = colony_repository

    def create_upgrade(self, upgrade: SupportUpgrade) -> SupportUpgrade:
        """Create new support upgrade for a colony."""
        # Verify colony exists
        colony = self._colony_repository.get(upgrade.colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {upgrade.colony_id} not found")
        return self._repository.create(upgrade)

    def get_upgrade(self, upgrade_id: int) -> SupportUpgrade:
        """Get support upgrade by ID."""
        upgrade = self._repository.get(upgrade_id)
        if upgrade is None:
            raise NotFoundError(f"SupportUpgrade {upgrade_id} not found")
        return upgrade

    def update_upgrade(self, upgrade: SupportUpgrade) -> SupportUpgrade:
        """Update support upgrade."""
        return self._repository.update(upgrade)

    def delete_upgrade(self, upgrade_id: int) -> None:
        """Delete support upgrade."""
        self._repository.delete(upgrade_id)

    def list_by_colony(self, colony_id: int) -> list[SupportUpgrade]:
        """List all support upgrades for a colony."""
        return self._repository.list_by_colony(colony_id)