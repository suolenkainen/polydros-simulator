import importlib, inspect
m = importlib.import_module('simulation.tests.test_api')
print([n for n,obj in inspect.getmembers(m) if n.startswith('test')])
