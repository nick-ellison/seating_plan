// app/components/WeightsPanel.tsx
"use client";

import { Weights } from "../types";
import { WeightSliderRow } from "./WeightSliderRow";

type Props = {
  weights: Weights;
  onChange: (next: Weights) => void;
  onReset: () => void;
};

export function WeightsPanel({ weights, onChange, onReset }: Props) {
  return (
    <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Optimisation weights
          </h2>
          <p className="text-[11px] text-slate-500">
            Tune how strongly the solver cares about each constraint. Higher
            values make a constraint more important.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] px-2 py-1 rounded-md border border-slate-700 bg-slate-950 hover:border-teal-400 hover:text-teal-300 transition-colors"
        >
          Reset weights
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <WeightSliderRow
          label="Must-not violations"
          description="Penalty for seating guests next to people they must not sit with."
          value={weights.mustNotWeight}
          onChange={(v) => onChange({ ...weights, mustNotWeight: v })}
          min={5}
          max={20}
        />
        <WeightSliderRow
          label="Wants satisfied"
          description="Reward for honouring 'wants to sit next to' preferences."
          value={weights.wantsWeight}
          onChange={(v) => onChange({ ...weights, wantsWeight: v })}
        />
        <WeightSliderRow
          label="Adjacent singles"
          description="Encourage or discourage clusters of singles."
          value={weights.adjacentSinglesWeight}
          onChange={(v) => onChange({ ...weights, adjacentSinglesWeight: v })}
        />
        <WeightSliderRow
          label="Same-gender adjacencies"
          description="Balance or separate guests by gender."
          value={weights.sameGenderAdjWeight}
          onChange={(v) => onChange({ ...weights, sameGenderAdjWeight: v })}
        />
        <WeightSliderRow
          label="Alternating tables"
          description="Reward well-mixed tables (e.g. bride/groom sides)."
          value={weights.alternatingTablesWeight}
          onChange={(v) => onChange({ ...weights, alternatingTablesWeight: v })}
        />
        <WeightSliderRow
          label="Split couples"
          description="Penalty for separating couples across tables."
          value={weights.splitCouplesWeight}
          onChange={(v) => onChange({ ...weights, splitCouplesWeight: v })}
          min={5}
          max={20}
        />
      </div>
    </section>
  );
}
