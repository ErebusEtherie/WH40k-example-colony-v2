from colony_manager.domain.enums import LoreState, ModifierStat
from colony_manager.domain.rules.lore_state_resolver import resolve_lore_state


def test_resolve_lore_state_complacency_placated():
    assert resolve_lore_state(ModifierStat.COMPLACENCY, value=10, size=5) == LoreState.PLACATED


def test_resolve_lore_state_order_anarchy():
    assert resolve_lore_state(ModifierStat.ORDER, value=0, size=5) == LoreState.ANARCHY


def test_resolve_lore_state_productivity_halted():
    assert resolve_lore_state(ModifierStat.PRODUCTIVITY, value=0, size=5) == LoreState.HALTED


def test_resolve_lore_state_piety_heretical():
    assert resolve_lore_state(ModifierStat.PIETY, value=0, size=5) == LoreState.HERETICAL


def test_resolve_lore_state_orderly():
    assert resolve_lore_state(ModifierStat.ORDER, value=10, size=5) == LoreState.ORDERLY


def test_resolve_lore_state_riots_and_unrest():
    assert (
        resolve_lore_state(ModifierStat.COMPLACENCY, value=0, size=5) == LoreState.RIOTS_AND_UNREST
    )
