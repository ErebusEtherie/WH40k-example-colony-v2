from pathlib import Path

root = Path(r"d:\Projekty\WH40k_Colony_Manager")

print("===== config/colony_types.yaml (mining special_effects) =====")
txt = (root / "config" / "colony_types.yaml").read_text(encoding="utf-8").splitlines()
for i in range(41, 64):
    if i < len(txt):
        print(f"{i+1}: {txt[i]}")

print("\n===== NewColonyModal.tsx (conditional bonuses render) =====")
txt2 = (root / "src" / "components" / "modals" / "NewColonyModal.tsx").read_text(encoding="utf-8").splitlines()
for i in range(275, 298):
    if i < len(txt2):
        print(f"{i+1}: {txt2[i]}")
