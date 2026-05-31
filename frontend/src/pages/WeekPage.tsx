import { TaskCard } from "../components/TaskCard";
import type { UseTasks } from "../hooks/useTasks";
import { WEEKLY_MAX } from "../types";

export function WeekPage({ store }: { store: UseTasks }) {
  const weekly = store.tasks
    .filter((t) => t.is_selected_this_week)
    .sort((a, b) => b.priority_score - a.priority_score);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-knockout">Main Event</p>
          <h2 className="font-display text-4xl uppercase leading-none tracking-wide text-ink">
            This Week
          </h2>
          <p className="mt-1 text-sm font-medium text-ink/60">
            Your three title fights — highest priority first.
          </p>
        </div>
        {/* Scorecard meter: fills a gold slot per chosen task so the 3-cap is visible at a glance. */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: WEEKLY_MAX }).map((_, i) => (
            <span
              key={i}
              className={`h-3 w-8 rounded-full border-2 border-ink transition-colors ${
                i < weekly.length ? "bg-gold" : "bg-transparent"
              }`}
              title={`${weekly.length}/${WEEKLY_MAX} chosen`}
            />
          ))}
          <span className="ml-1 font-display text-lg tracking-wide text-ink">
            {weekly.length}/{WEEKLY_MAX}
          </span>
        </div>
      </div>

      {store.loading ? (
        <p className="py-12 text-center font-display text-xl uppercase tracking-wide text-ink/30">
          Loading…
        </p>
      ) : weekly.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-ink/30 bg-canvas/50 py-16 text-center">
          <p className="text-4xl" aria-hidden>
            🛎️
          </p>
          <p className="mt-2 font-display text-2xl uppercase tracking-wide text-ink">
            No fighters in the ring
          </p>
          <p className="mt-1 text-sm font-medium text-ink/50">
            Head to “All Tasks” and send up to {WEEKLY_MAX} into this week.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weekly.map((task, i) => (
            <div key={task.id} className="animate-slam" style={{ animationDelay: `${i * 55}ms` }}>
              <TaskCard
                task={task}
                weeklyCount={weekly.length}
                onToggleMilestone={store.toggleMilestone}
                onSetWeekly={store.setWeekly}
                onDelete={store.deleteTask}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
