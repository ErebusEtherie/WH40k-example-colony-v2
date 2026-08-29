"""Leadership modifier resolution rules for the colony manager."""

from colony_manager.domain.errors import ConfigurationError


def resolve_leadership_modifier(stat_bonus: int, lookup: dict[int, int]) -> int:
    """Resolve the leadership modifier from a stat bonus and lookup table."""
    if stat_bonus not in lookup:
        raise ConfigurationError(
            f"Leadership modifier lookup missing entry for stat bonus {stat_bonus}"
        )
    return lookup[stat_bonus]
