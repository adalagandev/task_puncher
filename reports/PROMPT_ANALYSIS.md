# Prompt History Analysis

**Generated:** 2026-06-07
**Sources:** `prompt_history.csv` + `prompt_history_2.csv`
**Span:** 2026-05-30 → 2026-06-07 (8 days, 11 sessions)

---

## Summary

| Metric | Value |
|---|---|
| Total records in both CSVs | 97 |
| Real user prompts (analyzed) | 92 |
| Tooling / system noise records | 5 (5.2% of all records) |
| Distinct sessions | 11 |
| Avg prompts per session | ~8.4 |

> **Noise note:** 5 records are not real prompts — 1 `<task-notification>` block and
> 4 `ultraplan` CLI status echoes got captured by the logging hook. That's a logging
> bug worth fixing (filter agent/CLI echoes before writing the row), not user behavior.

---

## Category breakdown (of 92 real prompts)

| # | Category | Count | Share |
|--:|---|--:|--:|
| 1 | Session Management | 23 | 25.0% |
| 2 | Git / PR / Version Control | 17 | 18.5% |
| 3 | Workflow & Task Navigation | 14 | 15.2% |
| 4 | Agentic Automation & Hooks | 11 | 12.0% |
| 5 | Feature & UI Development | 6 | 6.5% |
| 6 | Meta / Config / Documentation | 6 | 6.5% |
| 7 | Learning & Clarifying Questions | 6 | 6.5% |
| 8 | Debugging & Bug Fixes | 5 | 5.4% |
| 9 | Planning & Prioritization | 4 | 4.3% |
| | **Total** | **92** | **100%** |

```
Session Management        ████████████████████████  25.0%
Git / PR / Version Ctrl   ██████████████████        18.5%
Workflow & Task Nav       ███████████████           15.2%
Agentic Automation        ████████████              12.0%
Feature & UI Dev          ███████                    6.5%
Meta / Config / Docs      ███████                    6.5%
Learning & Questions      ███████                    6.5%
Debugging & Bug Fixes     █████                      5.4%
Planning & Prioritization ████                       4.3%
```

---

## Per-category findings & tips

### 1. Session Management — 23 (25.0%)
Examples: `read whats_up_claude`, `end session`, `start new session`, `let's resume. where am at?`

A full quarter of all prompts are session bookkeeping — opening with "read the rules file"
and closing with "end session." This is pure overhead that could be largely automated.

**Tips**
- You already shipped the `SessionStart` hook that auto-loads the working rules — keep leaning
  on it so `read whats_up_claude` disappears from the log entirely.
- Add a session-end summary to the same hook (or a `Stop` hook) so "end session" auto-writes
  the PLAN.md left-off note instead of being a manual prompt every time.
- Stop logging `read …` / `end session` as analyzable prompts — they bias every other percentage.

### 2. Git / PR / Version Control — 17 (18.5%)
Examples: `merge #17 and start TP-012`, `Fix the merge conflict in pull/11`, `rebase them clean onto main`

Heavy, healthy use of the one-task-one-branch-one-PR flow. Recurring pain point: **merge conflicts**
(4 separate prompts) from long-lived or stacked branches.

**Tips**
- Conflicts cluster when branches sit open — merge/rebase each TP branch the same day you open it.
- Combine the common "merge #N and start TP-M" into a single instruction; you already do this well.
- Consider a pre-PR `git fetch && git rebase origin/main` step so conflicts surface before review.

### 3. Workflow & Task Navigation — 14 (15.2%)
Examples: `what's the next task?`, `continue with the work`, `do #2 now`, `done`

Lots of "what's next" pings. These are cheap but frequent — a sign the plan isn't always visible.

**Tips**
- Ask once per session for the *ordered* next 3 tasks, then say "do all three" instead of
  re-asking after each. Cuts round-trips.
- Keep PLAN.md's "next up" pointer current (your rule #9) so the answer is a glance, not a prompt.

### 4. Agentic Automation & Hooks — 11 (12.0%)
Examples: `guide me how to create an agent that performs code reviews`, `run agent when a PR is created`,
`set up the hook and merge into CLAUDE.md`

Strong investment in self-improving tooling (code-reviewer agent, PR hooks, rules hook). Several
prompts circle the same question: *can the agent run locally without my Anthropic key on GitHub?*

**Tips**
- That recurring concern deserves one canonical doc — capture the "local code-review, key stays
  off GitHub" setup once so you stop re-deriving it.
- When asking for automation, state the trigger + the output target up front
  ("on PR create, comment on the PR") — your later prompts did this and got cleaner results.

### 5. Feature & UI Development — 6 (6.5%)
Examples: `make the date timestamp bigger… shiny loud`, `compact list of tasks at the bottom`, `add a smile emoji`

Feature prompts are vivid but sometimes vague on acceptance criteria ("shiny loud").

**Tips**
- Pair the vibe with a concrete spec: size, color token, breakpoint, max items. Faster to a
  result you accept on the first pass.
- Bundle the "do the usual ticket" ritual into one line — you already abbreviate it well.

### 6. Meta / Config / Documentation — 6 (6.5%)
Examples: `update the instructions`, `init CLAUDE.md`, `document the hooks in an md file`, `why do I need to tell you…`

Good instinct: you keep tightening the rules/docs so future sessions need fewer instructions.

**Tips**
- Keep CLAUDE.md lean and push procedural detail into hooks (you decided exactly this) — it's
  the highest-leverage move for shrinking the Session Management bucket above.

### 7. Learning & Clarifying Questions — 6 (6.5%)
Examples: `what are the DB creds / I'm new to python`, `can I swap to mysql later?`, `do I just run dev.ps1?`

You ask before acting — low rework risk. Questions are mostly one-off environment/onboarding items.

**Tips**
- Drop the recurring answers (DB location, `dev.ps1` usage, swap-DB story) into CLAUDE.md's
  Commands section so they become reference, not repeated questions.

### 8. Debugging & Bug Fixes — 5 (5.4%)
Examples: `internal 500 error on first load`, `[vite] http proxy error ECONNREFUSED`, `FIX THIS bug`

Low and mostly environmental (backend not started → proxy ECONNREFUSED; cold-start 500).

**Tips**
- Most of these trace to "frontend up before backend." The `dev.ps1` runner + a health-check
  wait should eliminate the proxy/500 class entirely.
- When reporting a bug, paste the error *and* what you just did — your best debugging prompts did.

### 9. Planning & Prioritization — 4 (4.3%)
Examples: `propose a structure and build plan`, `save in PLAN.md`, `add TP-006 to the backlog`

Small count, high value — these front-loaded the whole project (scoring formula, MVP plan).

**Tips**
- Re-run a short "re-prioritize the backlog" prompt at each session start; cheap and keeps the
  frequent "what's next" pings (category 3) honest.

---

## Top 3 takeaways

1. **Automate the 25% session tax.** Session open/close prompts are your single biggest category —
   the SessionStart hook (already shipped) plus a session-end hook can reclaim most of it.
2. **Tame branch conflicts.** Merge/rebase TP branches same-day; rebase on `origin/main` before PR.
3. **Clean the log.** Filter `read …`, `end session`, and CLI/agent echoes out of `prompt_history.csv`
   so future analyses measure *intent*, not ritual.
