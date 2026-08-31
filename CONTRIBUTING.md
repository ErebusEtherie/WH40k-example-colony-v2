# Contributing to WH40k Colony Manager

Thank you for your interest in contributing to the WH40k Colony Manager! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)

---

## Getting Started

### Prerequisites

- Python 3.12 or higher
- `uv` package manager (recommended) or `pip`
- Git

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**:

   ```bash
   git clone https://github.com/yourusername/WH40k_Colony_Manager.git
   cd WH40k_Colony_Manager
   ```

3. **Install dependencies**:

   ```bash
   uv sync --no-build --extra dev
   ```

4. **Set up pre-commit hooks** (optional but recommended):

   ```bash
   uv run pre-commit install
   ```

---

## Development Setup

### Running the API Server

```bash
uv run uvicorn colony_manager.main:app --reload --host 0.0.0.0 --port 8000
```

Access the interactive API documentation at <http://localhost:8000/docs>

---

## Code Style

### Python Style Guide

This project follows modern Python best practices:

1. **Type Hints**: All public functions must have full type hints

   ```python
   def calculate_profit_factor(colony: Colony, config: RuleConfig) -> int:
       ...
   ```

2. **Docstrings**: Use Google-style docstrings for all public modules, classes, and functions

   ```python
   def create_colony(name: str, colony_type: str) -> Colony:
       """Create a new colony with the given name and type.

       Args:
           name: The name of the colony
           colony_type: The type of colony (e.g., 'forge_world', 'hive_world')

       Returns:
           A new Colony instance with initialized stats

       Raises:
           ValueError: If colony_type is not valid
       """
   ```

3. **Naming Conventions**:
   - Use snake_case for functions and variables
   - Use PascalCase for classes
   - Use UPPER_CASE for constants
   - Use domain-specific terminology (e.g., `colony`, `representative`, `infrastructure`)

4. **Formatting**: Code is formatted with `ruff format` (Black-compatible)

5. **Imports**: Organize imports in the following order:
   - Standard library imports
   - Third-party imports
   - Local application imports

### Architecture Guidelines

1. **Domain Purity**: Domain layer must have zero I/O operations
2. **Dependency Direction**: Dependencies point inward (`adapters → application → domain`)
3. **Data over Code**: Game rules belong in YAML config files, not hardcoded
4. **No Premature Abstraction**: Only abstract when duplication causes maintenance issues

---

## Testing

### Testing Philosophy

- **Domain logic**: Heavy use of property-based testing with Hypothesis
- **Application services**: Focus on orchestration and error handling
- **Adapters**: Integration tests with real dependencies where feasible
- **API**: Test request/response validation and error cases

### Writing Tests

1. **Test file location**: Mirror the source structure in `tests/`
   - `src/colony_manager/domain/models/colony.py` → `tests/domain/models/test_colony.py`

2. **Test naming**: Use descriptive names that explain the scenario

   ```python
   def test_colony_profit_factor_zero_when_order_is_zero():
       ...
   ```

3. **Fixtures**: Use pytest fixtures for common test data

   ```python
   @pytest.fixture
   def sample_colony() -> Colony:
       return Colony(name="Test Colony", colony_type="forge_world", base_size=5)
   ```

4. **Assertions**: Be specific in assertions

---

## Pull Request Process

### Before Submitting

1. **Update documentation** if you've changed functionality
2. **Add tests** for new features or bug fixes
3. **Run all tests** and ensure they pass
4. **Run linters** and fix any issues
5. **Update CHANGELOG.md** if applicable (for user-facing changes)

### PR Template

When creating a pull request, please include:

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] I have added tests that prove my fix/feature works
- [ ] All tests pass locally
- [ ] I have run type checking (mypy)
- [ ] I have run the linter (ruff)

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have updated the documentation accordingly
- [ ] I have added appropriate comments to complex code
- [ ] My changes generate no new warnings
```

### Review Process

1. PRs require at least one approval from a maintainer
2. All CI checks must pass (tests, linting, type checking)
3. Address review feedback in a timely manner
4. Squash commits if requested by maintainers

---

## Documentation

### Documentation Structure

- **README.md**: Project overview, quick start, and high-level documentation
- **docs/**: Detailed documentation
  - `api_reference.md`: Complete API reference
  - `architecture.md`: System architecture
  - `business_analysis.md`: Domain rules and game mechanics
  - `DEPLOYMENT_CHECKLIST.md`: Deployment instructions
  - `SECURITY_CONFIGURATION.md`: Security policies

### Writing Documentation

1. **Clarity**: Write for your audience (users vs. developers)
2. **Examples**: Include code examples where helpful
3. **Formatting**: Use Markdown consistently
4. **Diagrams**: Use Mermaid for architecture diagrams (renders in GitHub)

---

## Reporting Issues

### Bug Reports

When reporting a bug, please include:

1. **Description**: Clear and concise description of the bug
2. **To Reproduce**: Steps to reproduce the behavior
3. **Expected behavior**: What you expected to happen
4. **Screenshots**: If applicable
5. **Environment**:
   - Python version
   - OS
   - Version of the project

### Feature Requests

When requesting a feature:

1. **Use case**: Describe the problem you're trying to solve
2. **Proposed solution**: How you think it should work
3. **Alternatives**: Any alternative solutions you've considered
4. **Additional context**: Any other relevant information

---

## Questions?

If you have questions before contributing:

1. Check existing [documentation](docs/)
2. Search existing [GitHub issues](https://github.com/yourusername/WH40k_Colony_Manager/issues)
3. Open a new issue with the "question" label

---

## Code of Conduct

Please note that this project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

---

**The Emperor Protects** 🦅

   ```python
   # Good
   assert colony.order == 0
   assert colony.profit_factor == 0

   # Avoid
   assert colony.profit_factor == expected  # Too vague
   ```

### Test Coverage Goals

- **Domain layer**: 95%+ coverage (critical business logic)
- **Application layer**: 85%+ coverage
- **Adapters**: 70%+ coverage (focus on happy paths and error handling)

### Running Tests

```bash
# Run all tests
uv run pytest -q

# Run with coverage report
uv run pytest --cov=colony_manager --cov-report=html

# Run specific test file
uv run pytest tests/domain/test_colony.py -v

# Run tests matching a pattern
uv run pytest -k "test_colony" -v
```

### Code Quality Tools

```bash
# Format code
uv run ruff format .

# Lint code
uv run ruff check .

# Type checking
uv run mypy src/colony_manager
```
