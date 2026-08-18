"""Repository protocol for planetary resources."""

from __future__ import annotations

from typing import Protocol

from colony_manager.domain.models.resource import ColonyResource


class ResourceRepository(Protocol):
    def create(self, resource: ColonyResource) -> ColonyResource:
        ...

    def get(self, resource_id: int) -> ColonyResource:
        ...

    def get_by_colony(self, colony_id: int) -> list[ColonyResource]:
        ...

    def update(self, resource: ColonyResource) -> ColonyResource:
        ...

    def delete(self, resource_id: int) -> None:
        ...

    def delete_by_colony(self, colony_id: int) -> None:
        """Delete all resources for a colony (cascade delete)."""
        ...