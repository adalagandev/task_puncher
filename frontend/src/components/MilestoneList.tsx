import type { Task } from "../types";

interface Props {
  task: Task;
  onToggle: (milestoneId: number, done: boolean) => void;
  /** Completed tasks are read-only trophies — checkboxes are shown but locked. */
  readOnly?: boolean;
}

export function MilestoneList({ task, onToggle, readOnly = false }: Props) {
  return (
    <ul className="mt-4 space-y-2 border-t-2 border-ink/10 pt-3">
      {task.milestones.map((m, i) => (
        <li key={m.id} className="flex gap-2.5">
          {/* Zero-padded round number gives the list a fight-card scorecard rhythm. */}
          <span className="mt-0.5 font-display text-sm leading-none text-ink/30">
            {String(i + 1).padStart(2, "0")}
          </span>
          <input
            id={`milestone-${m.id}`}
            type="checkbox"
            className={`mt-0.5 h-4 w-4 shrink-0 accent-knockout ${
              readOnly ? "cursor-not-allowed" : ""
            }`}
            checked={m.done}
            disabled={readOnly}
            onChange={readOnly ? undefined : (e) => onToggle(m.id, e.target.checked)}
          />
          <div className="min-w-0">
            {/* The title is the checkbox's label, so clicking the text toggles done too.
                A <label> won't fire for a disabled input, so read-only stays locked. */}
            <label
              htmlFor={`milestone-${m.id}`}
              className={`block text-sm font-semibold ${readOnly ? "" : "cursor-pointer"} ${
                m.done ? "text-ink/35 line-through" : "text-ink"
              }`}
            >
              {m.title}
            </label>
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
