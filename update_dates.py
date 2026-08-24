import re

files_to_update = [
    'd:/Projekty/WH40k_Colony_Manager/DECISIONS_AND_QUESTIONS.md',
    'd:/Projekty/WH40k_Colony_Manager/TESTING_TODO.md',
    'd:/Projekty/WH40k_Colony_Manager/BACKEND_TODO.md'
]

for filepath in files_to_update:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r'Last Updated:\s*2026-08-22', 'Last Updated: 2026-08-24', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'Updated {filepath}')

print('Done!')