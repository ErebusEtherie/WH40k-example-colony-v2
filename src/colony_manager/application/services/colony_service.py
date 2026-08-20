"""Application service for colony use cases."""

from __future__ import annotations

from datetime import UTC, date, datetime

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

    def get_state(self, colony_id: int, as_of: date | None = None) -> dict[str, object]:
        """
        Get the calculated state for a colony.
        
        Args:
            colony_id: The ID of the colony.
            as_of: Optional date to calculate state for (for modifier expiry).
                   Defaults to today if not provided.
        
        Returns:
            Dict with calculated stats.
        
        Raises:
            NotFoundError: If the colony does not exist.
        """
        colony = self._colony_repository.get(colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {colony_id} not found")
        return self._state_calculator.calculate(colony, as_of)

    def get_colony(self, colony_id: int) -> Colony:
        """Get a colony by ID.
        
        Args:
            colony_id: The ID of the colony to retrieve.
            
        Returns:
            The colony domain object.
            
        Raises:
            NotFoundError: If the colony does not exist.
        """
        colony = self._colony_repository.get(colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {colony_id} not found")
        return colony

    def get_roll_status(self, colony_id: int) -> dict[str, object]:
        """
        Get the roll status for a colony (event and development rolls).
        
        Args:
            colony_id: The ID of the colony.
        
        Returns:
            Dict with keys:
                - event_roll_due: bool - whether an event roll is due now
                - development_roll_due: bool - whether a development roll is due now
                - days_since_event_roll: int - days since last event roll was due
                - days_until_event_roll: int - days until next event roll
                - days_since_development_roll: int - days since last dev roll was due
                - days_until_development_roll: int - days until next dev roll
                - event_interval_days: int - configured event roll interval
                - development_interval_days: int - configured development roll interval
        
        Raises:
            NotFoundError: If the colony does not exist.
        """
        colony = self._colony_repository.get(colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {colony_id} not found")
        
        # Get intervals from config
        event_interval = self._rule_config_provider.get_event_roll_interval_days()
        development_interval = self._rule_config_provider.get_development_roll_interval_days()
        
        # Calculate roll timing
        cycle_info = colony.get_cycle_info(event_interval, development_interval)
        
        # A roll is "due" when days_since is 0 (i.e., we're exactly on the interval)
        event_roll_due = cycle_info["days_since_event_roll"] == 0
        development_roll_due = cycle_info["days_since_development_roll"] == 0
        
        return {
            "event_roll_due": event_roll_due,
            "development_roll_due": development_roll_due,
            "days_since_event_roll": cycle_info["days_since_event_roll"],
            "days_until_event_roll": cycle_info["days_until_event_roll"],
            "days_since_development_roll": cycle_info["days_since_development_roll"],
            "days_until_development_roll": cycle_info["days_until_development_roll"],
            "event_interval_days": event_interval,
            "development_interval_days": development_interval,
        }
