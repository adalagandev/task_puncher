# Task Puncher — Build Plan

## Context

An app that helps **anyone accomplish 3 things every week** by organizing the priorities
of a set of tasks. Each task is broken into **5–7 milestones**, and each milestone explains
its **relevance to the task**. The app ranks tasks by a computed priority score so the user
can confidently pick the 3 to focus on each week.

Stack: **Python/FastAPI backend, React frontend.**

### Decisions locked in

| Topic | Decision |
|---|---|
| Milestones | **Manual entry** by the user (no AI generation) |
| Prioritization | **Scored** — impact / effort / urgency, computed server-side |
| Scoring formula | **Weighted-difference** (additive), defaults below |
| Users / auth | **Single-user now**, schema/code structured so auth drops in later |
| Scope | **Lean MVP** — CRUD tasks + milestones, pick 3 per week, track progress |
| Backend DB/ORM | **Sync SQLAlchemy + SQLite** |
| Frontend styling | **Tailwind CSS** (Vite + React + TypeScript) |

## Scoring formula (the heart of the app)

```
priority_score = (impact × w_i) + (urgency × w_u) − (effort × w_e)
```

- Inputs `impact`, `urgency`, `effort` each rated **1–5**.
- Weights in config: **w_i = 2, w_u = 2, w_e = 1**.
- Effort is the only subtracted term (prefer cheaper wins) and weighted half as much, so
  a hard-but-critical task still outranks an easy-but-pointless one.
- Score range with defaults: **−1 (worst) to 19 (best)**; tasks listed highest-first.
- Computed and stored server-side in `services/scoring.py` on every task create/update.

## Data model

- **User** — `id`, `name`. Seeded with one default local user. The multi-user seam.
- **Task** — `id`, `owner_id` (FK→User), `title`, `description`, `impact`, `effort`,
  `urgency` (1–5), `priority_score` (computed), `is_selected_this_week` (bool),
  `selected_at`, `status`, timestamps.
- **Milestone** — `id`, `task_id` (FK→Task), `order`, `title`, `relevance` (text),
  `done` (bool).

### Invariants enforced server-side
- A task must have **5–7 milestones**.
- At most **3 tasks** may have `is_selected_this_week = true` at once.

## Project structure

```
task_puncher/
├── PLAN.md
├── README.md
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/{config.py, db.py}
│   │   ├── models/{user.py, task.py, milestone.py}
│   │   ├── schemas/{task.py, milestone.py}
│   │   ├── services/{scoring.py, weekly.py}
│   │   ├── api/{deps.py, routes/{tasks.py, milestones.py, weekly.py}}
│   │   └── seed.py
│   ├── tests/
│   └── requirements.txt
└── frontend/
    ├── src/{api/, types/, hooks/, components/, pages/}
    ├── tailwind.config.js
    ├── vite.config.ts
    └── package.json
```

## Build steps

- **Phase 0** — Copy plan into PLAN.md.
- **Phase 1** — FastAPI + SQLite + sync SQLAlchemy, config w/ weights, ORM models, seed,
  Pydantic schemas w/ 5–7 milestone validation.
- **Phase 2** — scoring.py, task CRUD (sorted by score), milestone CRUD, weekly routes
  (max 3 cap), pytest.
- **Phase 3** — Vite + React + TS + Tailwind, typed API client, Tasks page, Week page.
- **Phase 4** — empty/loading/error states, styling, README.

## Verification

- `cd backend && pytest` — scoring math, 5–7 rule, 3-per-week cap.
- `uvicorn app.main:app --reload` + `/docs` for manual API checks.
- `cd frontend && npm run dev` — create tasks, confirm sort, milestones, week cap, progress.

---

# Task tracker

This is the single source of truth for tasks (per `whats_up_claude.md` rules 8–10).
All work is broken into `TP-{n}-{EPIC}--{feature-name}` tickets, one branch + PR each.
Status: ✅ merged · 🔫 in progress · ⬜ queued. Merged tickets carry their PR link.

## MVP — initial build (pre-ticket)
The Phase 1–4 build above shipped before the ticket convention existed; recorded here as
the baseline the tickets build on.
- ✅ Backend — FastAPI + SQLite + sync SQLAlchemy, scoring, task/milestone CRUD, weekly cap, pytest.
- ✅ Frontend — Vite/React/TS/Tailwind, typed API client, Tasks + Week pages.

## EPIC: REDESIGN — fight-night visual overhaul
- ✅ **TP-001-redesign--design-system** — design tokens, fonts, textured background — [PR #1] — 2026-05-31
- ✅ **TP-002-redesign--task-card** — score-as-hero card + milestone "rounds" — [PR #2] — 2026-05-31
- ✅ **TP-003-redesign--app-shell-and-pages** — header, tabs, pages; added backlog + rewrote/renamed the rules doc — [PR #3], [PR #4] — 2026-06-01

## EPIC: UX — incremental polish
- ✅ **TP-007-UX--all-tasks-date** — today's date next to the "All Tasks" heading (day + full date + browser timezone via `Intl.DateTimeFormat`) — [PR #5] — 2026-06-01
- ✅ **TP-008-UX--date-stamp** — sized the date stamp to the heading, then toned it to the heading's own display font/size/uppercase, muted (`text-ink/50`) — [PR #6] — 2026-06-01
- ⬜ **TP-005-UX--milestone-label-toggle** — clicking a milestone's label text (not just the checkbox) toggles `done`; wrap input + text in a `<label>` or wire `id`/`htmlFor`, keep the `onToggle(m.id, !m.done)` flow.
  - Files: `frontend/src/components/MilestoneList.tsx` (1, bite-size)
- ⬜ **TP-006-UX--backend-unreachable-state** — show a friendly "can't reach the server — is the backend running? [Retry]" state instead of the raw Vite `ECONNREFUSED`/5xx error; also harden `dev.ps1` to wait for `:8000` before starting the frontend.
  - Files: `frontend/src/api/client.ts`, `frontend/src/hooks/useTasks.ts`, `dev.ps1` (~2–3, bite-size)
- ⬜ **TP-015-UX--newtask-form-restyle** — make the New Task form share the dashboard's fight-night language (borders, `shadow-punch`, display headings, uppercase labels, knockout/gold accents); visual-only, keep the `onSubmit`/`onCancel` flow + field set.
  - Files: `frontend/src/components/TaskForm.tsx` (+ shared input styles if extracted) (~1–2, bite-size)

## EPIC: DATA
- ✅ **TP-009-DATA--mock-seed** — `backend/app/seed_mock.py` (`python -m app.seed_mock`, `--force`/`--reset`): 8 tasks with random impact/effort/urgency, stored `priority_score`, random valid 5–7 milestones each — [PR #7] — 2026-06-01

## EPIC: DEVX — developer experience / tooling
- 🔫 **TP-017-DEVX--local-pr-review-hook** — auto-run the `code-reviewer` on every PR opened with `gh pr create` *inside a Claude Code session*, locally (no Anthropic key in GitHub). A `PostToolUse(Bash)` hook detects the command and spawns a detached worker that builds the diff, runs a local headless `claude -p` with the committed reviewer rubric, and posts the result via `gh pr comment`. In-session only by design — PRs from other terminals or github.com won't trigger it. Takes effect after a session restart (hooks load at startup).
  - Files: `.claude/hooks/pr-review.ps1` (new), `.claude/settings.json`, `.gitignore`, `PLAN.md` (big bite, 4 — cohesive feature)

## EPIC: FOCUS — weekly focus view
Make the dashboard about **doing the 3 things that matter now**: show only the top 3 active
tasks, let tasks complete (auto at 100% milestones **or** a manual toggle), and keep *last
week's* finished tasks visible as grayed-out, read-only trophies before they drop off.

Decisions locked in (2026-06-01):
- All Tasks page shows **only the top 3 active (not-completed) tasks** by priority.
- A task completes **automatically when all milestones are done**, and also via a **manual
  mark-complete / reopen** toggle (`status` = `completed` ↔ `active`).
- Completed tasks render **grayed-out + read-only**, shown only if completed during the
  **previous calendar week (Mon–Sun)**; older completions are hidden.
- **Open question (resolve before TP-014):** what happens to a task completed in the *current*
  week? Per the rule above it's neither "active" (leaves the top-3) nor "previous week"
  (hidden) — i.e. it vanishes immediately. Likely want "this week's completions stay visible
  too"; confirm.

- ⬜ **TP-010-FOCUS--completion-fields-backend** — add a `completed_at` (nullable, tz-aware UTC) column to `Task`; expose `status` + `completed_at` in `TaskRead`. SQLite uses `create_all` (no migrations), so the existing `task_puncher.db` needs the column added manually or reseeded.
  - Files: `backend/app/models/task.py`, `backend/app/schemas/task.py` (bite-size)
- ⬜ **TP-011-FOCUS--complete-and-reopen** — auto-set `status=completed`+`completed_at=now` when the last milestone is toggled done (reopen/clear if later unchecked) in `routes/milestones.py`; add a manual complete/reopen endpoint in `routes/tasks.py`; share the rule in a new `services/completion.py`. Depends on TP-010.
  - Files: `backend/app/services/completion.py` (new), `backend/app/api/routes/milestones.py`, `backend/app/api/routes/tasks.py` (~3, bite-size)
- ⬜ **TP-012-FOCUS--top-3-active-list** — All Tasks page filters to `status !== "completed"`, keeps the score sort, slices to 3; adjust empty/heading copy. Depends on TP-010.
  - Files: `frontend/src/pages/TasksPage.tsx` (bite-size)
- ⬜ **TP-013-FOCUS--completed-card-readonly** — when `status === "completed"`, mute the `TaskCard` (grayscale/opacity), disable milestone toggles + "Add to Week" + delete, swap in "Reopen"; add "Mark complete" on active cards. Depends on TP-011.
  - Files: `frontend/src/components/TaskCard.tsx`, `frontend/src/components/MilestoneList.tsx`, `frontend/src/hooks/useTasks.ts` (~3, bite-size)
- ⬜ **TP-014-FOCUS--last-week-wins** — below the active 3, render completed tasks whose `completed_at` falls in the **previous calendar week (Mon–Sun)** in the browser timezone; hide older. Needs a local-time week-range helper. Resolve the open question first. Depends on TP-010 + TP-012.
  - Files: `frontend/src/pages/TasksPage.tsx`, `frontend/src/lib/week.ts` (new) (~2, bite-size)

## Session log
Where I left off (rule 9), newest first.
- **2026-06-01** — Consolidated all task tracking into this file and retired `BACKLOG.md`
  (it had become the de-facto tracker, conflicting with rules 8–10). Shipped TP-007/008/009.
  **Next:** FOCUS epic, starting with TP-010; the current-week-completion open question is
  still unresolved and gates TP-014.

[PR #1]: https://github.com/adalagandev/task_puncher/pull/1
[PR #2]: https://github.com/adalagandev/task_puncher/pull/2
[PR #3]: https://github.com/adalagandev/task_puncher/pull/3
[PR #4]: https://github.com/adalagandev/task_puncher/pull/4
[PR #5]: https://github.com/adalagandev/task_puncher/pull/5
[PR #6]: https://github.com/adalagandev/task_puncher/pull/6
[PR #7]: https://github.com/adalagandev/task_puncher/pull/7
