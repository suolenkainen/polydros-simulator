# CLAUDE.md: how coding agents work in this repo

This file is for any coding agent (Claude Code, Copilot, Codex and so on) that
changes code here. It covers **how to work**. For **what the repo is**, read
[README.md](README.md) and [ARCHITECTURE.md](ARCHITECTURE.md) first.

## The repo in one paragraph

Polydros is an economy simulator for a trading card game. A seeded Python
engine in `simulation/` runs agents with traits (Collector, Scavenger,
Competitor, Gambler) through ticks: they open boosters, play games, and buy and
sell cards on a market, and every tick produces events. `backend/main.py` is a
thin FastAPI layer that runs the engine and serves the results. `frontend/` is
a React + TypeScript app (Vite) that calls the backend and shows agents,
collections, events and price history. The card list comes from
`polydros_master_set_v1.xlsx`, exported to `simulation/data/cards.json`.

## Backlog and workflow

1. **The backlog is GitHub Issues** on `suolenkainen/polydros-simulator`.
   Check `gh issue list` before you start. Open an issue for new work, and for
   anything you notice but aren't fixing right now. A TODO comment nobody reads
   is not a backlog.
2. **Every issue gets its own branch.** Before you change anything for an
   issue, create a branch for it from an up-to-date `main`. Start the name with
   the issue number, then a few words in kebab-case, for example
   `12-collector-sells-duplicates`. Keep one issue per branch. If you find
   something else along the way, open a new issue for it and don't fold it into
   the current branch. Never commit straight to `main`.
3. **Commit and push only when the user asks.** Opening a PR makes the work
   public, so check first.
4. **Every change reaches `main` through a PR**, and CI
   ([ci.yml](.github/workflows/ci.yml)) has to pass. PRs are squash-merged, so
   the PR title becomes the commit subject. Put `Closes #N` in the PR body when
   it fixes an issue.
5. **Read your whole diff before you open a PR.** Go through `git diff main...`
   from start to finish, the way you'd review a colleague's work. Look for
   leftover debug code, dead branches, naming that doesn't match, and clumsy
   logic. Green tests don't replace reading the diff, and reading the diff
   doesn't replace tests. Do both. Part of that review is the docs: see step 6.
6. **Update the docs your change affects, in the same PR.** This is a normal
   part of every change, not a separate chore. If you add, rename, move or
   delete a file, endpoint, command, trait, event type or folder, or change
   what something does, find every doc that mentions it
   (`git grep -l <name> -- '*.md'`) and fix it. That includes the layout
   block, the tick order, the result shape, the API table and the "Known gaps"
   list in `ARCHITECTURE.md`. When you fix a known gap, remove it from that
   list. A PR that leaves a doc wrong isn't finished. If a doc was already
   wrong before your change and fixing it is out of scope, open an issue for
   it.
7. **Don't merge your own PRs.** Open the PR, wait for CI, then stop and tell
   the user what's in it: what changed, how you checked it, and anything you're
   unsure about. A person merges it, or tells you to. "Merge it" for one PR is
   not permission to merge the next one. The same goes for Dependabot PRs:
   review them and report, don't merge them.

### Commit messages

Write the subject as a plain instruction that says what behaviour changes, not
which file you touched. "Stop collectors from selling their last copy of a
card" is good. "Update trading.py" and "Cleanup" are not. In the body, explain
**why**: what was wrong, how you found out, and how you checked the fix
("Replayed the CI job in a python:3.11 container: 50 passed.").

## Writing style for everything you write

This covers docs, comments, commit messages, PR descriptions and issues.

- **Write the way a person talks.** Imagine explaining it to a colleague at the
  next desk. If you wouldn't say a sentence out loud, rewrite it.
- **Use short, plain sentences.** One idea per sentence. Use the ordinary word:
  "use", not "leverage"; "check", not "validate the integrity of"; "fix", not
  "remediate".
- **Say the concrete thing.** Name the file, the command, the number, what
  actually happened. "The isort hook pointed at a tag that no longer exists,
  so CI failed before pytest ran" beats "improved CI stability".
- **Skip AI-flavoured filler.** No "It's worth noting that", "This ensures a
  seamless", "robust", "comprehensive", "delve", "key insight", "In summary".
  Don't write "Not X, but Y" setups or tidy groups of three for the sake of
  rhythm. Don't pile adjectives on or promise more than the code does.
- **No emoji and no long dashes in new text.** Don't use the em dash or en
  dash. Use a full stop, a comma, a colon or brackets instead. Hyphens in words
  like `kebab-case` are fine. The existing docs use emoji headings; leave those
  alone unless you're rewriting that section anyway.
- **Keep it short.** Say it once, where it belongs. Only use a bullet list when
  the items really are a list.

## Architecture rules (don't break these)

### Two packages during the redesign

The simulator is being rebuilt in a new package, `polydros/`, one milestone at
a time ([docs/design.md](docs/design.md)). The old `simulation/` package keeps
working until a milestone replaces it, then it's deleted.

- **New work goes in `polydros/`.** Don't add features to `simulation/`, and
  don't refactor it. Fix it only if it's broken in a way that blocks
  something, and say so.
- **`polydros/` never imports from `simulation/`.** If you need something from
  the old code, port it and test it.
- **Each part of `polydros/` owns one thing** (see the parts table in
  design.md). Card definitions come only from `polydros.cards.load_cards()`.
  Combat doesn't know about prices, pricing doesn't play games, and the
  frontend never calculates simulation results.
- **The card file is checked when it loads.** `polydros/data/cards.json` is
  the one card list; the backend and frontend both get cards from it. If you
  add a field, add it to the checks in `polydros/cards.py` too, with a test.
- **Card pictures aren't in git.** They're in `images/` at the repo root
  (gitignored, about 340 MB), served by `polydros/api.py`, which also makes
  and caches thumbnails in `images/thumbs/`.

### The old `simulation/` package

- **The simulation is deterministic.** The same `SimulationConfig` and seed
  must give the same result every time. All randomness goes through a
  `random.Random` that is seeded from the config (the engine's `rng`, or an
  agent's own `rng_seed`). Never call module-level `random.*`, and never let
  wall-clock time, dict or set ordering you don't control, or anything else
  outside the config affect the outcome. `test_determinism.py` guards this;
  if you add a new source of randomness, make sure it's covered.
- **Imports go one way.** `backend/` imports from `simulation/`. `simulation/`
  never imports from `backend/` and doesn't know about FastAPI or HTTP. Keep
  game and economy logic in `simulation/`; the backend only turns requests into
  engine calls and results into JSON.
- **The frontend only talks to the backend over HTTP** (`frontend/src/api.ts`).
  If you change an endpoint or the shape of its JSON, update `api.ts`, the
  components that use it, and the tests on both sides in the same PR.
- **Prism can't go negative.** Agents never spend money they don't have.
  `test_prism_negative.py` checks this. Keep that true for any new way of
  spending or trading.
- **Don't run the card export script yet.** `scripts/export_cards_from_excel.py`
  writes `simulation/data/cards.json`, but that file has since gained fields
  the script doesn't write (`flavor_text`, the Alternate Art rarity), so
  running it would wipe them (#33). Card data changes go into
  `polydros/data/cards.json` directly, and only when the user asks.
  `simulation/data/cards.json` stays as it is until `simulation/` is deleted.

## Testing

```
pip install -r requirements-dev.txt
pytest -q                                          # runs in CI
cd frontend; npx vitest run                        # unit tests, not in CI yet
cd frontend; npm run test:e2e                      # Playwright, not in CI yet
```

- The Python tests live in `simulation/tests/`. `pytest.ini` sets
  `pythonpath = .`, so plain `pytest` works from the repo root. Don't remove
  that line; CI can't import `simulation` without it.
- CI runs the Python tests on Linux with Python 3.11, and only builds the
  frontend. Vitest and Playwright don't run in CI, so run them yourself before
  a PR that touches `frontend/` and say which ones you ran.
- Playwright starts the backend (port 8420) and Vite (port 5420) itself, or
  reuses servers that are already running. If a stale server is up, tests can
  pass or fail against old code.
- **Tests check behaviour that matters, not coverage.** A good test says
  something about the simulation: the same seed gives the same result, money
  never goes negative, a strong card group really wins more. Don't write tests
  just to touch lines. New behaviour gets a test. A bug fix gets a test that
  fails without the fix.
- Tests use a fixed seed and must give the same result every time. Don't write
  tests that only pass "usually".
- Tests only prove what they check. If your change affects what the user sees,
  run the app (`run_all.ps1`, or backend and frontend by hand) and look. If you
  couldn't, say so.
- When a CI failure doesn't reproduce locally, replay the job in a clean
  container instead of guessing: clone the repo and run the steps from
  `ci.yml` in `python:3.11`. Docker Desktop is available on this machine.

### Lint and format

`ruff` is the only Python tool: `ruff check .` lints and `ruff format .`
formats, both configured in `pyproject.toml`. CI doesn't run it, because the
current code has lint errors and is going to be rewritten (#39). New code
should be clean with both. Don't reformat files you aren't otherwise changing.

**Keep the tooling small.** Don't add linters, type checkers, coverage
services or pre-commit hooks without asking first. A tool earns its place by
catching real problems; this repo once had six of them, and none noticed that
the simulation didn't work.

## Dependencies, config and secrets

- **When you install a package, add it to the right manifest in the same
  change**. Python packages the app needs at run time go in
  `requirements.txt`; test, lint and script tools go in `requirements-dev.txt`.
  Frontend packages go in `frontend/package.json`. Give Python packages a
  sensible minimum version.
- **Don't add a dependency nothing uses.** `numpy`, `pandas`, `coverage` and
  `safety` were once listed without anything importing or running them. Before
  adding a package, check that the code you're writing actually needs it.
- Some packages have to move together. `react` and `react-dom` must be the same
  version, and so must `vitest` and `@vitest/ui`. Don't merge one without the
  other.
- There are no secrets in this project today. If one shows up, it goes in
  `.env` (gitignored), never in code, tests or commit messages.

## Don't commit generated output

`__pycache__/`, `.pytest_cache/`, `node_modules/`, `frontend/dist/` and
`frontend/test-results/` can all be regenerated. `frontend/test-results/` is
tracked in git by mistake (#11); don't add to it. Check `git status` for stray files before
every commit.

## Code style

- Python 3.11 in CI (3.13 on this machine), 4-space indents, line length 88.
  Use type hints where they help a reader. Don't use syntax newer than 3.11.
- TypeScript in `frontend/` with 2-space indents.
- Match the code around you: its naming, its habits and how much it comments.
- Comments explain **why**: a game rule, a constraint, something that broke
  before, a trade-off made on purpose. Numbers that tune the economy (starting
  Prism, the 60-card collector threshold, 1% quality loss per play and so on)
  are design decisions. Don't change them as a side effect of other work; if
  one looks wrong, ask or open an issue.

## Windows notes

- The main shell is PowerShell 5.1, which has no `&&`. Use
  `; if ($?) { ... }`. Git Bash is also available.
- `> nul` in the wrong shell creates a real file called `nul` that git can't
  delete. Use `$null` in PowerShell and `/dev/null` in bash.
- Files in the repo use CRLF line endings on this machine. Warnings like
  `LF will be replaced by CRLF` are expected and harmless. When you edit a file
  with a shell tool, keep its existing line endings.
- `scripts/export_cards_from_excel.py` fails with `PermissionError` if the
  spreadsheet is open in Excel or OneDrive is syncing it.
