import logging
from pathlib import Path

logger = logging.getLogger(__name__)

root = Path(r"d:\Projekty\WH40k_Colony_Manager")
dirs = [root / "src" / "colony_manager", root / "tests"]
pats = ["special_effects", "starts_with_upgrade", "resource_types", "productivity_bonus", "additional_pf", "ColonySpecialEffect", "get_colony_types", "colony_type"]
for d in dirs:
    for p in sorted(d.rglob("*.py")):
        try:
            txt = p.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as exc:
            logger.warning("Could not read %s: %s", p, exc)
            continue
        for i, line in enumerate(txt.splitlines(), 1):
            for pat in pats:
                if pat in line:
                    print(f"{p}:{i}: {line.strip()}")
                    break
