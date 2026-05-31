import { useState } from "react";
import { useTasks } from "./hooks/useTasks";
import { TasksPage } from "./pages/TasksPage";
import { WeekPage } from "./pages/WeekPage";

type Tab = "tasks" | "week";

const TABS: { id: Tab; label: string }[] = [
  { id: "tasks", label: "All Tasks" },
  { id: "week", label: "This Week" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("tasks");
  const store = useTasks();

  return (
    <div className="min-h-screen">
      {/* Dark fight-card banner so the wordmark + tabs read as the poster's masthead. */}
      <header className="border-b-4 border-ink bg-ink text-bone">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-3">
            <span className="text-4xl leading-none" aria-hidden>
              🥊
            </span>
            <div>
              <p className="eyebrow text-gold">Weekly Fight Card</p>
              <h1 className="font-display text-3xl uppercase leading-none tracking-wide sm:text-4xl">
                Task <span className="text-knockout">Puncher</span>
              </h1>
            </div>
          </div>

          <nav className="flex gap-2">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-md border-2 px-4 py-2 text-sm font-extrabold uppercase tracking-wide transition ${
                    active
                      ? "border-gold bg-gold text-ink shadow-punch-sm"
                      : "border-bone/30 text-bone/70 hover:border-bone hover:text-bone"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {store.error && (
        // Knockout-red banner so API errors are impossible to miss; keeps clearError logic.
        <div className="mx-auto mt-4 max-w-5xl px-4">
          <div className="flex items-center justify-between gap-3 rounded-md border-2 border-ink bg-knockout px-4 py-3 text-sm font-semibold text-white shadow-punch-sm">
            <span>
              <span className="mr-2 font-display uppercase tracking-wide">Low blow!</span>
              {store.error}
            </span>
            <button
              onClick={store.clearError}
              className="shrink-0 rounded border-2 border-white/80 px-2 py-0.5 text-xs font-bold uppercase hover:bg-white hover:text-knockout"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8">
        {tab === "tasks" ? <TasksPage store={store} /> : <WeekPage store={store} />}
      </main>
    </div>
  );
}
