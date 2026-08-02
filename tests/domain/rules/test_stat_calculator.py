import pytest

from colony_manager.domain.enums import ModifierStat
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.rules.stat_calculator import calculate_stat


def test_calculate_stat_with_active_modifiers():
    base = 10
    modifiers = [
        Modifier(
            id=1,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_stat=ModifierStat.COMPLACENCY,
            modifier_value=5,
            modifier_description="Bonus",
            is_active=True,
        ),
        Modifier(
            id=2,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_stat=ModifierStat.ORDER,
            modifier_value=-3,
            modifier_description="Penalty",
            is_active=True,
        ),
    ]

    assert calculate_stat(base, modifiers, ModifierStat.COMPLACENCY) == 15


def test_calculate_stat_ignores_inactive_modifiers():
    base = 10
    modifiers = [
        Modifier(
            id=1,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_stat=ModifierStat.COMPLACENCY,
            modifier_value=-20,
            modifier_description="Inactive penalty",
            is_active=False,
        )
    ]

    assert calculate_stat(base, modifiers, ModifierStat.COMPLACENCY) == 10


def test_calculate_stat_never_negative():
    base = 0
    modifiers = [
        Modifier(
            id=1,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_stat=ModifierStat.COMPLACENCY,
            modifier_value=-5,
            modifier_description="Penalty",
            is_active=True,
        )
    ]

    assert calculate_stat(base, modifiers, ModifierStat.COMPLACENCY) == 0
