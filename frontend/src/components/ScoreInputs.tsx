import { previewScore } from "../types";

interface Props {
  impact: number;
  effort: number;
  urgency: number;
  onChange: (field: "impact" | "effort" | "urgency", value: number) => void;
}

const FIELDS: { key: "impact" | "urgency" | "effort"; label: string; hint: string }[] = [
  { key: "impact", label: "Impact", hint: "How much it matters" },
  { key: "urgency", label: "Urgency", hint: "How time-sensitive" },
  { key: "effort", label: "Effort", hint: "How much work (lowers priority)" },
];

export function ScoreInputs({ impact, effort, urgency, onChange }: Props) {
  const values = { impact, effort, urgency };
  const score = previewScore(impact, urgency, effort);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {FIELDS.map(({ key, label, hint }) => (
          <label key={key} className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink/60">
              {label}
            </span>
            <span className="block text-[10px] font-medium text-ink/40">{hint}</span>
            <select
              className="mt-1 w-full rounded-md border-2 border-ink/20 bg-bone px-2 py-1.5 text-sm font-medium text-ink transition focus:border-ink focus:outline-none"
              value={values[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {/* Live priority preview as a mini scorecard chip, matching the card hero badge. */}
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink/60">
        Priority Preview
        <span className="rounded border-2 border-ink bg-ink px-2 py-0.5 font-display text-base leading-none text-bone">
          {score}
        </span>
      </div>
    </div>
  );
}
