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

      {store.error && !store.unreachable && (
        // Knockout-red banner so API errors are impossible to miss; keeps clearError logic.
        // Suppressed when unreachable — that gets its own full panel below.
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
        {store.unreachable ? (
          // Friendly stand-in when the API is down: name the likely cause and offer
          // a Retry, instead of leaking the raw Vite proxy 5xx into the error banner.
          <div className="rounded-lg border-2 border-dashed border-ink/30 bg-canvas/50 py-16 text-center">
            <p className="text-4xl" aria-hidden>
              🔌
            </p>
            <p className="mt-2 font-display text-2xl uppercase tracking-wide text-ink">
              Can&apos;t reach the server
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm font-medium text-ink/60">
              The API isn&apos;t responding. Is the backend running on{" "}
              <code className="font-mono text-ink/80">:8000</code>? Start it with{" "}
              <code className="font-mono text-ink/80">uvicorn app.main:app --reload</code> (or{" "}
              <code className="font-mono text-ink/80">.\dev.ps1</code>), then retry.
            </p>
            <button
              onClick={store.refresh}
              disabled={store.loading}
              className="mt-5 rounded-md border-2 border-ink bg-knockout px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-punch transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-punch-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {store.loading ? "Retrying…" : "Retry"}
            </button>
          </div>
        ) : tab === "tasks" ? (
          <TasksPage store={store} />
        ) : (
          <WeekPage store={store} />
        )}
      </main>
    </div>
  );
}
