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

## Done

### TP-007-UX--all-tasks-date — completed 2026-06-01
**Show today's date next to the "All Tasks" heading.**
Added a date stamp (day of week + full date + browser IANA timezone) beside the heading in
`frontend/src/pages/TasksPage.tsx`, formatted via `Intl.DateTimeFormat` using the browser's
own locale and `resolvedOptions().timeZone`.
- Files: `frontend/src/pages/TasksPage.tsx`, `BACKLOG.md` (bite-size)

<!-- move completed task_ids here -->
