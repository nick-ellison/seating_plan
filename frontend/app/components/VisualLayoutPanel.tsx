// app/components/VisualLayoutPanel.tsx
"use client";

import { SeatingPlanResponse, Guest } from "../types";
import { SeatingLayout } from "./SeatingLayout";

type Props = {
  result: SeatingPlanResponse;
  guestsById: Map<string, Guest>;
  getTableShape: (tableId: string) => "round" | "trestle";
};

export function VisualLayoutPanel({
  result,
  guestsById,
  getTableShape,
}: Props) {
  return (
    <section className="mt-6 bg-slate-900 rounded-xl border border-slate-800 p-4">
      <h2 className="text-sm font-semibold mb-3 text-slate-100">
        Visual seating layout
      </h2>
      <p className="text-[11px] text-slate-500 mb-3">
        SVG-based rendering of tables and seats.
      </p>
      <SeatingLayout
        plan={result}
        guestsById={guestsById}
        getTableShape={getTableShape}
      />
    </section>
  );
}
