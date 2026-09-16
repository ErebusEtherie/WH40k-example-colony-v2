from pathlib import Path

p = Path(r"d:\Projekty\WH40k_Colony_Manager\src\components\modals\NewColonyModal.tsx")
lines = p.read_text(encoding="utf-8").splitlines()
for i in range(243, 300):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}")
