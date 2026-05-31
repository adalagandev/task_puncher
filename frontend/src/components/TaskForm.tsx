import { useState } from "react";
import type { MilestoneInput, TaskInput } from "../types";
import { MILESTONE_MAX, MILESTONE_MIN } from "../types";
import { ScoreInputs } from "./ScoreInputs";

interface Props {
  onSubmit: (data: TaskInput) => Promise<boolean>;
  onCancel: () => void;
}

const emptyMilestone = (): MilestoneInput => ({ title: "", relevance: "" });

export function TaskForm({ onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scores, setScores] = useState({ impact: 3, effort: 3, urgency: 3 });
  const [milestones, setMilestones] = useState<MilestoneInput[]>(
    Array.from({ length: MILESTONE_MIN }, emptyMilestone)
  );
  const [submitting, setSubmitting] = useState(false);

  const updateMilestone = (i: number, field: keyof MilestoneInput, value: string) =>
    setMilestones((ms) => ms.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));

  const addMilestone = () =>
    setMilestones((ms) => (ms.length < MILESTONE_MAX ? [...ms, emptyMilestone()] : ms));

  const removeMilestone = (i: number) =>
    setMilestones((ms) => (ms.length > MILESTONE_MIN ? ms.filter((_, idx) => idx !== i) : ms));

  const canSubmit =
    title.trim().length > 0 && milestones.every((m) => m.title.trim().length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const ok = await onSubmit({
      title: title.trim(),
      description: description.trim(),
      ...scores,
      milestones: milestones.map((m, i) => ({
        title: m.title.trim(),
        relevance: m.relevance.trim(),
        order: i,
      })),
    });
    setSubmitting(false);
    if (ok) onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900">New task</h2>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Title</span>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Ship the onboarding flow"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Description</span>
        <textarea
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <ScoreInputs
        impact={scores.impact}
        effort={scores.effort}
        urgency={scores.urgency}
        onChange={(field, value) => setScores((s) => ({ ...s, [field]: value }))}
      />

      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">
            Milestones ({milestones.length}/{MILESTONE_MAX})
          </span>
          <button
            type="button"
            onClick={addMilestone}
            disabled={milestones.length >= MILESTONE_MAX}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-40"
          >
            + Add milestone
          </button>
        </div>
        <p className="mb-2 text-xs text-slate-400">
          Each task needs {MILESTONE_MIN}–{MILESTONE_MAX} milestones. Explain why each matters.
        </p>
        <div className="space-y-2">
          {milestones.map((m, i) => (
            <div key={i} className="rounded-md border border-slate-200 p-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">{i + 1}</span>
                <input
                  className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Milestone title"
                  value={m.title}
                  onChange={(e) => updateMilestone(i, "title", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeMilestone(i)}
                  disabled={milestones.length <= MILESTONE_MIN}
                  className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                  title="Remove milestone"
                >
                  ✕
                </button>
              </div>
              <input
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                placeholder="Relevance — why this milestone matters to the task"
                value={m.relevance}
                onChange={(e) => updateMilestone(i, "relevance", e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {submitting ? "Creating…" : "Create task"}
        </button>
      </div>
    </form>
  );
}
