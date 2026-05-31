import type { Task } from "../types";

interface Props {
  task: Task;
  onToggle: (milestoneId: number, done: boolean) => void;
}

export function MilestoneList({ task, onToggle }: Props) {
  return (
    <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
      {task.milestones.map((m) => (
        <li key={m.id} className="flex gap-2">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 accent-indigo-600"
            checked={m.done}
            onChange={(e) => onToggle(m.id, e.target.checked)}
          />
          <div className="min-w-0">
            <p
              className={`text-sm font-medium ${
                m.done ? "text-slate-400 line-through" : "text-slate-800"
              }`}
            >
              {m.title}
            </p>
            {m.relevance && (
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-400">Why:</span> {m.relevance}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
