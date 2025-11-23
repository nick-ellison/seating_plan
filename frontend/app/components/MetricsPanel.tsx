// app/components/MetricsPanel.tsx
"use client";

import { SeatingPlanResponse, Weights } from "../types";

type Props = {
  result: SeatingPlanResponse;
  profile: string;
  weights: Weights;
};

export function MetricsPanel({ result, profile, weights }: Props) {
  const m = result.metrics;
  const score =
    -m.mustNotViolations * weights.mustNotWeight +
    m.wantsSatisfied * weights.wantsWeight -
    m.adjacentSingles * weights.adjacentSinglesWeight -
    m.sameGenderAdjacencies * weights.sameGenderAdjWeight +
    m.alternatingTables * weights.alternatingTablesWeight -
    m.splitCouples * weights.splitCouplesWeight;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
      <h2 className="text-sm font-semibold mb-3 text-slate-100">
        Solver metrics
      </h2>
      <p className="text-sm mb-2 text-slate-200">
        <span className="font-semibold">Weighted score: </span>
        <span className="font-mono text-teal-300">{score.toFixed(1)}</span>
      </p>
      <ul className="text-sm space-y-1 text-slate-200">
        <li>
          <strong className="text-slate-100">Must-not violations:</strong>{" "}
          {m.mustNotViolations}
        </li>
        <li>
          <strong className="text-slate-100">Wants satisfied:</strong>{" "}
          {m.wantsSatisfied}
        </li>
        <li>
          <strong className="text-slate-100">Adjacent singles:</strong>{" "}
          {m.adjacentSingles}
        </li>
        <li>
          <strong className="text-slate-100">Same-gender adjacencies:</strong>{" "}
          {m.sameGenderAdjacencies}
        </li>
        <li>
          <strong className="text-slate-100">Alternating tables:</strong>{" "}
          {m.alternatingTables}
        </li>
        <li>
          <strong className="text-slate-100">Split couples:</strong>{" "}
          {m.splitCouples}
        </li>
        <li>
          <strong className="text-slate-100">Attempts made:</strong>{" "}
          {result.attemptsMade}
        </li>
      </ul>
      <p className="mt-3 text-[11px] text-slate-500">
        Metrics reflect the current profile ({profile}) and the weights
        you&apos;ve configured above.
      </p>
    </div>
  );
}
