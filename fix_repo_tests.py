"""Fix test_development_plan_repository.py tests."""

with open(r'tests\adapters\persistence\test_development_plan_repository.py', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Remove test_update_progress method
content = re.sub(
    r'\n    def test_update_progress\(self, tmp_path\):.*?(?=\n    def test_update_status)',
    '',
    content,
    flags=re.DOTALL
)

# Remove test_update_completed_at method
content = re.sub(
    r'\n    def test_update_completed_at\(self, tmp_path\):.*?(?=\n    def test_update_nonexistent)',
    '',
    content,
    flags=re.DOTALL
)

# Replace COMPLETED with DELIVERED
content = content.replace('DevelopmentPlanStatus.COMPLETED', 'DevelopmentPlanStatus.DELIVERED')
content = content.replace('Status.COMPLETED', 'Status.DELIVERED')

# Remove progress field from test_create_plan_with_all_fields
content = content.replace('            progress=0,\n', '')

# Remove acquisition_plan assertions
content = re.sub(r'        assert.*acquisition_plan.*\n', '', content)

with open(r'tests\adapters\persistence\test_development_plan_repository.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed test_development_plan_repository.py')