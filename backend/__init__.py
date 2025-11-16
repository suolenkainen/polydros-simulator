"""Backend package initializer to make `backend` a proper package for tools.

This empty file prevents import/mypy ambiguities where the same file can be
loaded as both `main` and `backend.main` depending on how mypy or python is
invoked. Adding this file makes the package explicit.
"""
