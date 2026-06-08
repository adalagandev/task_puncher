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
- ✅ **TP-018-UX--all-tasks-emoji** — decorative `aria-hidden` smiley before the "All Tasks" heading (ASCII `&#x1F60A;` entity to avoid mojibake) — [PR #11] — 2026-06-01
- ✅ **TP-005-UX--milestone-label-toggle** — the milestone title is now a `<label htmlFor>` for the checkbox, so clicking the text toggles `done` (cursor-pointer to signal it). Used `id`/`htmlFor` rather than wrapping to keep the layout; a `<label>` won't fire for a disabled input, so read-only completed tasks stay locked with no extra guard. Existing `onChange → onToggle` flow unchanged. — 2026-06-06
  - Files: `frontend/src/components/MilestoneList.tsx` (bite-size)
- ✅ **TP-006-UX--backend-unreachable-state** — `client.ts` now throws a distinct `NetworkError` when the API is unreachable (fetch rejects, or the Vite proxy returns a non-JSON 5xx for a dead backend); `useTasks` tracks an `unreachable` flag (set on `NetworkError`, cleared on any success); `App.tsx` swaps in a friendly "🔌 Can't reach the server — is the backend running on :8000? [Retry]" panel (suppressing the red error banner) with a Retry that re-runs `refresh()`. Also hardened `dev.ps1` to wait for `:8000` (TCP probe, 30s) before starting the frontend. **Big bite (4 files)** — flagged; one cohesive change. Build + PS parse clean. — 2026-06-06
  - Files: `frontend/src/api/client.ts`, `frontend/src/hooks/useTasks.ts`, `frontend/src/App.tsx`, `dev.ps1`
- ✅ **TP-015-UX--newtask-form-restyle** — restyled the New Task form (and its `ScoreInputs`, which shared the old slate/indigo palette) into the fight-night language: `border-2 border-ink` / `bg-canvas` / `shadow-punch` card, `font-display` uppercase heading + `eyebrow`, uppercase tracked labels, `bg-bone` inputs that focus to `border-ink`, knockout submit with the punch shadow, and a gold-less ink scorecard chip for the live priority preview. Visual-only — `onSubmit`/`onCancel`/field set and all state logic unchanged; CSS shrank as the old utilities purged. Build clean. — 2026-06-06
  - Files: `frontend/src/components/TaskForm.tsx`, `frontend/src/components/ScoreInputs.tsx` (bite-size)

## EPIC: DATA
- ✅ **TP-009-DATA--mock-seed** — `backend/app/seed_mock.py` (`python -m app.seed_mock`, `--force`/`--reset`): 8 tasks with random impact/effort/urgency, stored `priority_score`, random valid 5–7 milestones each — [PR #7] — 2026-06-01
- ✅ **TP-024-DATA--more-mock-seed** — expanded the mock title pool to 22 and added `--count N` (sample N random titles; bypasses the empty-DB guard). Ran `--count 10` to add 10 more active tasks (DB now 20). — 2026-06-01
  - Files: `backend/app/seed_mock.py` (bite-size)

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
- **Resolved (2026-06-01):** a task completed in the *current* week **stays visible** as a win.
  So the completed section shows both this-week and last-week (Mon–Sun) completions; older
  completions drop off. TP-014's range is "current week **or** previous week" in browser local time.

- ✅ **TP-010-FOCUS--completion-fields-backend** — added a `completed_at` (nullable, tz-aware UTC) column to `Task` and exposed it in `TaskOut` (`status` was already exposed). SQLite uses `create_all` (no migrations), so the existing `task_puncher.db` got the column via a non-destructive `ALTER TABLE`. — 2026-06-01
  - Files: `backend/app/models/task.py`, `backend/app/schemas/task.py` (bite-size)
- ✅ **TP-011-FOCUS--complete-and-reopen** — new `services/completion.py` (`set_completed` idempotently stamps/clears `completed_at`; `sync_completion_from_milestones` makes completion follow milestone state) wired into `routes/milestones.py` (add/update/delete auto-complete + reopen); added `POST /tasks/{id}/complete` + `/reopen` in `routes/tasks.py`; `tests/test_completion.py` covers auto + manual paths. 20 tests pass. — 2026-06-01
  - Files: `backend/app/services/completion.py` (new), `backend/app/api/routes/milestones.py`, `backend/app/api/routes/tasks.py`, `backend/tests/test_completion.py` (new)
- ✅ **TP-012-FOCUS--top-3-active-list** — dashboard now shows only the top 3 active (`status !== "completed"`) tasks by score (`focusTasks`); heading renamed "All Tasks" → **"This Week's Card"** with sub-copy "Your 3 to focus on"; empty state distinguishes no-tasks-yet from all-active-done. Depends on TP-010. — 2026-06-01
  - Files: `frontend/src/pages/TasksPage.tsx` (bite-size)
- ✅ **TP-013-FOCUS--completed-card-readonly** — completed `TaskCard` mutes (grayscale/opacity, no shadow, "🏆 Cleared" badge), milestones go read-only, Add-to-Week + Delete hidden, swapped for **↩ Reopen**; active cards gain **✓ Mark Complete**. Wired `/complete` + `/reopen` through the API client + `useTasks`. — 2026-06-01
  - Files: `frontend/src/components/TaskCard.tsx`, `frontend/src/components/MilestoneList.tsx`, `frontend/src/hooks/useTasks.ts`, `frontend/src/api/client.ts`, `frontend/src/pages/TasksPage.tsx`, `frontend/src/pages/WeekPage.tsx` (6 — big bite; the last 3 are wiring the new handlers/endpoint through)
- ✅ **TP-014-FOCUS--last-week-wins** — a "🏆 Recent Wins" trophy-shelf section below the focus 3 renders completed tasks whose `completed_at` falls in the **current or previous Mon–Sun week** (browser-local), newest first; older completions drop off. New `lib/week.ts` (`isInCurrentOrPreviousWeek`, Monday-based local weeks); also added `completed_at` to the frontend `Task` type (TP-010 was backend-only). Depends on TP-010 + TP-012. — 2026-06-01
  - Files: `frontend/src/pages/TasksPage.tsx`, `frontend/src/lib/week.ts` (new), `frontend/src/types/index.ts` (~3, bite-size)
- ✅ **TP-023-FOCUS--backlog-queue** — new `BacklogList.tsx` renders the active tasks beyond the focus 3 (ranks 4+) as slim read-only rows (rank · title · `done/total` milestones · score chip); "Show more tasks" grows the window in widening batches (5 → 15 → 30 → 50, then the rest), local UI state that resets on reload. Wired into `TasksPage` **between the focus 3 and the 🏆 Recent Wins shelf**. **Open questions resolved (2026-06-06):** (a) active-only, ranks 4+; (b) **above** the wins section; (c) title + score **+ milestone progress**; (d) **read-only**. Build/type-check clean. — 2026-06-06
  - Files: `frontend/src/components/BacklogList.tsx` (new), `frontend/src/pages/TasksPage.tsx` (bite-size)

## EPIC: FIX — regressions & maintenance
- ✅ **TP-022-FIX--weekly-count-excludes-completed** — **Product rule: completing a task frees its weekly slot.** `set_completed` now clears `is_selected_this_week`/`selected_at` on the active→completed transition, so a done task stops counting toward the 3-cap (covers both manual complete and milestone auto-complete; reopen leaves it deselected). Backend-only fix — the frontend `weeklyCount`/Week view already key off the same flag, so they self-correct on refresh. Added 3 tests (manual + auto-complete free the slot; completing one lets a 4th fit). — 2026-06-06
  - Files: `backend/app/services/completion.py`, `backend/tests/test_completion.py` (bite-size)
- ✅ **TP-025-FIX--naive-utc-timestamps** — fixed at serialization: a `field_serializer` on `TaskOut` (`completed_at`/`selected_at`/`created_at`/`updated_at`) stamps naive values as UTC and emits offset-bearing ISO, so the client's `new Date(iso)` parses the correct instant and `lib/week.ts` buckets correctly. Backend-only (frontend already does `new Date(iso)`); added a test asserting the timestamps serialize tz-aware. 25 tests pass. — 2026-06-06
  - Files: `backend/app/schemas/task.py`, `backend/tests/test_completion.py` (bite-size)
- ⬜ **TP-027-FIX--vite-proxy-ipv4** — set the Vite dev proxy target from `http://localhost:8000` to `http://127.0.0.1:8000` in `frontend/vite.config.ts`. **Why:** found during the 2026-06-06 live verification — on Node 24 the proxy resolves `localhost` to IPv6 `::1` first, but uvicorn binds IPv4 `127.0.0.1` only, so the proxy intermittently fails (`ECONNREFUSED`/`ETIMEDOUT`) and the app shows TP-006's "can't reach the server" panel **even when the backend is up** (`curl 127.0.0.1:8000` worked fine throughout). Pinning IPv4 on both ends removes the ambiguity. Optionally also bind the backend `--host 127.0.0.1` explicitly in `dev.ps1`.
  - Files: `frontend/vite.config.ts` (+ maybe `dev.ps1`) (bite-size)

## EPIC: DEVX — developer experience / tooling
- ✅ **TP-017-DEVX--local-pr-review-hook** — auto-run the code-reviewer locally on every in-session `gh pr create` (a `PostToolUse` hook + `.claude/hooks/pr-review.ps1` → headless `claude -p` → `gh pr comment`); no Anthropic key in GitHub. Documented in `AUTOMATION.md`. — [PR #10] — 2026-06-01
  - ⚠️ **Lost in merge:** PR #10's merge commit was orphaned (main went #9→#11→#12, bypassing #10), so the hook never reached `main`. Re-landed via TP-020 (PR #13).
- ✅ **TP-026-DEVX--prompt-log-autoroll** — made the `capture-prompt.ps1` logging hook self-rolling for rule 12: it now writes to the highest-numbered `prompt_history*.csv` and rolls to the next index once the active file hits 100 records (records counted by leading-timestamp match, so embedded newlines don't inflate the count). Fixes the loose end where the hook kept appending to the 100+-record `prompt_history.csv`; new prompts now land in `prompt_history_2.csv` automatically. Verified by feeding a test payload through the live hook (it landed in `_2`, quote/newline-escaped); the test record was then removed, so `_2` stays header-only in the diff until the next real prompt. — 2026-06-06
  - Files: `.claude/hooks/capture-prompt.ps1` (bite-size)
- ✅ **TP-028-DEVX--session-start-rules-hook** — added a `SessionStart` hook (`load-working-rules.ps1` + wiring in `.claude/settings.json`) that injects `whats_up_claude.md` into context at session start, so the working rules load **deterministically via the harness** instead of relying on Claude noticing the "read it" line in CLAUDE.md. The script reads the file with `[System.IO.File]::ReadAllText(..., UTF8)` — PS 5.1's `Get-Content -Raw` mangled the UTF-8 em-dashes and attached `PSPath` note-properties to the string — and emits it as `hookSpecificOutput.additionalContext`. Also updated CLAUDE.md's session-start step to report which hooks are active. Pipe-tested (valid JSON, clean string); fires next session — verify via `/hooks`. — 2026-06-07
  - Files: `.claude/hooks/load-working-rules.ps1` (new), `.claude/settings.json`, `CLAUDE.md` (bite-size)

## EPIC: DOCS — documentation & process
- ✅ **TP-016-DOCS--plan-task-tracker** — made PLAN.md the single task tracker (rules 8–10) and retired `BACKLOG.md`. — [PR #9] — 2026-06-01
- ✅ **TP-020-DOCS--automation-doc** — `AUTOMATION.md` documenting every hook/script/agent; backfilled the merged tickets into this tracker. — [PR #13] — 2026-06-01
- ✅ **TP-037-DOCS--prompt-history-analysis** — analyzed the auto-logged `prompt_history*.csv` (97 records → 92 real prompts over 11 sessions) and produced a human-readable report + a styled 2-page PDF, plus a reproducible generator. Findings (Session Management 25%, Git/PR 18.5%, Workflow pings 15.2%, logging noise) seeded the new **EPIC: PROMPTOPS** below (TP-029→036). — 2026-06-08
  - Files: `reports/PROMPT_ANALYSIS.md` (new), `reports/Prompt_Analysis_Report.pdf` (new), `reports/generate_prompt_report_pdf.py` (new), `PLAN.md` (PROMPTOPS epic) — big bite (4), one cohesive analysis deliverable

## EPIC: FIX — regressions & maintenance
- ✅ **TP-019-FIX--date-tonedown-and-prompt-log-union** — re-applied the lost toned-down date stamp (commit `8b7a1d6` never reached main) and marked `prompt_history.csv` `merge=union` to stop the recurring log conflicts. — [PR #12] — 2026-06-01
- ✅ **TP-021-FIX--restore-pr-review-hook** — landed the PR-review hook on `main` (`pr-review.ps1` + `PostToolUse` wiring + `.gitignore` entry); PR #13's merge had dropped the restore commit. Verified present on `main`. — [PR #14] — 2026-06-01

## EPIC: PROMPTOPS — prompt-workflow improvements
Asks derived from the **2026-06-07 prompt-history analysis** (`reports/PROMPT_ANALYSIS.md` /
`reports/Prompt_Analysis_Report.pdf`, 92 real prompts over 11 sessions). Goal: cut prompt
overhead and raise prompt quality. **Prioritized P1→P8 by leverage** (impact ÷ effort); all
bite-size. The top three attack the two biggest findings — Session Management (25%) and the
noisy log.
- ✅ **(P1) TP-029-PROMPTOPS--session-end-note-hook** — a `SessionEnd` hook (`session-end-note.ps1`)
  that auto-writes the rule-9 "where I left off" note to PLAN.md when a session ends, so **"end
  session" stops being a manual prompt**. **Chose `SessionEnd` over `Stop`** — `Stop` fires after
  every assistant turn and would spam the log. Mirrors `pr-review.ps1`: a fast dispatcher reads the
  hook's `transcript_path` and hands off to a detached worker that extracts the user+assistant text,
  skips trivial sessions (< 500 chars), summarizes via headless `claude -p --model sonnet`, and
  **splices one bullet in right after the "newest first." marker** (newest-first). Runs the headless
  call from a neutral dir so this very `SessionEnd` hook doesn't recurse; UTF-8 in/out, PLAN.md
  written BOM-less. Verified: parses clean, dry-run emits a grounded single bullet, end-to-end
  splice lands the note with valid UTF-8 (no mojibake) and no BOM. Also backfilled AUTOMATION.md's
  session-start hook doc (TP-028 had missed it). **Big bite (5 files)** — flagged; one cohesive
  hook + its docs. — 2026-06-08
  - Files: `.claude/hooks/session-end-note.ps1` (new), `.claude/settings.json`, `AUTOMATION.md`, `.gitignore`, `PLAN.md`
- ⬜ **(P2) TP-030-PROMPTOPS--prompt-log-noise-filter** — `capture-prompt.ps1` skips records
  that aren't real user prompts (`<task-notification>` blocks, `ultraplan`/CLI status echoes).
  **Why:** 5 such rows polluted the analysis; filtering at write time makes every future audit
  measure intent, not tooling noise. Files: `.claude/hooks/capture-prompt.ps1`.
- ⬜ **(P3) TP-031-PROMPTOPS--claude-md-faq** — add a short FAQ block to CLAUDE.md with the
  recurring one-off answers: where the SQLite DB lives + how to open it, `dev.ps1` is the
  one-command runner, the DB is swappable to MySQL later. **Why:** these were each re-asked
  across sessions (Learning bucket); turning them into reference removes the round-trips. Files: `CLAUDE.md`.
- ⬜ **(P4) TP-032-PROMPTOPS--pre-pr-rebase-guard** — before an in-session `gh pr create`,
  auto `git fetch` + rebase on `origin/main` (or warn if behind). **Why:** 4 separate prompts
  were merge-conflict cleanup from branches that drifted; surfacing conflicts pre-PR kills that
  class. Files: `.claude/hooks/pr-review.ps1` (or a sibling pre-create check).
- ⬜ **(P5) TP-033-PROMPTOPS--next-3-pointer** — keep a single ordered **"Next up (3)"** block
  at the top of the Task tracker, refreshed at session end (pairs with P1's hook). **Why:** 14
  "what's the next task?" pings — make the answer a glance, not a prompt. Files: `PLAN.md`.
- ⬜ **(P6) TP-034-PROMPTOPS--local-review-canonical-doc** — consolidate the "local code review,
  Anthropic key never on GitHub" setup into one canonical AUTOMATION.md section. **Why:** the
  same concern was asked ~4 different ways across the Agentic bucket; one source of truth stops
  the re-derivation. Files: `AUTOMATION.md`.
- ⬜ **(P7) TP-035-PROMPTOPS--prompt-templates** — add a small `PROMPTS.md` of reusable
  templates: **feature ticket** (vibe + spec: size / color token / max items / breakpoint),
  **bug report** (error text + last action), **merge & continue**. **Why:** vague feature
  prompts ("shiny loud") and bare bug reports cost a rework round-trip; a spec scaffold front-
  loads the detail. Files: `PROMPTS.md` (new).
- ⬜ **(P8) TP-036-PROMPTOPS--analysis-refresh-cadence** — rerun
  `reports/generate_prompt_report_pdf.py` at each rule-12 rollover (every 100 prompts) so the
  report stays current. **Why:** keeps this analysis a living dashboard, not a one-off. Files:
  rollover hook note + `reports/`.

## Session log
Where I left off (rule 9), newest first.
- **2026-06-07 (session end)** — **Prompt-history analysis session.** Analyzed both
  `prompt_history*.csv` (97 records → 92 real prompts, 5 tooling-noise rows, 11 sessions) and
  produced a human-readable report + a styled 2-page PDF: `reports/PROMPT_ANALYSIS.md`,
  `reports/Prompt_Analysis_Report.pdf`, and the reproducible generator
  `reports/generate_prompt_report_pdf.py` (uses `fpdf2`, installed to user site). Biggest
  findings: Session Management = 25%, Git/PR = 18.5%, Workflow pings = 15.2%; logging hook is
  capturing non-prompt noise. Turned the findings into a new **EPIC: PROMPTOPS** — 8 prioritized
  asks **TP-029→TP-036** (all ⬜ queued, bite-size). **State at session end:** still on branch
  `TP-028-DEVX--session-start-rules-hook`; the `reports/` files + the PROMPTOPS PLAN.md edits are
  **uncommitted** (no branch/commit/PR made for this analysis work — left to the user). **Next
  session:** (1) decide where the analysis work lands (own branch/ticket vs. fold into a DOCS
  ticket) and commit it; (2) start **P1 TP-029-PROMPTOPS--session-end-note-hook** — the
  highest-leverage ask (automates the "end session" prompt, attacking the 25% bucket); (3) the
  pre-existing **TP-027-FIX** (Vite proxy IPv4) and **TP-028** push/PR are still pending from
  prior sessions.
- **2026-06-07 (session end)** — Built **TP-028-DEVX--session-start-rules-hook**: the working
  rules (`whats_up_claude.md`) now auto-inject via a new `SessionStart` hook, so I no longer
  rely on being told (or remembering) to read them — the harness loads them every session.
  Confirmed **0 open PRs** (rule 11; nothing to pull). **State at session end:** committed on
  branch `TP-028-DEVX--session-start-rules-hook` (commit `9a1eb7a`) but **NOT pushed and NO PR
  opened** — left to the user. **Next session:** (1) push the branch + open a PR for TP-028
  (the local PR-review hook will auto-comment on `gh pr create`), then merge + ancestry-verify;
  (2) **verify the new hook is registered via `/hooks`** — it fires at session *start* so it had
  no effect on the session it was added in, but should auto-load the rules from this session on.
  **Still queued:** TP-027-FIX (Vite proxy IPv4 — quick fix).
- **2026-06-07 (session end)** — Cleared the two carried loose ends. **Shipped TP-026-DEVX**
  (#32): the `capture-prompt.ps1` hook is now self-rolling — it writes to the highest-numbered
  `prompt_history*.csv` and rolls at 100 records, so rule 12 is automatic (verified: this
  session's prompts now land in `prompt_history_2.csv`). **Live-verified the two built-but-unrun
  UI changes** by driving headless Edge over the DevTools Protocol (no Playwright; Node 24
  global WebSocket/fetch): **TP-006 ✅** — with the backend down, the app shows the 🔌 "Can't
  reach the server" panel + Retry and suppresses the red banner (screenshot captured); **TP-015
  ✅** — clicking "+ New Task" opens the restyled form ("Step Into the Ring" eyebrow, display
  "New Task" heading, Create Task button, Priority Preview chip) with computed styles `2px` /
  `rgb(23,18,15)` ink border / `rgb(251,245,232)` canvas bg (the fight-night tokens, not the old
  slate/white). **Finding → ticketed TP-027-FIX:** Vite's proxy target `localhost:8000` + Node
  24's IPv6-first resolution vs uvicorn's IPv4-only bind makes the dev proxy intermittently
  unreachable even when the backend is up (`curl 127.0.0.1:8000` always worked) — pin the proxy
  to `127.0.0.1`. TP-006's Retry-recovery wasn't cleanly captured because of that flapping, but
  the app did load real data once the proxy connected (so the recover path renders). **Next
  session:** TP-027 (quick proxy-IPv4 fix), else no queued feature work — pick new scope.
- **2026-06-06 (evening, session end)** — **Cleared the entire queued backlog** — 0 ⬜ tasks
  left in the tracker. Shipped six tickets, each auto-reviewed by the local hook (findings
  acted on), merged + ancestry-verified, branches pruned, **0 open PRs**: **TP-022-FIX** (#24,
  weekly slot freed on completion), **TP-025-FIX** (#25, tz-aware timestamp serialization),
  **TP-023-FOCUS** (#27, "Up Next" backlog queue with 5→15→30→50 reveal), **TP-006-UX** (#28,
  friendly server-unreachable state + Retry, and `dev.ps1` waits for `:8000`), **TP-005-UX**
  (#29, click a milestone title to toggle), **TP-015-UX** (#30, New Task form restyled to
  fight-night). Backend 25 tests pass; frontend build clean throughout. **Next session:** no
  queued tickets — pick new scope (e.g. the auth seam, the unused `/api/weekly` GET, or polish).
  **Open loose ends (not yet ticketed):** (1) the prompt-logging hook still writes to
  `prompt_history.csv` despite the rule-12 rollover — rewire its path to `prompt_history_2.csv`;
  (2) **TP-006 & TP-015 weren't visually verified** in a running app (build/type-check only) —
  worth a live check of the unreachable panel and the restyled form.
- **2026-06-06 (session end)** — Cleared the **FIX epic**: shipped **TP-022-FIX** (completing
  a task now frees its weekly slot — `set_completed` clears `is_selected_this_week`; **PR #24**)
  and **TP-025-FIX** (timestamps serialize tz-aware UTC via a `TaskOut` `field_serializer`,
  fixing the client week-bucketing skew; **PR #25**). Both backend-only, 25 tests pass, each
  auto-reviewed by the local hook (acted on its findings), **merged + ancestry-verified, 0 open
  PRs**. Also rolled the prompt log to `prompt_history_2.csv` (rule 12; old file crossed 100).
  **Next session:** TP-023 (backlog queue — resolve its open questions first), then the UX
  bites TP-005 (milestone label toggle), TP-006 (backend-unreachable state), TP-015 (New Task
  form restyle). **Heads-up:** the prompt-logging hook still writes to `prompt_history.csv` —
  point it at `prompt_history_2.csv` to honor the rollover (I created the file but didn't
  rewire the hook).
- **2026-06-01 (evening, session end)** — **Shipped the entire FOCUS epic** (TP-010→014):
  `completed_at` column (#16), auto/manual complete+reopen (#17), top-3 "This Week's Card"
  dashboard (#18), read-only completed cards + Mark Complete/Reopen buttons (#20), and the
  "🏆 Recent Wins" trophy shelf (#21). Resolved the gating open question: **current-week
  completions stay visible** (wins show this **or** previous Mon–Sun week). Also: ticketed
  TP-023 (backlog queue, #19) and TP-024 (`--count` mock seeder, #22 — added 10 tasks, **DB
  now 20**). **Verified the FOCUS flow live in the app** via headless Edge screenshots
  (top-3 active → Mark Complete drops it off → appears in Recent Wins newest-first → read-only
  with Reopen). All PRs merged, ancestry-verified (no orphans this time), branches pruned,
  **0 open PRs**. **Findings logged as tickets:** TP-022 (completing doesn't free the weekly
  slot) and **TP-025** (naive UTC timestamps → client week-bucketing skew). **Next session:**
  queued TP-022, TP-025, TP-023 (resolve its open questions first), plus older UX bites
  TP-005 (milestone label toggle), TP-006 (friendly backend-unreachable state — its value was
  confirmed when a raw "Internal Server Error" banner flashed during verification), TP-015
  (New Task form restyle). **Heads-up:** the auto-logged `prompt_history.csv` is at ~96 rows —
  about to cross the rule-12 threshold of 100, after which roll over to `prompt_history_2.csv`.
- **2026-06-01 (session end)** — All PRs merged (#9–#14), **0 open**, working tree clean.
  The local PR-review hook is **verified present on `main`** (it had to be re-landed twice —
  PR #10's merge and PR #13's merge each dropped a commit; TP-021/PR #14 fixed it). ⚠️ **The
  hook needs a Claude Code session restart to load** (hooks load at startup; this session
  predated the hook on disk) — after restart, in-session `gh pr create` auto-reviews.
  **Next session:** start the FOCUS epic at **TP-010**, but first resolve the open question on
  TP-014 (should *current*-week completions stay visible, or strictly previous week?). Also
  queued: TP-005, TP-006, TP-015. **Watch out:** merges here have twice orphaned commits —
  after merging, verify the commit is an ancestor of `main`.
- **2026-06-01 (afternoon)** — Shipped TP-016 (tracker), TP-017 (local PR-review hook),
  TP-018 (smiley), TP-019 (date tone-down + log union); documented all hooks/scripts in
  `AUTOMATION.md` (TP-020) and backfilled this tracker (added DEVX/DOCS/FIX epics).
  **Caught a regression:** PR #10's merge was orphaned, so the PR-review hook never reached
  `main`; TP-020/PR #13 restores it. **Next:** FOCUS epic (TP-010); the current-week-completion
  open question still gates TP-014.
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
[PR #9]: https://github.com/adalagandev/task_puncher/pull/9
[PR #10]: https://github.com/adalagandev/task_puncher/pull/10
[PR #11]: https://github.com/adalagandev/task_puncher/pull/11
[PR #12]: https://github.com/adalagandev/task_puncher/pull/12
[PR #13]: https://github.com/adalagandev/task_puncher/pull/13
[PR #14]: https://github.com/adalagandev/task_puncher/pull/14
