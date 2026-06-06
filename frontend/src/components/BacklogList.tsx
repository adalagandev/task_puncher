import { useState } from "react";
import type { Task } from "../types";

// Cumulative reveal caps: 5 rows show first, then "Show more" grows the window to
// 15 → 30 → 50 before revealing the rest. Local UI state only, so it resets on
// reload (TP-023).
const REVEAL_CAPS = [5, 15, 30, 50];

// Slim, read-only queue of the active tasks beyond the focus 3. One row per task —
// rank, title, milestone progress, and the priority score — so the dashboard hints
// at what's next without the weight of full cards. `rankOffset` is the rank of the
// first row (the caller owns how many tasks precede the backlog), so the numbering
// stays correct if the focus section ever shows fewer/more than 3.
export function BacklogList({ tasks, rankOffset = 4 }: { tasks: Task[]; rankOffset?: number }) {
  const [visible, setVisible] = useState(REVEAL_CAPS[0]);

  const showMore = () => {
    // Jump to the next cap past the current count; once past the last cap, reveal all.
    const next = REVEAL_CAPS.find((c) => c > visible) ?? tasks.length;
    setVisible(Math.min(next, tasks.length));
  };

  const rows = tasks.slice(0, visible);
  const remaining = tasks.length - visible;

  return (
    <section className="border-t-2 border-ink/15 pt-6">
      <p className="eyebrow text-ink/60">On the Undercard</p>
      <h2 className="font-display text-3xl uppercase leading-none tracking-wide text-ink">
        Up Next
      </h2>
      <p className="mt-1 text-sm font-medium text-ink/60">
        The rest of your active tasks, by priority — clear one of the three above to promote the next.
      </p>

      <ul className="mt-4 space-y-2">
        {rows.map((task, i) => {
          const done = task.milestones.filter((m) => m.done).length;
          const total = task.milestones.length;
          return (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-md border-2 border-ink/20 bg-canvas px-3 py-2 transition hover:border-ink"
            >
              {/* Rank continues the list above; caller sets the offset (focus 3 ⇒ #4). */}
              <span className="w-5 shrink-0 text-right font-display text-sm text-ink/40">
                {i + rankOffset}
              </span>
              <span className="min-w-0 flex-1 truncate font-display text-base uppercase tracking-wide text-ink">
                {task.title}
              </span>
              {/* Tasks always carry 5–7 milestones, but guard so the row is robust standalone. */}
              {total > 0 && (
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-ink/50">
                  {done}/{total}
                </span>
              )}
              <span
                className="shrink-0 rounded border-2 border-ink bg-ink px-2 py-0.5 font-display text-base leading-none text-bone"
                title="Priority score"
              >
                {task.priority_score}
              </span>
            </li>
          );
        })}
      </ul>

      {remaining > 0 && (
        <button
          onClick={showMore}
          className="mt-3 text-xs font-extrabold uppercase tracking-wide text-knockout transition hover:text-ink"
        >
          Show more tasks ({remaining} left)
        </button>
      )}
    </section>
  );
}
