import colony_manager.adapters.api.dependencies as deps
print('Before patch:', deps.get_db_path)
print('Before result:', deps.get_db_path())
deps.get_db_path = lambda: 'test'
print('After patch:', deps.get_db_path)
print('After result:', deps.get_db_path())