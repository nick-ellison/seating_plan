// app/components/CsvImportSection.tsx
"use client";

type Props = {
  csvLoading: boolean;
  csvWarnings: string[];
  onUpload: (file: File | null) => void;
  onExport: () => void;
};

export function CsvImportSection({
  csvLoading,
  csvWarnings,
  onUpload,
  onExport,
}: Props) {
  return (
    <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 mb-1">
            Import guests from CSV
          </h2>
          <p className="text-xs text-slate-400">
            Upload a wedding CSV. It will be mapped into the generic guest model
            for the solver.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-300 cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-950 hover:border-teal-400 hover:text-teal-300 transition-colors">
            <span>{csvLoading ? "Importing…" : "Choose CSV file"}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
              disabled={csvLoading}
            />
          </label>
          <button
            type="button"
            onClick={onExport}
            className="text-[11px] px-3 py-1.5 rounded-md border border-slate-700 bg-slate-950 hover:border-teal-400 hover:text-teal-300 transition-colors"
          >
            Export guests CSV
          </button>
        </div>
      </div>

      {csvWarnings.length > 0 && (
        <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
          <h3 className="text-xs font-semibold text-amber-300 mb-1">
            Import warnings
          </h3>
          <ul className="text-xs text-amber-100 space-y-1 list-disc list-inside">
            {csvWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
