// app/components/BrandHeader.tsx
"use client";

import { API_BASE_URL } from "../types";

export function BrandHeader() {
  return (
    <header className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-teal-400/20 border border-teal-400/60 flex items-center justify-center">
            <span className="text-xs font-semibold text-teal-300">IQ</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">
                ArrangeIQ
              </h1>
              <span className="inline-flex items-center rounded-full border border-teal-400/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-teal-300 bg-teal-400/10">
                Dev Console
              </span>
            </div>
            <p className="text-xs text-slate-400">
              The Intelligent Seating Engine — JSON in, optimised seating out.
            </p>
          </div>
        </div>
        <div className="hidden md:block">
          <span className="text-[11px] text-slate-500">
            API base: <code className="text-teal-300">{API_BASE_URL}</code>
          </span>
        </div>
      </div>
    </header>
  );
}
