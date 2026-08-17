"""Application service for colony use cases."""

from __future__ import annotations

from datetime import UTC, datetime

from colony_manager.application.services.colony_state_calculator import ColonyStateCalculator
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.ports.colony_repository import ColonyRepository
from colony_manager.domain.ports.representative_repository import RepresentativeRepository
from colony_manager.domain.ports.rule_config_provider import RuleConfigProvider


class ColonyService:
    """Create, update, and query colonies via repository and rule adapters."""

    def __init__(
        self,
        colony_repository: ColonyRepository,
        representative_repository: RepresentativeRepository,
        rule_config_provider: RuleConfigProvider,
    ) -> None:
        self._colony_repository = colony_repository
        self._representative_repository = representative_repository
        self._rule_config_provider = rule_config_provider
        self._state_calculator = ColonyStateCalculator(rule_config_provider)

    def create_colony(self, colony: Colony) -> Colony:
        return self._colony_repository.create(colony)

    def update_age(self, colony_id: int, age_days: int) -> Colony:
        colony = self._colony_repository.get(colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {colony_id} not found")
        colony.age_days = age_days
        colony.age_last_updated = datetime.now(UTC).date()
        return self._colony_repository.update(colony)

    def add_modifier(self, colony_id: int, modifier: Modifier) -> Colony:
        colony = self._colony_repository.get(colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {colony_id} not found")
        colony.modifiers.append(modifier)
        return self._colony_repository.update(colony)

    def get_state(self, colony_id: int) -> dict[str, object]:
        colony = self._colony_repository.get(colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {colony_id} not found")
        return self._state_calculator.calculate(colony)
