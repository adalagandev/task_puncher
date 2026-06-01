# Automation, hooks & scripts

Everything in this repo that runs *around* the app — Claude Code hooks, the local
code-review agent, and helper scripts. This is a **Windows / PowerShell** repo, so the
hooks and scripts are `.ps1`.

| What | File | Kind | Trigger |
|---|---|---|---|
| Prompt logger | `.claude/hooks/capture-prompt.ps1` | Claude Code hook | every prompt you submit |
| Local PR code-review | `.claude/hooks/pr-review.ps1` | Claude Code hook | a `gh pr create` run in-session |
| Code-review rubric | `.claude/agents/code-reviewer.md` | Claude Code subagent | invoked on demand, or used by the hook above |
| Dev runner | `dev.ps1` | shell script | you run it |
| Mock data seeder | `backend/app/seed_mock.py` | Python script | you run it |
| Default-user seed | `backend/app/seed.py` | Python module | backend startup |

Hook wiring lives in **`.claude/settings.json`** (committed/shared). Personal machine
settings/permissions live in `.claude/settings.local.json` (not the place for these hooks).

---

## Claude Code hooks

Both hooks are registered in `.claude/settings.json` and run via `powershell.exe`. Claude
Code reads this file from the **currently checked-out working tree**, so a hook is only
active on branches that contain it (this is why a new hook starts firing only after it
merges to `main`, or while you're on its feature branch).

### `capture-prompt.ps1` — prompt logger
- **Event:** `UserPromptSubmit` (fires before each prompt is processed).
- **Input:** a JSON blob on stdin (`{ prompt, session_id, ... }`).
- **Action:** appends one CSV row — `timestamp,session_id,prompt` — to `prompt_history.csv`
  at the repo root, creating the file with a header if missing. Quotes/escapes the fields.
- **Output:** rows in `prompt_history.csv` (tracked in git; see `.gitattributes` below).
- **Implements** rule 1 of `whats_up_claude.md` ("log every prompt").

### `pr-review.ps1` — local PR code-review
Runs the `code-reviewer` rubric against a freshly-opened PR, **entirely on your machine —
no Anthropic key ever goes to GitHub.**

- **Event:** `PostToolUse` with matcher `Bash` (fires after every Bash command).
- **Two passes:**
  1. **Dispatcher** (synchronous, must stay fast): reads the hook JSON on stdin; if the
     command text isn't a `gh pr create`, exits immediately. Otherwise scrapes the PR number
     from the `…/pull/NN` URL in the output and **re-launches itself detached** (`-Worker`)
     so the slow review never blocks the session.
  2. **Worker** (detached/background): builds `git diff origin/<base>...HEAD`, loads the
     `code-reviewer.md` rubric as the system prompt, and runs headless Claude:
     `git diff | claude -p "<instruction>" --model sonnet --append-system-prompt "<rubric>"`.
     It then posts the result with `gh pr comment <NN> --body-file …`.
- **Encoding notes (PowerShell 5.1 footguns, already handled):** forces UTF-8 on the pipe
  to/from `claude` and writes the comment file as UTF-8 **without BOM**; deliberately avoids
  `2>&1` on the native `claude` call (PS 5.1 wraps a native exe's stderr in error records and
  corrupts captured output). The headless call runs from a neutral dir so this project's own
  hooks don't fire on it.
- **Output:** a PR comment, plus a debug log at `.claude/pr-review.log` (gitignored).
- **Limits:** in-session only (a `gh pr create` in another terminal, or a PR opened on
  github.com, won't trigger it); uses your local Claude login + usage; runs on Sonnet.
- **Disable:** remove the `PostToolUse` block from `.claude/settings.json`.

---

## The code-review agent

### `.claude/agents/code-reviewer.md`
A Claude Code subagent: a senior-reviewer rubric (correctness / security / quality, output
grouped by severity) that **only reads and reports — never edits**. Model: `sonnet`; tools:
Read, Grep, Glob, Bash.

- **On demand:** ask Claude to review changes, or invoke it via `/agents`.
- **Automated:** its body (frontmatter stripped) is the system prompt the `pr-review.ps1`
  worker feeds to headless `claude -p`.

---

## Helper scripts

### `dev.ps1` — run backend + frontend together
Launches the FastAPI backend (`uvicorn … --port 8000`) and the Vite frontend
(`npm run dev`, proxying `/api` → :8000), each in its own process. Sanity-checks that the
backend venv and frontend `node_modules` exist first, and kills both process trees
(`taskkill /T`) on Ctrl+C / exit.
```powershell
.\dev.ps1
```

### `backend/app/seed_mock.py` — mock data for dev/demos
Inserts 8 mock tasks with random impact/effort/urgency, a stored `priority_score` (computed
the same way as the real create route), and a random valid 5–7 milestones each.
```powershell
.venv\Scripts\python -m app.seed_mock            # seed only if the DB is empty
.venv\Scripts\python -m app.seed_mock --force    # add a fresh batch anyway
.venv\Scripts\python -m app.seed_mock --reset    # wipe this user's tasks, then seed
```

### `backend/app/seed.py` — default-user seed
Not a CLI script — `ensure_default_user()` is called from the FastAPI lifespan on startup
(`app/main.py`) to guarantee the single local user exists. It's the multi-user seam: real
auth later replaces only this.

---

## Supporting config

- **`.gitattributes`** — marks `prompt_history.csv` as `merge=union` so the append-only log
  auto-merges across branches/rebases instead of conflicting on every concurrent append.
- **`.claude/pr-review.log`** — runtime debug log for the review hook; gitignored.
