// app/components/SaveEventBar.tsx
"use client";

type Props = {
  eventName: string;
  onEventNameChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  currentEventId: number | null;
};

export function SaveEventBar({
  eventName,
  onEventNameChange,
  onSave,
  saving,
  currentEventId,
}: Props) {
  return (
    <section className="mb-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-200 mb-1">
          Event name
        </label>
        <input
          type="text"
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400"
          placeholder="e.g. Nick & Charlotte — Evening Reception"
          value={eventName}
          onChange={(e) => onEventNameChange(e.target.value)}
        />
        <p className="mt-1 text-[11px] text-slate-500">
          Name this configuration so you can reload it later.{" "}
          {currentEventId && (
            <span className="text-teal-300">
              (Currently viewing event #{currentEventId})
            </span>
          )}
        </p>
      </div>
      <div className="flex items-end md:items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-3 py-1.5 rounded-md bg-teal-500 text-slate-950 text-xs font-medium hover:bg-teal-400 disabled:bg-teal-800 disabled:text-slate-300 transition-colors whitespace-nowrap"
        >
          {saving ? "Saving…" : "Save as event"}
        </button>
      </div>
    </section>
  );
}
