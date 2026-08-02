"""Application service for representative use cases."""

from __future__ import annotations

from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.representative import Representative
from colony_manager.domain.ports.colony_repository import ColonyRepository
from colony_manager.domain.ports.representative_repository import RepresentativeRepository


class RepresentativeService:
    """Create, update, and manage representatives and their colony assignment."""

    def __init__(
        self,
        colony_repository: ColonyRepository,
        representative_repository: RepresentativeRepository,
    ) -> None:
        self._colony_repository = colony_repository
        self._representative_repository = representative_repository

    def create_representative(self, representative: Representative) -> Representative:
        return self._representative_repository.create(representative)

    def assign_to_colony(self, colony_id: int, representative_id: int) -> Colony:
        colony = self._colony_repository.get(colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {colony_id} not found")
        representative = self._representative_repository.get(representative_id)
        if representative is None:
            raise NotFoundError(f"Representative {representative_id} not found")
        colony.representative_id = representative_id
        return self._colony_repository.update(colony)

    def clear_from_colony(self, colony_id: int) -> Colony:
        colony = self._colony_repository.get(colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {colony_id} not found")
        colony.representative_id = None
        return self._colony_repository.update(colony)
