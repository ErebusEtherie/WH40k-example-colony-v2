"""Repository protocol for representatives."""

from __future__ import annotations

from typing import Protocol

from colony_manager.domain.models.representative import Representative


class RepresentativeRepository(Protocol):
    def create(self, representative: Representative) -> Representative:
        ...

    def get(self, representative_id: int) -> Representative | None:
        ...

    def update(self, representative: Representative) -> Representative:
        ...

    def delete(self, representative_id: int) -> None:
        ...

    def list(self) -> list[Representative]:
        ...
