"""Application service for planetary resource management."""

from __future__ import annotations

from datetime import date

from colony_manager.domain.enums import ResourceType
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.resource import ColonyResource
from colony_manager.domain.ports.colony_repository import ColonyRepository
from colony_manager.domain.ports.resource_repository import ResourceRepository


class ResourceService:
    """Manage planetary resources for colonies."""

    def __init__(
        self,
        resource_repository: ResourceRepository,
        colony_repository: ColonyRepository,
    ) -> None:
        self._resource_repository = resource_repository
        self._colony_repository = colony_repository

    def add_resource(
        self,
        colony_id: int,
        resource_type: str,
        name: str,
        abundance: int,
        notes: str = "",
        discovered_date: date | None = None,
    ) -> ColonyResource:
        """Add a new planetary resource to a colony."""
        # Verify colony exists
        colony = self._colony_repository.get(colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {colony_id} not found")

        resource = ColonyResource(
            colony_id=colony_id,
            resource_type=ResourceType(resource_type),
            name=name,
            abundance=abundance,
            notes=notes,
            discovered_date=discovered_date or date.today(),
        )
        return self._resource_repository.create(resource)

    def get_resource(self, resource_id: int) -> ColonyResource:
        """Get a specific resource by ID."""
        return self._resource_repository.get(resource_id)

    def list_resources(self, colony_id: int) -> list[ColonyResource]:
        """List all resources for a colony."""
        return self._resource_repository.get_by_colony(colony_id)

    def update_resource(
        self,
        resource_id: int,
        abundance: int | None = None,
        notes: str | None = None,
    ) -> ColonyResource:
        """Update a resource's abundance or notes."""
        resource = self._resource_repository.get(resource_id)
        
        if abundance is not None:
            resource.abundance = abundance
        if notes is not None:
            resource.notes = notes
        
        return self._resource_repository.update(resource)

    def remove_resource(self, resource_id: int) -> None:
        """Remove a resource from a colony."""
        self._resource_repository.delete(resource_id)
    
    def colony_exists(self, colony_id: int) -> bool:
        """Check if a colony exists."""
        return self._colony_repository.get(colony_id) is not None