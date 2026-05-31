import { useState } from "react";
import { TaskCard } from "../components/TaskCard";
import { TaskForm } from "../components/TaskForm";
import type { UseTasks } from "../hooks/useTasks";
import { MILESTONE_MAX, MILESTONE_MIN } from "../types";

export function TasksPage({ store }: { store: UseTasks }) {
  const [showForm, setShowForm] = useState(false);
  const weeklyCount = store.tasks.filter((t) => t.is_selected_this_week).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-knockout">The Lineup</p>
          <h2 className="font-display text-4xl uppercase leading-none tracking-wide text-ink">
            All Tasks
          </h2>
          <p className="mt-1 text-sm font-medium text-ink/60">
            Ranked by priority score — heaviest hitters up top.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md border-2 border-ink bg-knockout px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-punch transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-punch-sm"
          >
            + New Task
          </button>
        )}
      </div>

      {showForm && (
        <TaskForm onSubmit={store.createTask} onCancel={() => setShowForm(false)} />
      )}

      {store.loading ? (
        <p className="py-12 text-center font-display text-xl uppercase tracking-wide text-ink/30">
          Loading the card…
        </p>
      ) : store.tasks.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-ink/30 bg-canvas/50 py-16 text-center">
          <p className="text-4xl" aria-hidden>
            🥊
          </p>
          <p className="mt-2 font-display text-2xl uppercase tracking-wide text-ink">
            No contenders yet
          </p>
          <p className="mt-1 text-sm font-medium text-ink/50">
            Create a task and break it into {MILESTONE_MIN}–{MILESTONE_MAX} milestones to
            step in the ring.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Staggered slam-in so cards cascade rather than popping in all at once. */}
          {store.tasks.map((task, i) => (
            <div key={task.id} className="animate-slam" style={{ animationDelay: `${i * 55}ms` }}>
              <TaskCard
                task={task}
                weeklyCount={weeklyCount}
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
