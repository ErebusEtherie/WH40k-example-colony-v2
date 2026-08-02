from pathlib import Path

from typer.testing import CliRunner

from colony_manager.adapters.cli.main import app


runner = CliRunner()


def _write_test_config(tmp_path: Path) -> Path:
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    (config_dir / "colony_types.yaml").write_text(
        "- name: example\n  base_complacency: 10\n  base_order: 10\n  base_productivity: 10\n  base_piety: 10\n  base_size: 5\n  resource_exploit_bonus: 0\n",
        encoding="utf-8",
    )
    (config_dir / "personalities.yaml").write_text(
        "- name: example_personality\n  description: desc\n  effect: effect\n",
        encoding="utf-8",
    )
    (config_dir / "rule_tables.yaml").write_text(
        "size_to_profit_factor:\n  - size: 5\n    profit_factor: 2\nleadership_modifier:\n  - stat_bonus: 0\n    modifier: 1\nlore_thresholds:\n  complacency:\n    placated: true\n    stable: true\n  order:\n    anarchy: true\n    stable: true\n  productivity:\n    productive: true\n    halted: true\n    stable: true\n  piety:\n    pious: true\n    heretical: true\n    stable: true\n",
        encoding="utf-8",
    )
    return config_dir


def test_cli_create_and_show_colony(tmp_path):
    config_dir = _write_test_config(tmp_path)

    result = runner.invoke(
        app,
        ["--config-dir", str(config_dir), "colony", "create", "Example Colony", "Owner", "example"],
    )
    assert result.exit_code == 0

    result = runner.invoke(app, ["--config-dir", str(config_dir), "colony", "show", "1"])
    assert result.exit_code == 0
    assert "Example Colony" in result.stdout
    assert "Owner" in result.stdout
    assert "Size" in result.stdout


def test_cli_list_colonies(tmp_path):
    config_dir = _write_test_config(tmp_path)

    result = runner.invoke(
        app,
        ["--config-dir", str(config_dir), "colony", "create", "Example Colony", "Owner", "example"],
    )
    assert result.exit_code == 0

    result = runner.invoke(app, ["--config-dir", str(config_dir), "colony", "list"])
    assert result.exit_code == 0
    assert "Example Colony" in result.stdout
    assert "example" in result.stdout


def test_cli_representative_and_import_export_flow(tmp_path):
    config_dir = _write_test_config(tmp_path)

    create_result = runner.invoke(
        app,
        ["--config-dir", str(config_dir), "colony", "create", "Export Colony", "Owner", "example"],
    )
    assert create_result.exit_code == 0

    rep_result = runner.invoke(
        app,
        ["--config-dir", str(config_dir), "representative", "create", "Test Representative", "judge"],
    )
    assert rep_result.exit_code == 0

    export_path = tmp_path / "colony_export.json"
    export_result = runner.invoke(
        app,
        ["--config-dir", str(config_dir), "colony", "export", "1", str(export_path)],
    )
    assert export_result.exit_code == 0
    assert export_path.exists()

    import_result = runner.invoke(app, ["--config-dir", str(config_dir), "colony", "import", str(export_path)])
    assert import_result.exit_code == 0
    assert "Imported colony" in import_result.stdout
