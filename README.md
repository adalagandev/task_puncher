# 🥊 Task Puncher

Organize the priorities of your tasks so you can confidently pick **3 things to
accomplish every week**. Each task is broken into **5–7 milestones**, and each milestone
explains why it matters. Tasks are ranked by a computed **priority score**.

- **Backend:** Python · FastAPI · SQLAlchemy · SQLite
- **Frontend:** React · TypeScript · Vite · Tailwind CSS
- Single-user (no login) for now; the schema/code is structured so authentication can be
  added later without a rewrite.

## How prioritization works

```
priority_score = impact × 2 + urgency × 2 − effort × 1
```

Each of `impact`, `urgency`, `effort` is rated 1–5. Effort lowers priority (prefer cheaper
wins) but is weighted less, so a hard-but-critical task still outranks an easy-but-pointless
one. Scores range from −1 to 19. Weights live in `backend/app/core/config.py` and are
tunable without touching logic.

## Project layout

```
task_puncher/
├── backend/    FastAPI app, SQLite DB, pytest suite
└── frontend/   Vite + React + TS + Tailwind
```

## Running it

You need **Python 3.10+** and **Node 18+**. Run the two halves in separate terminals.

### Backend  → http://localhost:8000  (API docs at /docs)

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The SQLite database (`task_puncher.db`) and a default local user are created automatically
on first start.

### Frontend  → http://localhost:5173

```bash
cd frontend
npm install
npm run dev
```

The dev server proxies `/api` to the backend on port 8000, so start the backend first.

## Tests

```bash
cd backend
.venv\Scripts\python -m pytest        # Windows
# .venv/bin/python -m pytest          # macOS/Linux
```

Covers the scoring math, the 5–7 milestone rule, and the 3-per-week cap.

## Using the app

1. **All tasks** — create a task, rate its impact/effort/urgency (watch the live score
   preview), and add 5–7 milestones each with a relevance note. Tasks list highest-score
   first.
2. **Add to week** — pick up to 3 tasks for the week (the 4th is blocked until you free a
   slot).
3. **This week** — your 3 focus tasks, ranked. Expand a task to check off milestones and
   watch its progress bar fill.

## Roadmap (not in this MVP)

- Authentication / multiple users (the `owner_id` seam is already in place)
- A true weekly cycle: review, carry-over, and history across weeks
- Dashboards and completion stats
