import subprocess
import sys

result = subprocess.run(
    [sys.executable, '-m', 'pytest', 'tests/', '-v'],
    capture_output=True,
    text=True,
    timeout=300
)

with open('pytest_output.txt', 'w', encoding='utf-8') as f:
    f.write(result.stdout)
    f.write(result.stderr)

# Print summary
lines = result.stdout.split('\n')
for line in lines[-10:]:
    print(line)