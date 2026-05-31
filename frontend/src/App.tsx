import { useState } from "react";
import { useTasks } from "./hooks/useTasks";
import { TasksPage } from "./pages/TasksPage";
import { WeekPage } from "./pages/WeekPage";

type Tab = "tasks" | "week";

export default function App() {
  const [tab, setTab] = useState<Tab>("tasks");
  const store = useTasks();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🥊</span>
            <span className="font-bold text-slate-900">Task Puncher</span>
          </div>
          <nav className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {(["tasks", "week"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  tab === t
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t === "tasks" ? "All tasks" : "This week"}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {store.error && (
        <div className="mx-auto mt-4 max-w-5xl px-4">
          <div className="flex items-center justify-between rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            <span>{store.error}</span>
            <button onClick={store.clearError} className="font-medium hover:underline">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6">
        {tab === "tasks" ? <TasksPage store={store} /> : <WeekPage store={store} />}
      </main>
    </div>
  );
}
