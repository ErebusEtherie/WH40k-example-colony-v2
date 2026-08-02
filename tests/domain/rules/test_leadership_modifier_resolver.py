import pytest

from colony_manager.domain.errors import ConfigurationError
from colony_manager.domain.rules.leadership_modifier_resolver import resolve_leadership_modifier


def test_resolve_leadership_modifier_returns_configured_value():
    lookup = {0: -3, 1: -2, 2: -1, 3: 0, 4: 1, 5: 2}
    assert resolve_leadership_modifier(4, lookup) == 1


def test_resolve_leadership_modifier_raises_for_missing_entry():
    lookup = {0: -3, 1: -2}
    with pytest.raises(ConfigurationError):
        resolve_leadership_modifier(5, lookup)
