import re

# Read the file
with open('src/colony_manager/adapters/api/routers/auth_router.py', 'r') as f:
    content = f.read()

# Find the login function using regex
# Fixed: Uses [^@]* instead of .*? to avoid catastrophic backtracking
# [^@]* matches any character except @ (which starts decorators), preventing excessive backtracking
pattern = r'(@router\.post\("/login"[^@]*?return\s+TokenResponse\([^)]*expires_in\s*=\s*1800[^)]*\)\s*\))'
match = re.search(pattern, content, re.DOTALL)

if match: