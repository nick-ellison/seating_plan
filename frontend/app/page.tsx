"use client";

import React, { useState } from "react";

type SeatingPlanResponse = {
  tables: {
    tableId: string;
    seats: { seatIndex: number; guestId: string }[];
  }[];
  metrics: {
    mustNotViolations: number;
    wantsSatisfied: number;
    adjacentSingles: number;
    sameGenderAdjacencies: number;
    alternatingTables: number;
    splitCouples: number;
  };
  attemptsMade: number;
};

const API_BASE_URL = "http://127.0.0.1:8000";

const SAMPLE_GUESTS_AND_TABLES = {
  guests: [
    {
      id: "g1",
      name: "Nick",
      gender: "Male",
      maritalStatus: "Married to Charlotte",
      wantsToSitNextTo: ["g2"],
      mustNotSitNextTo: [],
      tags: ["VIP"],
      attributes: { side: "groom" },
    },
    {
      id: "g2",
      name: "Charlotte",
      gender: "Female",
      maritalStatus: "Married to Nick",
      wantsToSitNextTo: ["g1"],
      mustNotSitNextTo: [],
      tags: [],
      attributes: { side: "bride" },
    },
    {
      id: "g3",
      name: "Tim",
      gender: "Male",
      maritalStatus: "Single",
      wantsToSitNextTo: [],
      mustNotSitNextTo: [],
      tags: [],
      attributes: {},
    },
    {
      id: "g4",
      name: "Daisy",
      gender: "Female",
      maritalStatus: "Single",
      wantsToSitNextTo: [],
      mustNotSitNextTo: [],
      tags: [],
      attributes: {},
    },
  ],
  tables: [
    {
      id: "t1",
      name: "Table 1",
      shape: "round",
      capacity: 4,
    },
  ],
};

export default function HomePage() {
  const [profile, setProfile] = useState<string>("wedding_default");
  const [maxAttempts, setMaxAttempts] = useState<number>(1000);
  const [seed, setSeed] = useState<number | "">("");
  const [jsonInput, setJsonInput] = useState<string>(
    JSON.stringify(SAMPLE_GUESTS_AND_TABLES, null, 2)
  );
  const [result, setResult] = useState<SeatingPlanResponse | null>(null);
  const [rawResult, setRawResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleUseSample = () => {
    setJsonInput(JSON.stringify(SAMPLE_GUESTS_AND_TABLES, null, 2));
    setResult(null);
    setRawResult(null);
    setError(null);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setRawResult(null);

    try {
      const parsed = JSON.parse(jsonInput);

      if (!parsed.guests || !parsed.tables) {
        throw new Error(
          "JSON must contain top-level 'guests' and 'tables' properties."
        );
      }

      const body = {
        guests: parsed.guests,
        tables: parsed.tables,
        profile,
        maxAttempts,
        seed: seed === "" ? undefined : Number(seed),
      };

      const res = await fetch(`${API_BASE_URL}/api/seating/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.detail || `API error (${res.status}): ${res.statusText}`
        );
      }

      setResult(data as SeatingPlanResponse);
      setRawResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top brand bar */}
      <header className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo placeholder / mark */}
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
              API base:{" "}
              <code className="text-teal-300">{API_BASE_URL}</code>
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Intro panel */}
        <section className="mb-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 mb-1">
                Seating Solver Playground
              </h2>
              <p className="text-sm text-slate-400">
                Use this internal tool to exercise the ArrangeIQ solver profiles.
                Paste guests/tables JSON, tweak parameters, and inspect metrics.
              </p>
            </div>
            <div className="text-xs text-slate-400 md:text-right">
              <div>Profile-driven · Seeded · Deterministic</div>
              <div>Designed for future multi-profile optimisation</div>
            </div>
          </div>
        </section>

        {/* Controls */}
        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-200">
              Profile
            </label>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400"
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
            >
              <option value="wedding_default">wedding_default</option>
              <option value="corporate_default" disabled>
                corporate_default (coming soon)
              </option>
            </select>
            <p className="text-[11px] text-slate-500">
              Profiles define scoring priorities and behaviour presets.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-200">
              Max attempts
            </label>
            <input
              type="number"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400"
              value={maxAttempts}
              min={1}
              onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)}
            />
            <p className="text-[11px] text-slate-500">
              Upper bound on solver search iterations.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-200">
              Seed{" "}
              <span className="text-slate-500">(optional, for reproducibility)</span>
            </label>
            <input
              type="number"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400"
              value={seed}
              onChange={(e) =>
                setSeed(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="leave blank for random"
            />
            <p className="text-[11px] text-slate-500">
              Use the same seed to reproduce a given seating plan.
            </p>
          </div>
        </section>

        {/* JSON editor */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-slate-200">
              Guests &amp; Tables JSON (input)
            </h2>
            <button
              type="button"
              onClick={handleUseSample}
              className="text-[11px] px-2 py-1 rounded-md border border-slate-700 bg-slate-900 text-slate-100 hover:border-teal-400 hover:text-teal-300 transition-colors"
            >
              Use sample data
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={16}
            className="w-full font-mono text-xs rounded-md border border-slate-800 p-2 bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
          <p className="mt-2 text-[11px] text-slate-500">
            JSON must include top-level <code className="text-teal-300">guests</code>{" "}
            and <code className="text-teal-300">tables</code> arrays.
          </p>
        </section>

        {/* Actions */}
        <section className="mb-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-teal-500 text-slate-950 text-sm font-medium hover:bg-teal-400 disabled:bg-teal-800 disabled:text-slate-300 transition-colors"
          >
            {loading ? "Generating seating..." : "Generate seating plan"}
          </button>
          {error && (
            <span className="text-sm text-red-400">
              Error: {error}
            </span>
          )}
        </section>

        {/* Results */}
        {result && (
          <section className="grid gap-6 md:grid-cols-2 mt-4">
            {/* Metrics summary */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
              <h2 className="text-sm font-semibold mb-3 text-slate-100">
                Solver metrics
              </h2>
              <ul className="text-sm space-y-1 text-slate-200">
                <li>
                  <strong className="text-slate-100">
                    Must-not violations:
                  </strong>{" "}
                  {result.metrics.mustNotViolations}
                </li>
                <li>
                  <strong className="text-slate-100">Wants satisfied:</strong>{" "}
                  {result.metrics.wantsSatisfied}
                </li>
                <li>
                  <strong className="text-slate-100">Adjacent singles:</strong>{" "}
                  {result.metrics.adjacentSingles}
                </li>
                <li>
                  <strong className="text-slate-100">
                    Same-gender adjacencies:
                  </strong>{" "}
                  {result.metrics.sameGenderAdjacencies}
                </li>
                <li>
                  <strong className="text-slate-100">
                    Alternating tables:
                  </strong>{" "}
                  {result.metrics.alternatingTables}
                </li>
                <li>
                  <strong className="text-slate-100">Split couples:</strong>{" "}
                  {result.metrics.splitCouples}
                </li>
                <li>
                  <strong className="text-slate-100">Attempts made:</strong>{" "}
                  {result.attemptsMade}
                </li>
              </ul>
              <p className="mt-3 text-[11px] text-slate-500">
                Metrics reflect the current profile ({profile}) and weights
                defined in the backend.
              </p>
            </div>

            {/* Tables view */}
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
          </section>
        )}

        {/* Raw JSON output (for debugging/dev) */}
        {rawResult && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold mb-2 text-slate-100">
              Raw API response
            </h2>
            <pre className="w-full font-mono text-xs rounded-md border border-slate-800 p-2 bg-slate-950 text-slate-100 overflow-x-auto">
{rawResult}
            </pre>
            <p className="mt-2 text-[11px] text-slate-500">
              Use this output to debug solver behaviour, metrics, and future
              profile extensions.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
