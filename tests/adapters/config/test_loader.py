import pytest

from colony_manager.adapters.config.loader import FileRuleConfigProvider
from colony_manager.domain.errors import ConfigurationError


def test_loader_reads_placeholder_config_files(tmp_path):
    (tmp_path / "colony_types.yaml").write_text(
        "- name: example\n  base_complacency: 10\n  base_order: 10\n  base_productivity: 10\n  base_piety: 10\n  base_size: 5\n  resource_exploit_bonus: 1\n",
        encoding="utf-8",
    )
    (tmp_path / "personalities.yaml").write_text(
        "- name: test_personality\n  description: desc\n  effect: effect\n",
        encoding="utf-8",
    )
    (tmp_path / "rule_tables.yaml").write_text(
        "size_to_profit_factor:\n  - size: 1\n    profit_factor: 2\nleadership_modifier:\n  - stat_bonus: 0\n    modifier: 1\nlore_thresholds:\n  complacency:\n    placated: true\n    stable: true\n  order:\n    anarchy: true\n    stable: true\n  productivity:\n    productive: true\n    halted: true\n    stable: true\n  piety:\n    pious: true\n    heretical: true\n    stable: true\n",
        encoding="utf-8",
    )

    provider = FileRuleConfigProvider(config_dir=tmp_path)

    assert provider.colony_types[0].name == "example"
    assert provider.personalities[0].name == "test_personality"
    assert provider.get_base_profit_factor(1) == 2
    assert provider.get_leadership_modifier(0) == 1


def test_loader_raises_for_missing_config(tmp_path):
    with pytest.raises(ConfigurationError):
        FileRuleConfigProvider(config_dir=tmp_path)


def test_loader_raises_for_invalid_entry(tmp_path):
    (tmp_path / "colony_types.yaml").write_text("- name: missing_base_values\n", encoding="utf-8")
    (tmp_path / "personalities.yaml").write_text("- name: test\n  description: desc\n  effect: effect\n", encoding="utf-8")
    (tmp_path / "rule_tables.yaml").write_text("size_to_profit_factor: []\nleadership_modifier: []\nlore_thresholds: {}\n", encoding="utf-8")

    with pytest.raises(ConfigurationError):
        FileRuleConfigProvider(config_dir=tmp_path)
