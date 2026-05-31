import { useState } from "react";
import { TaskCard } from "../components/TaskCard";
import { TaskForm } from "../components/TaskForm";
import type { UseTasks } from "../hooks/useTasks";

export function TasksPage({ store }: { store: UseTasks }) {
  const [showForm, setShowForm] = useState(false);
  const weeklyCount = store.tasks.filter((t) => t.is_selected_this_week).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">All tasks</h1>
          <p className="text-sm text-slate-500">Ranked by priority score, highest first.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + New task
          </button>
        )}
      </div>

      {showForm && (
        <TaskForm onSubmit={store.createTask} onCancel={() => setShowForm(false)} />
      )}

      {store.loading ? (
        <p className="py-10 text-center text-slate-400">Loading tasks…</p>
      ) : store.tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center">
          <p className="text-slate-500">No tasks yet.</p>
          <p className="text-sm text-slate-400">
            Create one and break it into {5}–{7} milestones to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {store.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              weeklyCount={weeklyCount}
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
