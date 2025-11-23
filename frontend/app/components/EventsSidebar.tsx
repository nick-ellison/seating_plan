// app/components/EventsSidebar.tsx
"use client";

import { EventSummary } from "../types";

type Props = {
  events: EventSummary[];
  loading: boolean;
  error: string | null;
  selectedEventId: number | null;
  onRefresh: () => void;
  onSelectEvent: (id: number) => void;
};

export function EventsSidebar({
  events,
  loading,
  error,
  selectedEventId,
  onRefresh,
  onSelectEvent,
}: Props) {
  return (
    <aside className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          My events
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="text-[10px] px-2 py-0.5 rounded-md border border-slate-700 bg-slate-950 hover:border-teal-400 hover:text-teal-300 disabled:opacity-60"
        >
          {loading ? "…" : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="mb-2 text-[11px] text-red-400">
          Couldn&apos;t load events: {error}
        </p>
      )}

      {events.length === 0 && !loading && !error && (
        <p className="text-[11px] text-slate-500">
          No saved events yet. Save your first configuration to see it here.
        </p>
      )}

      <div className="mt-1 space-y-1 overflow-y-auto">
        {events.map((ev) => (
          <button
            key={ev.id}
            type="button"
            onClick={() => onSelectEvent(ev.id)}
            className={`w-full text-left px-2 py-1 rounded-md border text-[11px] transition-colors ${
              selectedEventId === ev.id
                ? "border-teal-500 bg-teal-500/10 text-teal-200"
                : "border-slate-800 bg-slate-950/40 hover:border-teal-400/60 hover:text-teal-200"
            }`}
          >
            <div className="truncate font-medium">{ev.name}</div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] text-slate-500">
                {ev.profile} • {ev.guestCount} guests
              </span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
