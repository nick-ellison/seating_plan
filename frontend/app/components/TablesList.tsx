
// app/components/TablesList.tsx
"use client";

import { SeatingPlanResponse } from "../types";

type Props = {
  result: SeatingPlanResponse;
};

export function TablesList({ result }: Props) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
      <h2 className="text-sm font-semibold mb-3 text-slate-100">
        Tables (raw placement)
      </h2>
      <div className="space-y-3 text-sm text-slate-200">
        {result.tables.map((t) => (
          <div
            key={t.tableId}
            className="border-b border-slate-800 pb-2 last:border-b-0 last:pb-0"
          >
            <div className="font-medium mb-1 text-teal-300">
              Table {t.tableId}
            </div>
            <ol className="list-decimal list-inside text-xs text-slate-300">
              {t.seats.map((seat) => (
                <li key={seat.seatIndex}>
                  Seat {seat.seatIndex}:{" "}
                  <code className="bg-slate-950/80 px-1 rounded">
                    {seat.guestId}
                  </code>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
