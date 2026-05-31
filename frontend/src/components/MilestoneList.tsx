import type { Task } from "../types";

interface Props {
  task: Task;
  onToggle: (milestoneId: number, done: boolean) => void;
}

export function MilestoneList({ task, onToggle }: Props) {
  return (
    <ul className="mt-4 space-y-2 border-t-2 border-ink/10 pt-3">
      {task.milestones.map((m, i) => (
        <li key={m.id} className="flex gap-2.5">
          {/* Zero-padded round number gives the list a fight-card scorecard rhythm. */}
          <span className="mt-0.5 font-display text-sm leading-none text-ink/30">
            {String(i + 1).padStart(2, "0")}
          </span>
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-knockout"
            checked={m.done}
            onChange={(e) => onToggle(m.id, e.target.checked)}
          />
          <div className="min-w-0">
            <p
              className={`text-sm font-semibold ${
                m.done ? "text-ink/35 line-through" : "text-ink"
              }`}
            >
              {m.title}
            </p>
            {m.relevance && (
              <p className="text-xs text-ink/55">
                <span className="font-bold uppercase tracking-wide text-ink/40">Why:</span>{" "}
                {m.relevance}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
