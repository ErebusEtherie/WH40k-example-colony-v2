from pathlib import Path
import tempfile
from typer.testing import CliRunner
from colony_manager.adapters.cli.main import app

with tempfile.TemporaryDirectory() as tmp:
    tmp_path = Path(tmp)
    config_dir = tmp_path / 'config'
    config_dir.mkdir()
    (config_dir / 'colony_types.yaml').write_text('- name: example\n  base_complacency: 10\n  base_order: 10\n  base_productivity: 10\n  base_piety: 10\n  base_size: 5\n  resource_exploit_bonus: 0\n', encoding='utf-8')
    (config_dir / 'personalities.yaml').write_text('- name: example_personality\n  description: desc\n  effect: effect\n', encoding='utf-8')
    (config_dir / 'rule_tables.yaml').write_text('size_to_profit_factor:\n  - size: 5\n    profit_factor: 2\nleadership_modifier:\n  - stat_bonus: 0\n    modifier: 1\nlore_thresholds:\n  complacency:\n    placated: true\n    stable: true\n  order:\n    anarchy: true\n    stable: true\n  productivity:\n    productive: true\n    halted: true\n    stable: true\n  piety:\n    pious: true\n    heretical: true\n    stable: true\n', encoding='utf-8')
    runner = CliRunner()
    res1 = runner.invoke(app, ['--config-dir', str(config_dir), 'colony', 'create', 'Example Colony', 'Owner', 'example'])
    print('create exit', res1.exit_code)
    print('create stdout', res1.stdout)
    print('create exception', repr(res1.exception))
    res2 = runner.invoke(app, ['--config-dir', str(config_dir), 'colony', 'show', '1'])
    print('show exit', res2.exit_code)
    print('show stdout', res2.stdout)
    print('show exception', repr(res2.exception))
    print('db exists', (tmp_path / 'colony_manager.sqlite').exists())
