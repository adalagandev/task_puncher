import { useMemo, useState } from "react";
import { TaskCard } from "../components/TaskCard";
import { TaskForm } from "../components/TaskForm";
import type { UseTasks } from "../hooks/useTasks";
import { MILESTONE_MAX, MILESTONE_MIN } from "../types";

export function TasksPage({ store }: { store: UseTasks }) {
  const [showForm, setShowForm] = useState(false);
  const weeklyCount = store.tasks.filter((t) => t.is_selected_this_week).length;

  // The dashboard is about the 3 things to do now: only active (not-completed) tasks,
  // top 3 by score. store.tasks already arrives sorted by priority_score from the API.
  const focusTasks = useMemo(
    () => store.tasks.filter((t) => t.status !== "completed").slice(0, 3),
    [store.tasks],
  );

  // Stamp today's date next to the heading using the browser's own locale + timezone,
  // computed once per mount so it reflects when the lineup was opened.
  const today = useMemo(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const date = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());
    return `${date} · ${timeZone}`;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-knockout">The Lineup</p>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-4xl uppercase leading-none tracking-wide text-ink">
              {/* Decorative smiley; aria-hidden so screen readers still announce just "All Tasks". */}
              <span aria-hidden="true">&#x1F60A;</span> This Week&apos;s Card
            </h2>
            {/* Same display font/size/transform as the heading, just muted so it reads as a sibling not a banner. */}
            <span className="font-display text-4xl uppercase leading-none tracking-wide text-ink/50">
              {today}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-ink/60">
            Your 3 to focus on — ranked by priority score.
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
      ) : focusTasks.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-ink/30 bg-canvas/50 py-16 text-center">
          <p className="text-4xl" aria-hidden>
            🥊
          </p>
          <p className="mt-2 font-display text-2xl uppercase tracking-wide text-ink">
            {store.tasks.length === 0 ? "No contenders yet" : "Clean sweep"}
          </p>
          <p className="mt-1 text-sm font-medium text-ink/50">
            {store.tasks.length === 0
              ? `Create a task and break it into ${MILESTONE_MIN}–${MILESTONE_MAX} milestones to step in the ring.`
              : "Every active task is done — create a new one to keep the streak going."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Staggered slam-in so cards cascade rather than popping in all at once. */}
          {focusTasks.map((task, i) => (
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
