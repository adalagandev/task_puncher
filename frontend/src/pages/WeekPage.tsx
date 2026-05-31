import { TaskCard } from "../components/TaskCard";
import type { UseTasks } from "../hooks/useTasks";
import { WEEKLY_MAX } from "../types";

export function WeekPage({ store }: { store: UseTasks }) {
  const weekly = store.tasks
    .filter((t) => t.is_selected_this_week)
    .sort((a, b) => b.priority_score - a.priority_score);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">This week</h1>
        <p className="text-sm text-slate-500">
          Your {WEEKLY_MAX} focus tasks ({weekly.length}/{WEEKLY_MAX} chosen), highest
          priority first.
        </p>
      </div>

      {store.loading ? (
        <p className="py-10 text-center text-slate-400">Loading…</p>
      ) : weekly.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center">
          <p className="text-slate-500">No tasks picked for this week yet.</p>
          <p className="text-sm text-slate-400">
            Head to “All tasks” and add up to {WEEKLY_MAX}.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {weekly.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              weeklyCount={weekly.length}
              onToggleMilestone={store.toggleMilestone}
              onSetWeekly={store.setWeekly}
              onDelete={store.deleteTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
