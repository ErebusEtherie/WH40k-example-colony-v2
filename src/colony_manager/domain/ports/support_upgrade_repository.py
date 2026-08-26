"""Repository protocol for support upgrades."""

from __future__ import annotations

from typing import Protocol

from colony_manager.domain.models.support_upgrade import SupportUpgrade


class SupportUpgradeRepository(Protocol):
    def create(self, upgrade: SupportUpgrade) -> SupportUpgrade: ...

    def get(self, upgrade_id: int) -> SupportUpgrade | None: ...

    def update(self, upgrade: SupportUpgrade) -> SupportUpgrade: ...

    def delete(self, upgrade_id: int) -> None: ...

    def list_by_colony(self, colony_id: int) -> list[SupportUpgrade]: ...

    def list(self) -> list[SupportUpgrade]: ...
