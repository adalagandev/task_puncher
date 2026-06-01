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
  onComplete: (taskId: number) => void;
  onReopen: (taskId: number) => void;
}

// Map the priority score to a boxing weight-class so the hero badge communicates
// rank at a glance (and tints itself) instead of being a bare number.
function scoreTier(score: number) {
  if (score >= 13) return { label: "Knockout", badge: "bg-knockout text-white" };
  if (score >= 7) return { label: "Contender", badge: "bg-gold text-ink" };
  return { label: "Undercard", badge: "bg-ink text-bone" };
}

const STATS = [
  { key: "impact", label: "Impact" },
  { key: "urgency", label: "Urgency" },
  { key: "effort", label: "Effort" },
] as const;

export function TaskCard({
  task,
  weeklyCount,
  onToggleMilestone,
  onSetWeekly,
  onDelete,
  onComplete,
  onReopen,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const done = task.milestones.filter((m) => m.done).length;
  const total = task.milestones.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const complete = pct === 100;

  // Completed tasks are read-only trophies: muted, no week/delete/complete actions.
  const isCompleted = task.status === "completed";
  const selected = task.is_selected_this_week;
  const weekFull = !selected && weeklyCount >= WEEKLY_MAX;
  const tier = scoreTier(task.priority_score);

  return (
    <div
      // Selected tasks get a gold "punch" shadow; completed ones gray out and flatten.
      className={`relative rounded-lg border-2 border-ink bg-canvas p-4 transition-all ${
        isCompleted
          ? "opacity-60 grayscale shadow-none"
          : selected
            ? "shadow-punch-gold"
            : "shadow-punch hover:-translate-y-0.5"
      }`}
    >
      {selected && !isCompleted && (
        <span className="absolute -left-2 -top-3 -rotate-3 rounded border-2 border-ink bg-gold px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ink shadow-punch-sm">
          ★ This Week
        </span>
      )}
      {isCompleted && (
        <span className="absolute -left-2 -top-3 -rotate-3 rounded border-2 border-ink bg-ink px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-bone shadow-punch-sm">
          🏆 Cleared
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pt-1">
          <h3 className="truncate font-display text-xl uppercase leading-tight tracking-wide text-ink">
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm text-ink/60">{task.description}</p>
          )}
        </div>

        {/* HERO: priority score as a tilted fight scorecard; straightens on hover. */}
        <div
          className={`shrink-0 -rotate-2 rounded-md border-2 border-ink px-3 py-1.5 text-center shadow-punch-sm transition-transform hover:rotate-0 ${tier.badge}`}
          title="Priority score"
        >
          <div className="font-display text-4xl leading-none">{task.priority_score}</div>
          <div className="mt-0.5 text-[9px] font-extrabold uppercase tracking-[0.15em]">
            {tier.label}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {STATS.map((s) => (
          <div
            key={s.key}
            className="rounded border-2 border-ink/15 bg-bone px-2 py-1.5 text-center"
          >
            <div className="font-display text-lg leading-none text-ink">{task[s.key]}</div>
            <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-ink/50">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-ink/60">
          <span>{complete ? "🏆 Cleared" : `${done}/${total} milestones`}</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-bone">
          {/* Fill turns gold at 100% to reward a fully-cleared task. */}
          <div
            className={`h-full transition-all duration-500 ${
              complete ? "bg-gold" : "bg-knockout"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isCompleted ? (
          // Read-only trophy: the only action is to send it back into the ring.
          <button
            onClick={() => onReopen(task.id)}
            className="rounded-md border-2 border-ink bg-ink px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-bone transition hover:bg-knockout"
          >
            ↩ Reopen
          </button>
        ) : (
          <>
            <button
              onClick={() => onSetWeekly(task.id, !selected)}
              disabled={weekFull}
              className={`rounded-md border-2 border-ink px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition ${
                selected
                  ? "bg-gold text-ink shadow-punch-sm hover:-translate-y-0.5"
                  : "bg-ink text-bone hover:bg-knockout disabled:cursor-not-allowed disabled:border-ink/20 disabled:bg-ink/10 disabled:text-ink/40 disabled:shadow-none"
              }`}
              title={weekFull ? `You already picked ${WEEKLY_MAX} this week` : undefined}
            >
              {selected ? "★ In the Ring" : "Add to Week"}
            </button>
            <button
              onClick={() => onComplete(task.id)}
              className="rounded-md border-2 border-ink bg-gold px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink shadow-punch-sm transition hover:-translate-y-0.5"
            >
              ✓ Mark Complete
            </button>
          </>
        )}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="rounded-md border-2 border-ink/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink/70 transition hover:border-ink hover:text-ink"
        >
          {expanded ? "Hide Milestones" : "Milestones"}
        </button>
        {!isCompleted && (
          <button
            onClick={() => onDelete(task.id)}
            className="ml-auto rounded-md border-2 border-transparent px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-knockout transition hover:border-knockout"
          >
            Delete
          </button>
        )}
      </div>

      {expanded && (
        <MilestoneList
          task={task}
          readOnly={isCompleted}
          onToggle={(mId, isDone) => onToggleMilestone(task.id, mId, isDone)}
        />
      )}
    </div>
  );
}
