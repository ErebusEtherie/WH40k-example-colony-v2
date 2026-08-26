"""Repository protocol for infrastructure."""

from __future__ import annotations

from typing import Protocol

from colony_manager.domain.models.infrastructure import Infrastructure


class InfrastructureRepository(Protocol):
    def create(self, infrastructure: Infrastructure) -> Infrastructure: ...

    def get(self, infrastructure_id: int) -> Infrastructure | None: ...

    def update(self, infrastructure: Infrastructure) -> Infrastructure: ...

    def delete(self, infrastructure_id: int) -> None: ...

    def list_by_colony(self, colony_id: int) -> list[Infrastructure]: ...

    def list(self) -> list[Infrastructure]: ...
