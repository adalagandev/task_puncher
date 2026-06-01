# Backlog

Queued tasks, following the `TP-{n}-{EPIC}--{feature-name}` convention
(`whats_up_claude.md`). Each gets its own branch + PR when picked up.

## Open

### TP-005-ux--milestone-label-toggle
**Clicking a milestone's label text should toggle its checkbox.**
Today only the checkbox itself is clickable (`frontend/src/components/MilestoneList.tsx`).
Make the title (and ideally the whole row) a click target that toggles `done` — e.g. wrap
the checkbox + text in a `<label>`, or associate the input via `id`/`htmlFor`. Keep the
existing `onToggle(m.id, !m.done)` flow.
- Files: `frontend/src/components/MilestoneList.tsx` (1, bite-size)
- Type: UX/behavior change (not part of the visual-only redesign)

### TP-006-ux--backend-unreachable-state
**Show a clear "can't reach the server" state instead of a raw proxy/500 error.**
When an `/api` call fails because the backend is unreachable (Vite proxy `ECONNREFUSED`, or
a 5xx), surface a friendly message — e.g. *"Can't reach the server — is the backend running?
[Retry]"* — rather than the cryptic error that currently lands in the banner. Also harden
`dev.ps1` to wait until `:8000` accepts connections before starting the frontend, closing the
startup race that causes this.
- Files: `frontend/src/api/client.ts` + `frontend/src/hooks/useTasks.ts` (error handling),
  `dev.ps1` (wait-for-backend). ~2–3 (bite-size)
- Type: UX/resilience. Prompted by a transient `ECONNREFUSED` proxy error during dev.

### TP-015-UX--newtask-form-restyle
**Make the New Task form match the dashboard look/feel.**
The create form (`frontend/src/components/TaskForm.tsx`) should share the fight-night
design language of the dashboard cards — borders, `shadow-punch`, display font headings,
uppercase labels, knockout/gold accents — instead of looking like a plain default form.
Visual-only; keep the existing `onSubmit`/`onCancel` flow and field set.
- Files: `frontend/src/components/TaskForm.tsx` (+ shared input styles if extracted). ~1–2 (bite-size)
- Type: UX/visual polish.

## EPIC: FOCUS — weekly focus view

Make the dashboard about **doing the 3 things that matter now**: show only the top 3
active tasks, let tasks complete (auto at 100% milestones **or** a manual toggle), and keep
*last week's* finished tasks visible as grayed-out, read-only trophies before they drop off.

Decisions locked in (2026-06-01):
- All Tasks page shows **only the top 3 active (not-completed) tasks** by priority.
- A task completes **automatically when all milestones are done**, and also via a **manual
  mark-complete / reopen** toggle (`status` = `completed` ↔ `active`).
- Completed tasks render **grayed-out + read-only**, shown only if completed during the
  **previous calendar week (Mon–Sun)**; older completions are hidden.
- **Open question:** what happens to a task completed in the *current* week? Per the rule
  above it is neither "active" (so it leaves the top-3) nor "previous week" (so it's hidden) —
  i.e. it disappears until it never reappears. Likely want "this week's completions stay
  visible too"; confirm before building TP-014.

### TP-010-FOCUS--completion-fields-backend
**Add completion state to the Task model + API.**
Add a `completed_at` (nullable, tz-aware UTC) column to `Task`; expose `status` and
`completed_at` in `TaskRead`. `status` already exists (`active` default) — this just makes
the timestamp + status visible to the frontend. Note: SQLite uses `create_all` (no
migrations), so the existing `task_puncher.db` needs the new column added manually or reseeded.
- Files: `backend/app/models/task.py`, `backend/app/schemas/task.py` (bite-size)
- Type: backend data model.

### TP-011-FOCUS--complete-and-reopen
**Transition tasks to/from completed.**
Auto-set `status=completed` + `completed_at=now` when the final milestone is toggled done
(and reopen — clear both — if a milestone is later unchecked) in `routes/milestones.py`.
Add a manual complete/reopen endpoint in `routes/tasks.py`. Keep the transition logic in a
small `services/completion.py` so both paths share one rule. Depends on TP-010.
- Files: `backend/app/services/completion.py` (new), `backend/app/api/routes/milestones.py`,
  `backend/app/api/routes/tasks.py`. ~3 (bite-size). Add tests in a follow-up if it grows.
- Type: backend behavior.

### TP-012-FOCUS--top-3-active-list
**All Tasks page shows only the top 3 active tasks.**
Filter `store.tasks` to `status !== "completed"`, keep the existing score sort, and slice to
3 in `frontend/src/pages/TasksPage.tsx`. Adjust the empty/heading copy to reflect "your 3".
- Files: `frontend/src/pages/TasksPage.tsx` (bite-size)
- Type: frontend. Depends on TP-010 (needs `status` in the payload).

### TP-013-FOCUS--completed-card-readonly
**Render completed tasks grayed-out and read-only, with a complete/reopen control.**
When `status === "completed"`, mute the `TaskCard` (grayscale/opacity), disable the
milestone toggles, "Add to Week", and delete actions, and swap in a "Reopen" control; add a
"Mark complete" action on active cards. Wires to the TP-011 endpoint.
- Files: `frontend/src/components/TaskCard.tsx`, `frontend/src/components/MilestoneList.tsx`,
  `frontend/src/hooks/useTasks.ts` (complete/reopen mutation). ~3 (bite-size).
- Type: frontend. Depends on TP-011.

### TP-014-FOCUS--last-week-wins
**Show last week's completed tasks (grayed) below the active 3; hide older.**
Below the top-3 active list, render completed tasks whose `completed_at` falls in the
**previous calendar week (Mon–Sun)** in the browser's timezone; hide everything older.
Needs a small local-time week-range helper. Resolve the current-week open question first.
- Files: `frontend/src/pages/TasksPage.tsx`, `frontend/src/lib/week.ts` (new helper). ~2 (bite-size).
- Type: frontend. Depends on TP-010 + TP-012.

## Done

### TP-008-UX--date-stamp — completed 2026-06-01
**Make the "All Tasks" date stamp bigger, then matched to the heading style.**
First sized it to the heading as a loud gold badge, then (on feedback) toned it down to the
heading's own display font/size/uppercase, just muted (`text-ink/50`), in
`frontend/src/pages/TasksPage.tsx`. Builds on TP-007. PR #6.
- Files: `frontend/src/pages/TasksPage.tsx` (bite-size)

### TP-009-DATA--mock-seed — completed 2026-06-01
**Seed the database with mock tasks for local development / demos.**
Added `backend/app/seed_mock.py` (`python -m app.seed_mock`, `--force`/`--reset`): 8 tasks
with random impact/effort/urgency (1–5), stored `priority_score` via `services/scoring.py`,
and a random valid 5–7 milestones each. PR #7.
- Files: `backend/app/seed_mock.py`, `BACKLOG.md` (bite-size)

### TP-007-UX--all-tasks-date — completed 2026-06-01
**Show today's date next to the "All Tasks" heading.**
Added a date stamp (day of week + full date + browser IANA timezone) beside the heading in
`frontend/src/pages/TasksPage.tsx`, formatted via `Intl.DateTimeFormat` using the browser's
own locale and `resolvedOptions().timeZone`.
- Files: `frontend/src/pages/TasksPage.tsx`, `BACKLOG.md` (bite-size)

<!-- move completed task_ids here -->
