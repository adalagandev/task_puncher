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
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <span className="block text-xs text-slate-400">{hint}</span>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
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
      <div className="text-sm text-slate-600">
        Priority score preview:{" "}
        <span className="font-semibold text-indigo-600">{score}</span>
      </div>
    </div>
  );
}
