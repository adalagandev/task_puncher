# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Task Puncher helps a user pick **3 tasks to focus on each week**. Each task is broken into
**5–7 milestones** (each with a "relevance" note), and tasks are ranked by a computed
**priority score**. Python/FastAPI backend + React/TS/Vite/Tailwind frontend, SQLite storage.

Single-user today (no auth), but built to grow into multi-user — see the auth seam below.

## Commands

### Backend (`backend/`)
```bash
python -m venv .venv
.venv\Scripts\Activate.ps1            # PowerShell (this is a Windows repo)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000   # API + Swagger at /docs
.venv\Scripts\python -m pytest        # full test suite
.venv\Scripts\python -m pytest tests/test_weekly.py::test_fourth_selection_rejected   # single test
```
Tests run against an in-memory SQLite DB via a `client` fixture in `tests/conftest.py` that
overrides the `get_db` dependency — they never touch the real `task_puncher.db`.

### Frontend (`frontend/`)
```bash
npm install
npm run dev      # http://localhost:5173, proxies /api -> localhost:8000
npm run build    # tsc --noEmit type-check, then vite build
```
There is no separate lint step; `npm run build` is the type-check gate. Start the backend
before the frontend (the dev server proxies `/api`).

## Architecture

### The scoring model is the core abstraction
`priority_score = impact*w_impact + urgency*w_urgency − effort*w_effort` (inputs 1–5).
- Single source of truth: `backend/app/services/scoring.py` (`compute_priority`), a pure
  function reading weights from `backend/app/core/config.py`. Recomputed and **stored** on
  every task create/update in `api/routes/tasks.py` — the score is a column, not derived on
  read, so list ordering is a cheap `ORDER BY priority_score DESC`.
- The frontend mirrors the same formula in `frontend/src/types/index.ts` (`previewScore`,
  `WEIGHTS`) purely for the live preview in the create form. **If you change the weights in
  `config.py`, update `types/index.ts` to match** — they are intentionally duplicated, not
  shared.

### Domain invariants live in two places by design
- **5–7 milestones per task**: validated at creation by a Pydantic `field_validator` in
  `schemas/task.py` (returns 422), and re-checked on individual add/delete in
  `routes/milestones.py` (returns 409 when adding past 7 or deleting below 5).
- **Max 3 weekly selections**: enforced in `services/weekly.py:set_weekly_selection`
  (returns 409). Bounds come from `core/config.py` (`min_milestones`, `max_milestones`,
  `max_weekly_tasks`) — change limits there, not inline.

### The auth seam (how single-user becomes multi-user)
Every `Task` has an `owner_id` FK to `User`. All routes filter by the current user, but the
current user is resolved by `api/deps.py:get_current_user`, which today returns the one
seeded local user (`seed.py:ensure_default_user`, called on app startup in `main.py`'s
lifespan). Adding real auth means changing only `get_current_user` — routes already scope by
owner and don't assume a single user.

### Frontend state flow
`hooks/useTasks.ts` is the single data store: it loads all tasks once and exposes every
mutation (task CRUD, milestone toggle/add/delete, weekly select). Every mutation calls the
API then `refresh()` to reload — there is no optimistic update or client-side cache, so the
server is always the source of truth. The Week page does **not** fetch separately; it filters
`store.tasks` by `is_selected_this_week`. The backend's `/api/weekly` GET endpoint exists and
is tested but is not used by the current UI.

### API client error convention
`frontend/src/api/client.ts` unwraps FastAPI error bodies: it flattens Pydantic 422
`detail` arrays (`[{msg}]`) and passes through string `detail` (404/409) into a single
`ApiError.message`, which `useTasks` surfaces in the global error banner. Throw `HTTPException`
with a human-readable `detail` on the backend and it renders correctly in the UI.

## Conventions

- Timestamps are timezone-aware UTC (`datetime.now(timezone.utc)`).
- Models import each other via the `models/__init__.py` aggregator so SQLAlchemy metadata is
  fully populated; `init_db()` relies on this.
- This is a Windows repo — prefer PowerShell syntax in instructions and use
  `.venv\Scripts\...` paths.
