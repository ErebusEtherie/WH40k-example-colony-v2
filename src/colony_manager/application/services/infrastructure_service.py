"""Infrastructure service for managing colony infrastructure."""

from colony_manager.domain.enums import InfrastructureState
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.infrastructure import Infrastructure
from colony_manager.domain.ports.colony_repository import ColonyRepository
from colony_manager.domain.ports.infrastructure_repository import InfrastructureRepository


class InfrastructureService:
    """Service layer for infrastructure management."""

    def __init__(
        self,
        repository: InfrastructureRepository,
        colony_repository: ColonyRepository,
    ) -> None:
        self._repository = repository
        self._colony_repository = colony_repository

    def create_infrastructure(self, infrastructure: Infrastructure) -> Infrastructure:
        """Create new infrastructure for a colony."""
        # Verify colony exists
        colony = self._colony_repository.get(infrastructure.colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {infrastructure.colony_id} not found")
        return self._repository.create(infrastructure)

    def get_infrastructure(self, infrastructure_id: int) -> Infrastructure:
        """Get infrastructure by ID."""
        infra = self._repository.get(infrastructure_id)
        if infra is None:
            raise NotFoundError(f"Infrastructure {infrastructure_id} not found")
        return infra

    def update_infrastructure_state(
        self, infrastructure_id: int, state: InfrastructureState
    ) -> Infrastructure:
        """Update infrastructure state."""
        infra = self.get_infrastructure(infrastructure_id)
        infra.state = state
        return self._repository.update(infra)

    def delete_infrastructure(self, infrastructure_id: int) -> None:
        """Delete infrastructure."""
        self._repository.delete(infrastructure_id)

    def list_by_colony(self, colony_id: int) -> list[Infrastructure]:
        """List all infrastructure for a colony."""
        return self._repository.list_by_colony(colony_id)
    
    def colony_exists(self, colony_id: int) -> bool:
        """Check if a colony exists."""
        return self._colony_repository.get(colony_id) is not None