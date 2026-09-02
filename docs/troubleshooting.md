# Troubleshooting Guide — WH40k Colony Manager

**Last Updated:** 2026-08-26  
**Status:** Active

---

## Quick Reference

| Problem | Quick Fix |
|---------|-----------|
| Server won't start | Check port 8000 is free, verify `.env` file |
| Database errors | Run `make migrate` or delete `colony_manager.db` |
| Import errors | Check `PYTHONPATH`, verify virtualenv is active |
| API returns 401 | Check JWT token, verify it hasn't expired |
| Tests failing | Run `make test-verbose` for details |
| Config not loading | Verify YAML syntax, check file paths |

---

## Installation Issues

### Virtual Environment Problems

**Symptom:** `python` command not found or wrong Python version

```bash
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Verify activation
python --version  # Should be Python 3.11+
```

**Symptom:** pip install fails

```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Then reinstall dependencies
pip install -r requirements.txt
```

### Database Migration Errors

**Symptom:** `sqlite3.OperationalError: no such table`

```bash
# Run migrations
make migrate

# Or manually
python -m colony_manager.adapters.persistence.migrations
```

**Symptom:** Database locked

```bash
# Windows - check for running processes
Get-Process python | Where-Object {$_.Path -like "*colony_manager*"}

# Delete database if development (backup first!)
Copy-Item colony_manager.db colony_manager.db.backup
Remove-Item colony_manager.db
make migrate
```

---

## Development Server Issues

### Server Won't Start

**Symptom:** `Address already in use` error

```bash
# Windows - find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
---

## API Issues

### Authentication Errors

**Symptom:** `401 Unauthorized` on protected endpoints

```bash
# Check token expiry (default: 30 minutes)
# Refresh token if needed
curl -X POST "http://localhost:8000/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "your-refresh-token"}'
```

**Symptom:** `403 Forbidden` after login

```bash
# Verify user has permission for the colony
# Check colony_users table for user-colony associations
```

### Database Connection Errors

**Symptom:** `sqlite3.OperationalError: unable to open database file`

```bash
# Check database path in .env
# Default: ./colony_manager.db

# Verify write permissions
icacls colony_manager.db

# Ensure directory exists
New-Item -ItemType Directory -Force -Path (Split-Path -Path $env:DATABASE_PATH)
```

---

## Configuration Issues

### YAML Config Errors

**Symptom:** `yaml.parser.ParserError` or `yaml.scanner.ScannerError`

```bash
# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('config/colony_types.yaml'))"

# Common issues:
# - Tabs instead of spaces (YAML requires spaces)
# - Missing colons after keys
# - Incorrect indentation
```

**Symptom:** Config changes not taking effect

```bash
# Config is cached at startup - restart required
# Stop server (Ctrl+C) and restart
make dev

# Or clear config cache if using hot reload
# (depends on implementation)
```

### Environment Variable Issues

**Symptom:** Settings not loading from `.env`

```bash
# Verify .env file exists
Test-Path .env

# Check format (no spaces around =)
---

## Testing Issues

### Tests Won't Run

**Symptom:** `ModuleNotFoundError` during tests

```bash
# Ensure test dependencies installed
pip install -r requirements-dev.txt

# Set PYTHONPATH
$env:PYTHONPATH = ".\src"

# Run with pytest directly
pytest tests/ -v
```

**Symptom:** Tests fail with database errors

```bash
# Tests use separate test database
# Ensure it's created fresh
pytest --clean-db

# Or manually remove
Remove-Item test_colony_manager.db -ErrorAction SilentlyContinue
```

### Test Coverage Issues

**Symptom:** Coverage lower than expected

```bash
# Run with coverage
make coverage

# View HTML report
Start-Item htmlcov/index.html

# Check for untested edge cases in rules engine
```

---

## Common Error Messages

### "Order == 0 forces PF to 0"

**Not a bug** — This is intended game mechanics. When Order reaches 0, the colony is in Anarchy and cannot generate Profit Factor.

**Fix:** Increase Order through:

- Support Upgrades (Arbites Precinct, Military Garrison)
- Representative with high Willpower
- Events that boost Order

### "Productivity == 0 halves PF"

**Not a bug** — Intended game mechanics. Zero Productivity means the colony isn't producing, halving Profit Factor.

**Fix:** Add Infrastructure or Support Upgrades that boost Productivity.

### "Stat cannot go below 0"

**Not a bug** — Stats are clamped at 0 minimum per game rules.

---

## Performance Issues

### Slow API Responses

**Symptom:** API endpoints taking >1s

```bash
---

## Git Issues

### Merge Conflicts in Config Files

**Symptom:** Conflicts in YAML files

```bash
# YAML is whitespace-sensitive - be careful merging
# Open in editor and resolve manually

# Validate after merge
python -c "import yaml; yaml.safe_load(open('config/colony_types.yaml'))"
```

### Tests Pass Locally but Fail in CI

```bash
# Ensure same Python version
python --version

# Same dependencies
pip freeze > requirements.txt

# Same environment variables
# Check CI configuration for DATABASE_PATH, etc.
```

---

## Getting Help

### Before Opening an Issue

1. ✅ Search existing issues (open and closed)
2. ✅ Check this troubleshooting guide
3. ✅ Review `CONTRIBUTING.md` for reporting guidelines
4. ✅ Gather relevant information (see below)

### Information to Include

When reporting an issue, include:

```markdown
- **OS:** Windows 11 / macOS / Linux
- **Python version:** `python --version`
- **Steps to reproduce:** [detailed steps]
- **Expected behavior:** [what should happen]
- **Actual behavior:** [what actually happened]
- **Error messages:** [full traceback]
- **Relevant logs:** [attach or paste]
```

### Contact Channels

- **GitHub Issues:** For bugs and feature requests
- **Discussions:** For questions and general help
- **Email:** [INSERT MAINTAINER EMAIL]

---

## Debug Mode

Enable verbose logging for debugging:

```bash
# Set environment variable
$env:LOG_LEVEL = "DEBUG"

# Or in .env file
LOG_LEVEL=DEBUG

# Restart server and check logs for details
```

---

## Recovery Procedures

### Reset Development Environment

```bash
# Stop server
# Delete database
Remove-Item colony_manager.db

# Delete Python cache
Remove-Item -Recurse -Force __pycache__
Remove-Item -Recurse -Force .pytest_cache

# Reinstall dependencies
pip install -r requirements.txt

# Run migrations
make migrate

# Start fresh
make dev
```

### Restore from Backup

```bash
# If you have backups (you should!)
Copy-Item colony_manager.db.backup colony_manager.db

# Or restore from export
# See API Guide for import endpoint
```

---

## Known Issues

| Issue | Workaround | Status |
|-------|------------|--------|
| Hot reload slow on Windows | Use WSL2 or disable auto-reload | Known limitation |
| Large databases (>100MB) slow | Implement pagination | Planned |
| YAML reload requires restart | Restart server | By design |

---

**The Emperor Protects** — but backups protect your data. Save often!

**Symptom:** Import errors on startup

```bash
# Ensure you're in the project root
cd d:\Projekty\WH40k_Colony_Manager

# Add src to PYTHONPATH
$env:PYTHONPATH = ".\src"

# Try running directly
python -m uvicorn colony_manager.adapters.api.main:app --reload
```

### Hot Reload Not Working

**Symptom:** Code changes don't reflect without restart

```bash
# Ensure --reload flag is used
make dev

# Check file watchers aren't blocked
# Some antivirus software may block file watching
```
