import subprocess
import sys
import os

# Run full test suite with verbose output to capture all warnings and failures
result = subprocess.run(
    [sys.executable, "-m", "pytest", "tests/", "-v", "--tb=short", "-W", "default"],
    capture_output=True,
    text=True,
    cwd=os.getcwd()
)

with open("test_results_full.txt", "w", encoding="utf-8") as f:
    f.write("STDOUT:\n")
    f.write(result.stdout)
    f.write("\n\nSTDERR:\n")
    f.write(result.stderr)
    f.write(f"\n\nEXIT CODE: {result.returncode}\n")

print("=== TEST RUN COMPLETE ===")
print(f"Exit code: {result.returncode}")
print("\n=== FINAL SUMMARY ===")
# Extract summary lines
for line in result.stdout.split('\n'):
    if 'passed' in line or 'failed' in line or 'error' in line or 'warning' in line or 'skipped' in line:
        print(line)