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

  // Reused so the form reads as one consistent fight-card surface.
  const fieldClass =
    "mt-1 w-full rounded-md border-2 border-ink/20 bg-bone px-3 py-2 text-sm font-medium text-ink placeholder:text-ink/30 transition focus:border-ink focus:outline-none";
  const labelClass = "text-[11px] font-bold uppercase tracking-wider text-ink/60";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-lg border-2 border-ink bg-canvas p-5 shadow-punch"
    >
      <div>
        <p className="eyebrow text-knockout">Step Into the Ring</p>
        <h2 className="font-display text-2xl uppercase leading-none tracking-wide text-ink">
          New Task
        </h2>
      </div>

      <label className="block">
        <span className={labelClass}>Title</span>
        <input
          className={fieldClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Ship the onboarding flow"
        />
      </label>

      <label className="block">
        <span className={labelClass}>Description</span>
        <textarea
          className={fieldClass}
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
          <span className={labelClass}>
            Milestones ({milestones.length}/{MILESTONE_MAX})
          </span>
          <button
            type="button"
            onClick={addMilestone}
            disabled={milestones.length >= MILESTONE_MAX}
            className="text-xs font-extrabold uppercase tracking-wide text-knockout transition hover:text-ink disabled:opacity-40 disabled:hover:text-knockout"
          >
            + Add Milestone
          </button>
        </div>
        <p className="mb-2 mt-1 text-xs font-medium text-ink/50">
          Each task needs {MILESTONE_MIN}–{MILESTONE_MAX} milestones. Explain why each matters.
        </p>
        <div className="space-y-2">
          {milestones.map((m, i) => (
            <div key={i} className="rounded-md border-2 border-ink/15 bg-bone p-2.5">
              <div className="flex items-center gap-2">
                {/* Zero-padded round number echoes the milestone scorecard on the cards. */}
                <span className="font-display text-sm leading-none text-ink/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <input
                  className="flex-1 rounded border-2 border-ink/20 bg-canvas px-2 py-1 text-sm font-medium text-ink placeholder:text-ink/30 transition focus:border-ink focus:outline-none"
                  placeholder="Milestone title"
                  value={m.title}
                  onChange={(e) => updateMilestone(i, "title", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeMilestone(i)}
                  disabled={milestones.length <= MILESTONE_MIN}
                  className="text-ink/30 transition hover:text-knockout disabled:opacity-30 disabled:hover:text-ink/30"
                  title="Remove milestone"
                >
                  ✕
                </button>
              </div>
              <input
                className="mt-1.5 w-full rounded border-2 border-ink/15 bg-canvas px-2 py-1 text-xs text-ink placeholder:text-ink/30 transition focus:border-ink focus:outline-none"
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
          className="rounded-md border-2 border-ink/20 px-4 py-2 text-sm font-bold uppercase tracking-wide text-ink/60 transition hover:border-ink hover:text-ink"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="rounded-md border-2 border-ink bg-knockout px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-punch transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-punch-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {submitting ? "Creating…" : "Create Task"}
        </button>
      </div>
    </form>
  );
}
