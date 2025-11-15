# Code review checklist and per-file guidance

This document describes an approachable, reproducible code-review process for the Polydros project and gives file-type specific checks you can use when reviewing changes.

Goals
- Keep the repo healthy and reviewable.
- Catch correctness, performance, determinism, and style issues early.
- Make reviews quick and repeatable using automated checks.

How to run automated checks locally
- Install dev deps:

```cmd
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
pre-commit install
```

- Run linters and type checks:

```cmd
ruff check .
black --check .
mypy .
```

- Run tests and coverage:

```cmd
pytest --cov=simulation --cov=backend
```

Per-file review checklist (quick):
- `simulation/` (core algorithm files)
  - Determinism: All sources of randomness should use the passed RNG (e.g. `random.Random(seed)`). No global `random` calls.
  - Correctness: verify invariants (no negative counts, pack sizes, prism balances).
  - Tests: every new behavior has a unit test with edge cases.
  - Performance: avoid O(n^2) in tight loops; prefer list comprehensions and local variables for heavy loops.

- `backend/` (FastAPI)
  - Input validation: ensure Pydantic models validate and return helpful error messages.
  - Side effects: avoid global mutable state for production; `LAST_RUN` is fine for dev but note in review comments.
  - APIs: OpenAPI docs should match responses; add tests for status codes and error cases.

- `frontend/` (React + TS)
  - Determinism: E2E tests should seed the backend to produce deterministic results.
  - Tests: unit tests for components, e2e for flows, MSW for mocking.
  - Accessibility: use semantic HTML and check with axe.

- Tests
  - Coverage: tests should include happy path + at least one edge case.
  - Speed: keep unit tests small and fast; use mocks for network.
  - Flaky tests: mark or quarantine until fixed.

- Docs
  - Readme updated: setup steps, how to run tests and linters, CI expectations and common gotchas.
  - CODE_REVIEW.md: link to tests needed for PR.

Review process for each PR
1. Run CI and address failures.
2. Pull the branch locally and run linters/tests.
3. Run targeted tests mentioned in the PR (or all tests if small).
4. Verify files changed follow the per-file checklist and include tests.
5. Approve or request changes with clear, actionable comments.

Template reviewer notes (copy into review comments):
- Did the author add tests for new functionality? (yes/no)
- Is the change safe for determinism and reproducibility? (yes/no)
- Are there obvious performance regressions? (yes/no)
- Are there style or typing issues that can be automated by running pre-commit / mypy? (list)

Appendix: Useful commands
- Format files: `black .`
- Fix ruff issues where possible: `ruff format .` and `ruff check --fix .`
- Run full test suite: `pytest -q`
- Show coverage: `pytest --cov=simulation --cov=backend --cov-report=term`
