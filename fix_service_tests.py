"""Fix test_development_plan_service.py tests."""

with open(r'tests\application\services\test_development_plan_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove test_update_plan_progress method
import re
content = re.sub(
    r'\n    def test_update_plan_progress\(self, tmp_path\):.*?(?=\n    def test_update_plan_status)',
    '',
    content,
    flags=re.DOTALL
)

# Rename and fix test_update_plan_status_to_completed_sets_timestamp
content = content.replace(
    'def test_update_plan_status_to_completed_sets_timestamp(self, tmp_path):',
    'def test_update_plan_status_to_delivered(self, tmp_path):'
)
content = content.replace(
    '"""Test that setting status to COMPLETED sets completed_at."""',
    '"""Test that status can be updated to DELIVERED following valid transitions."""'
)

# Fix the status transition test - need to go through IN_PROGRESS and ACQUIRED first
old_status_test = '''        # completed_at field removed
        
        updated = service.update_plan(
            plan.id,
            status=DevelopmentPlanStatus.DELIVERED,
            changed_by=50,
        )
        
        assert updated.status == DevelopmentPlanStatus.DELIVERED
        # completed_at field removed'''

new_status_test = '''        # Transition: PLANNED -> IN_PROGRESS -> ACQUIRED -> DELIVERED
        updated = service.update_plan(
            plan.id,
            status=DevelopmentPlanStatus.IN_PROGRESS,
            changed_by=50,
        )
        assert updated.status == DevelopmentPlanStatus.IN_PROGRESS
        
        updated = service.update_plan(
            plan.id,
            status=DevelopmentPlanStatus.ACQUIRED,
            changed_by=50,
        )
        assert updated.status == DevelopmentPlanStatus.ACQUIRED
        
        updated = service.update_plan(
            plan.id,
            status=DevelopmentPlanStatus.DELIVERED,
            changed_by=50,
        )
        assert updated.status == DevelopmentPlanStatus.DELIVERED'''

content = content.replace(old_status_test, new_status_test)

# Fix test_update_plan_multiple_fields - remove progress
content = content.replace(
    '''            description="New description.",
            progress=75,
            changed_by=50,''',
    '''            description="New description.",
            changed_by=50,'''
)

content = content.replace(
    '''        assert updated.description == "New description."
        assert updated.progress == 75''',
    '''        assert updated.description == "New description."'''
)

with open(r'tests\application\services\test_development_plan_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed test_development_plan_service.py')