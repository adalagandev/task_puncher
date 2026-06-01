# What's up, Claude — working rules

Read this before doing anything in this repo.

1. **Capture prompts** — log every prompt into `prompt_history.csv`.
2. **Plan first** — outline any code change before making it.
3. **Task IDs** — break each plan into bite-size tasks named
   `TP-{incremental-number}-{feature-epic}--{feature-name}`.
4. **Commits** — prefix every commit message with the task ID.
5. **Bite size** — ≤3 files changed. "Big bite" = 3–7 files. Flag me if it's more.
   New files count as changes.
6. **Comments** — after making changes, comment the code with what + why,
   no more than 1.5 sentences.
7. **Branches** — one branch per task, named the same as the task ID.
8. **PLAN.md** — add all tasks to `PLAN.md`, organized by MVP and EPIC, with a
   completion timestamp.
9. **Session end** — when I end a session, note in `PLAN.md` where I left off so
   I can continue next time.
