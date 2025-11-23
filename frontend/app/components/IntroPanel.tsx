// app/components/IntroPanel.tsx
"use client";

export function IntroPanel() {
  return (
    <section className="mb-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 mb-1">
            Seating Solver Playground
          </h2>
          <p className="text-sm text-slate-400">
            Use this internal tool to exercise the ArrangeIQ solver profiles.
            Paste guests/tables JSON, tweak parameters, import real CSVs, tune
            weights and inspect metrics.
          </p>
        </div>
        <div className="text-xs text-slate-400 md:text-right">
          <div>Profile-driven · Seeded · Weighted</div>
          <div>Designed for multi-profile optimisation</div>
        </div>
      </div>
    </section>
  );
}
