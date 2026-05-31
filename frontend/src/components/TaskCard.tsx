import { useState } from "react";
import type { Task } from "../types";
import { WEEKLY_MAX } from "../types";
import { MilestoneList } from "./MilestoneList";

interface Props {
  task: Task;
  weeklyCount: number;
  onToggleMilestone: (taskId: number, milestoneId: number, done: boolean) => void;
  onSetWeekly: (taskId: number, selected: boolean) => void;
  onDelete: (taskId: number) => void;
}

export function TaskCard({
  task,
  weeklyCount,
  onToggleMilestone,
  onSetWeekly,
  onDelete,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const done = task.milestones.filter((m) => m.done).length;
  const total = task.milestones.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const weekFull = !task.is_selected_this_week && weeklyCount >= WEEKLY_MAX;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900">{task.title}</h3>
          {task.description && (
            <p className="mt-0.5 text-sm text-slate-500">{task.description}</p>
          )}
        </div>
        <span
          className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-sm font-semibold text-indigo-600"
          title="Priority score"
        >
          {task.priority_score}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <span>I {task.impact}</span>
        <span>·</span>
        <span>U {task.urgency}</span>
        <span>·</span>
        <span>E {task.effort}</span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {done}/{total} milestones
          </span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => onSetWeekly(task.id, !task.is_selected_this_week)}
          disabled={weekFull}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            task.is_selected_this_week
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          }`}
          title={weekFull ? `You already picked ${WEEKLY_MAX} this week` : undefined}
        >
          {task.is_selected_this_week ? "★ In this week" : "Add to week"}
        </button>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          {expanded ? "Hide milestones" : "Show milestones"}
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="ml-auto rounded-md px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
        >
          Delete
        </button>
      </div>

      {expanded && (
        <MilestoneList
          task={task}
          onToggle={(mId, isDone) => onToggleMilestone(task.id, mId, isDone)}
        />
      )}
    </div>
  );
}
