import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

root = Path(r"d:\Projekty\WH40k_Colony_Manager")
with open(root / "package.json", encoding="utf-8") as f:
    pkg = json.load(f)
print("SCRIPTS:")
print(json.dumps(pkg.get("scripts", {}), indent=2))
print("\nreferences to server.ts:")
for p in list(root.glob("*.json")) + list(root.glob("*.md")) + [root / "package.json", root / "vite.config.ts"]:
    if not p.exists():
        continue
    try:
        txt = p.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as exc:
        logger.warning("Could not read %s: %s", p, exc)
        continue
    if "server.ts" in txt:
        print(" -", p)
