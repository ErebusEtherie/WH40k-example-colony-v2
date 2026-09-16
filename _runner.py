import subprocess


def run(label, cmd):
    print(f"===== {label} =====")
    p = subprocess.run(cmd, capture_output=True, text=True, cwd=r"d:\Projekty\WH40k_Colony_Manager", check=False)
    out = (p.stdout or "") + (p.stderr or "")
    lines = [l for l in out.splitlines() if l.strip()]
    tail = lines[-40:] if len(lines) > 40 else lines
    print("\n".join(tail))
    print(f"EXIT CODE: {p.returncode}")
    print()

V = r"d:\Projekty\WH40k_Colony_Manager\.venv\Scripts\python.exe"
VIT = r"d:\Projekty\WH40k_Colony_Manager\node_modules\.bin\vitest.cmd"
run("vitest NewColonyModal", [VIT, "run", "src/test/NewColonyModal.test.tsx"])
