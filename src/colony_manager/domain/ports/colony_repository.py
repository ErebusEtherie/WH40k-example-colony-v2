"""Repository protocol for colonies."""

from __future__ import annotations

from typing import Protocol

from colony_manager.domain.models.colony import Colony


class ColonyRepository(Protocol):
    def create(self, colony: Colony) -> Colony: ...

    def get(self, colony_id: int) -> Colony | None: ...

    def update(self, colony: Colony) -> Colony: ...

    def delete(self, colony_id: int) -> None: ...

    def list(self) -> list[Colony]: ...
