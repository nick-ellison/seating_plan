"use client";

import React, { useState, useMemo, useCallback } from "react";
import { SeatingLayout } from "./components/SeatingLayout"; // adjust path as needed

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

type Guest = {
  id: string;
  name: string;
  gender?: string | null;
  maritalStatus?: string | null;
  wantsToSitNextTo: string[];
  mustNotSitNextTo: string[];
  tags: string[];
  attributes: Record<string, any>;
};

type CsvImportResponse = {
  guests: Guest[];
  warnings: string[];
};

type TableConfig = {
  id: string;
  name: string;
  shape?: "round" | "trestle";
  capacity?: number;
};

// NEW: Weights type for optimisation controls
type Weights = {
  mustNotWeight: number;
  wantsWeight: number;
  adjacentSinglesWeight: number;
  sameGenderAdjWeight: number;
  alternatingTablesWeight: number;
  splitCouplesWeight: number;
};

// NEW: default weights
const DEFAULT_WEIGHTS: Weights = {
  mustNotWeight: 10,
  wantsWeight: 5,
  adjacentSinglesWeight: 3,
  sameGenderAdjWeight: 3,
  alternatingTablesWeight: 2,
  splitCouplesWeight: 8,
};

const API_BASE_URL = "http://127.0.0.1:8000";

const SAMPLE_GUESTS_AND_TABLES = {
  guests: [
    {
      id: "g1",
      name: "Nick Ellison",
      gender: "Male",
      maritalStatus: "Married to Charlotte Ellison",
      wantsToSitNextTo: ["g2"],
      mustNotSitNextTo: [],
      tags: ["VIP"],
      attributes: { side: "groom" },
    },
    {
      id: "g2",
      name: "Charlotte Ellison",
      gender: "Female",
      maritalStatus: "Married to Nick Ellison",
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

function isSeatingPlanResponse(data: any): data is SeatingPlanResponse {
  return (
    data &&
    Array.isArray(data.tables) &&
    typeof data.metrics === "object" &&
    typeof data.attemptsMade === "number"
  );
}

// NEW: reusable slider row for weights
type SliderProps = {
  label: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
};

const WeightSliderRow: React.FC<SliderProps> = ({
  label,
  description,
  value,
  min = 0,
  max = 10,
  step = 1,
  onChange,
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-slate-200">{label}</span>
      <span className="text-[11px] text-teal-300 font-mono">{value}</span>
    </div>
    {description && (
      <p className="text-[11px] text-slate-500 mb-1">{description}</p>
    )}
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-teal-400"
    />
  </div>
);

export default function HomePage() {
  const [profile, setProfile] = useState<string>("wedding_default");
  const [maxAttempts, setMaxAttempts] = useState<string>("1000");
  const [seed, setSeed] = useState<string>("");
  const [jsonInput, setJsonInput] = useState<string>(
    JSON.stringify(SAMPLE_GUESTS_AND_TABLES, null, 2)
  );
  const [result, setResult] = useState<SeatingPlanResponse | null>(null);
  const [rawResult, setRawResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [importedGuests, setImportedGuests] = useState<Guest[] | null>(null);
  const [csvWarnings, setCsvWarnings] = useState<string[]>([]);
  const [csvLoading, setCsvLoading] = useState<boolean>(false);

  // NEW: optimisation weights
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);

  // NEW: editable table configuration GUI
  const [tablesConfig, setTablesConfig] = useState<TableConfig[] | null>(
    SAMPLE_GUESTS_AND_TABLES.tables as TableConfig[]
  );

  const resetWeights = () => setWeights(DEFAULT_WEIGHTS);

  // Map of guests for the visual layout
  const guestsById = useMemo(() => {
    const map = new Map<string, Guest>();

    if (importedGuests) {
      importedGuests.forEach((g) => map.set(g.id, g));
      return map;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed.guests)) {
        parsed.guests.forEach((g: Guest) => {
          if (g && typeof g.id === "string") {
            map.set(g.id, g);
          }
        });
      }
    } catch {
      // ignore
    }

    return map;
  }, [importedGuests, jsonInput]);

  // Shape lookup for SeatingLayout – takes shapes from the table GUI / JSON
  const getTableShape = useCallback(
    (tableId: string): "round" | "trestle" => {
      const t = tablesConfig?.find((tbl) => tbl.id === tableId);
      if (t?.shape === "trestle") return "trestle";
      return "round";
    },
    [tablesConfig]
  );

  const handleUseSample = () => {
    setJsonInput(JSON.stringify(SAMPLE_GUESTS_AND_TABLES, null, 2));
    setResult(null);
    setRawResult(null);
    setError(null);
    setImportedGuests(null);
    setCsvWarnings([]);
    setTablesConfig(SAMPLE_GUESTS_AND_TABLES.tables as TableConfig[]);
    setWeights(DEFAULT_WEIGHTS);
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

      const maxAttemptsNumber = (() => {
        const n = Number(maxAttempts);
        return Number.isFinite(n) && n > 0 ? n : 1;
      })();

      const seedValue = (() => {
        const trimmed = seed.trim();
        if (trimmed === "") return undefined;
        const n = Number(trimmed);
        return Number.isFinite(n) ? n : undefined;
      })();

      const body = {
        guests: parsed.guests,
        tables: parsed.tables,
        profile,
        maxAttempts: maxAttemptsNumber,
        seed: seedValue,
        // NEW: send weights to backend
        weights,
      };

      const res = await fetch(`${API_BASE_URL}/api/seating/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        throw new Error(
          `API returned a non-JSON response (${res.status} ${res.statusText}).`
        );
      }

      if (!res.ok) {
        const detail =
          (data as any)?.detail ||
          `API error (${res.status}): ${res.statusText}`;
        throw new Error(detail);
      }

      if (!isSeatingPlanResponse(data)) {
        throw new Error("API response shape is not as expected.");
      }

      setResult(data);
      setRawResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (file: File | null) => {
    if (!file) return;
    setCsvLoading(true);
    setError(null);
    setCsvWarnings([]);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("profile", profile);

      const res = await fetch(`${API_BASE_URL}/api/guests/import-csv`, {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as CsvImportResponse;

      if (!res.ok) {
        throw new Error(
          (data as any)?.detail ||
            `CSV import failed (${res.status}: ${res.statusText})`
        );
      }

      setImportedGuests(data.guests);
      setCsvWarnings(data.warnings || []);

      try {
        const parsed = JSON.parse(jsonInput);
        parsed.guests = data.guests;
        setJsonInput(JSON.stringify(parsed, null, 2));
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "CSV import failed");
    } finally {
      setCsvLoading(false);
    }
  };

  const handleExportCsv = () => {
    let guests: Guest[] = importedGuests || [];

    if (!guests.length) {
      try {
        const parsed = JSON.parse(jsonInput);
        if (Array.isArray(parsed.guests)) {
          guests = parsed.guests;
        }
      } catch {
        // no-op
      }
    }

    if (!guests.length) {
      setError("No guests available to export.");
      return;
    }

    const header = [
      "Name",
      "Gender",
      "Marital_Status",
      "Wants to sit next to",
      "Must not sit next to",
    ];

    const rows = guests.map((g) => {
      const wantsNames =
        (g.attributes?.wantsByName as string[] | undefined) ?? [];
      const mustNotNames =
        (g.attributes?.mustNotByName as string[] | undefined) ?? [];

      return [
        g.name ?? "",
        g.gender ?? "",
        g.maritalStatus ?? "",
        wantsNames.join(", "),
        mustNotNames.join(", "),
      ];
    });

    const csvLines = [
      header.join(","),
      ...rows.map((r) =>
        r
          .map((cell) => {
            const v = String(cell ?? "");
            return v.includes(",") || v.includes('"')
              ? `"${v.replace(/"/g, '""')}"`
              : v;
          })
          .join(",")
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "guests_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const syncImportedToJson = () => {
    if (!importedGuests) return;
    try {
      const parsed = JSON.parse(jsonInput);
      parsed.guests = importedGuests;
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch {
      setError("Could not sync guests into JSON editor.");
    }
  };

  // TABLE GUI helpers

  const loadTablesFromJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed.tables)) {
        setTablesConfig(parsed.tables as TableConfig[]);
        setError(null);
      } else {
        setError("No 'tables' array found in JSON.");
      }
    } catch {
      setError("JSON is invalid; could not load tables.");
    }
  };

  const syncTablesToJson = () => {
    if (!tablesConfig) return;
    try {
      const parsed = JSON.parse(jsonInput);
      parsed.tables = tablesConfig;
      setJsonInput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch {
      setError("Could not sync tables into JSON editor.");
    }
  };

  const addTable = () => {
    setTablesConfig((current) => {
      const next = current ? [...current] : [];
      const index = next.length + 1;
      next.push({
        id: `t${index}`,
        name: `Table ${index}`,
        shape: "round",
        capacity: 10,
      });
      return next;
    });
  };

  const removeTableAt = (index: number) => {
    setTablesConfig((current) =>
      current ? current.filter((_, i) => i !== index) : current
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top brand bar */}
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

      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Intro panel */}
        <section className="mb-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 mb-1">
                Seating Solver Playground
              </h2>
              <p className="text-sm text-slate-400">
                Use this internal tool to exercise the ArrangeIQ solver
                profiles. Paste guests/tables JSON, tweak parameters, import
                real CSVs, tune weights and inspect metrics.
              </p>
            </div>
            <div className="text-xs text-slate-400 md:text-right">
              <div>Profile-driven · Seeded · Weighted</div>
              <div>Designed for multi-profile optimisation</div>
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
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setMaxAttempts("1");
                } else {
                  setMaxAttempts(raw);
                }
              }}
            />
            <p className="text-[11px] text-slate-500">
              Upper bound on solver search iterations.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-200">
              Seed{" "}
              <span className="text-slate-500">
                (optional, for reproducibility)
              </span>
            </label>
            <input
              type="number"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="leave blank for random"
            />
            <p className="text-[11px] text-slate-500">
              Use the same seed to reproduce a given seating plan.
            </p>
          </div>
        </section>

        {/* NEW: Weights / optimisation controls */}
        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Optimisation weights
              </h2>
              <p className="text-[11px] text-slate-500">
                Tune how strongly the solver cares about each constraint. Higher
                values make a constraint more important. Weights are sent with
                the current <code className="text-teal-300">profile</code> to
                the API.
              </p>
            </div>
            <button
              type="button"
              onClick={resetWeights}
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
              onChange={(v) =>
                setWeights((w) => ({ ...w, mustNotWeight: v }))
              }
              min={5}
              max={20}
            />
            <WeightSliderRow
              label="Wants satisfied"
              description="Reward for honouring 'wants to sit next to' preferences."
              value={weights.wantsWeight}
              onChange={(v) => setWeights((w) => ({ ...w, wantsWeight: v }))}
            />
            <WeightSliderRow
              label="Adjacent singles"
              description="Encourage or discourage clusters of singles."
              value={weights.adjacentSinglesWeight}
              onChange={(v) =>
                setWeights((w) => ({ ...w, adjacentSinglesWeight: v }))
              }
            />
            <WeightSliderRow
              label="Same-gender adjacencies"
              description="Balance or separate guests by gender."
              value={weights.sameGenderAdjWeight}
              onChange={(v) =>
                setWeights((w) => ({ ...w, sameGenderAdjWeight: v }))
              }
            />
            <WeightSliderRow
              label="Alternating tables"
              description="Reward well-mixed tables (e.g. bride/groom sides)."
              value={weights.alternatingTablesWeight}
              onChange={(v) =>
                setWeights((w) => ({ ...w, alternatingTablesWeight: v }))
              }
            />
            <WeightSliderRow
              label="Split couples"
              description="Penalty for separating couples across tables."
              value={weights.splitCouplesWeight}
              onChange={(v) =>
                setWeights((w) => ({ ...w, splitCouplesWeight: v }))
              }
              min={5}
              max={20}
            />
          </div>
        </section>

        {/* CSV Import */}
        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 mb-1">
                Import guests from CSV
              </h2>
              <p className="text-xs text-slate-400">
                Upload a wedding CSV. It will be mapped into the generic guest
                model for the solver. Currently supports the{" "}
                <span className="text-teal-300">wedding_default</span> profile.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300 cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-950 hover:border-teal-400 hover:text-teal-300 transition-colors">
                <span>{csvLoading ? "Importing…" : "Choose CSV file"}</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) =>
                    handleCsvUpload(e.target.files?.[0] ?? null)
                  }
                  disabled={csvLoading}
                />
              </label>
              <button
                type="button"
                onClick={handleExportCsv}
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

        {/* Editable guests table */}
        {importedGuests && (
          <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-100">
                Guests (editable)
              </h2>
              <button
                type="button"
                className="text-[11px] px-2 py-1 rounded-md border border-slate-700 bg-slate-950 hover:border-teal-400 hover:text-teal-300 transition-colors"
                onClick={syncImportedToJson}
              >
                Sync to JSON editor
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-slate-200">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-2 py-1 text-left">Name</th>
                    <th className="px-2 py-1 text-left">Gender</th>
                    <th className="px-2 py-1 text-left">Marital status</th>
                    <th className="px-2 py-1 text-left">Side</th>
                    <th className="px-2 py-1 text-left">Tags</th>
                    <th className="px-2 py-1 text-left">Wants (names)</th>
                    <th className="px-2 py-1 text-left">Must not (names)</th>
                  </tr>
                </thead>
                <tbody>
                  {importedGuests.map((guest, idx) => (
                    <tr
                      key={guest.id}
                      className="border-b border-slate-800 last:border-b-0"
                    >
                      <td className="px-2 py-1">
                        <input
                          className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                          value={guest.name}
                          onChange={(e) => {
                            const next = [...importedGuests];
                            next[idx] = { ...guest, name: e.target.value };
                            setImportedGuests(next);
                          }}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                          value={guest.gender ?? ""}
                          onChange={(e) => {
                            const next = [...importedGuests];
                            next[idx] = {
                              ...guest,
                              gender: e.target.value || null,
                            };
                            setImportedGuests(next);
                          }}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                          value={guest.maritalStatus ?? ""}
                          onChange={(e) => {
                            const next = [...importedGuests];
                            next[idx] = {
                              ...guest,
                              maritalStatus: e.target.value || null,
                            };
                            setImportedGuests(next);
                          }}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                          value={guest.attributes?.side ?? ""}
                          onChange={(e) => {
                            const next = [...importedGuests];
                            next[idx] = {
                              ...guest,
                              attributes: {
                                ...guest.attributes,
                                side: e.target.value,
                              },
                            };
                            setImportedGuests(next);
                          }}
                          placeholder="bride/groom/other"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                          value={guest.tags.join(", ")}
                          onChange={(e) => {
                            const tags = e.target.value
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean);
                            const next = [...importedGuests];
                            next[idx] = { ...guest, tags };
                            setImportedGuests(next);
                          }}
                          placeholder="VIP, family, ..."
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                          value={
                            (guest.attributes?.wantsByName as
                              | string[]
                              | undefined)?.join(", ") ?? ""
                          }
                          onChange={(e) => {
                            const wantsByName = e.target.value
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean);
                            const next = [...importedGuests];
                            next[idx] = {
                              ...guest,
                              attributes: {
                                ...guest.attributes,
                                wantsByName,
                              },
                            };
                            setImportedGuests(next);
                          }}
                          placeholder="Alice, Bob"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                          value={
                            (guest.attributes?.mustNotByName as
                              | string[]
                              | undefined)?.join(", ") ?? ""
                          }
                          onChange={(e) => {
                            const mustNotByName = e.target.value
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean);
                            const next = [...importedGuests];
                            next[idx] = {
                              ...guest,
                              attributes: {
                                ...guest.attributes,
                                mustNotByName,
                              },
                            };
                            setImportedGuests(next);
                          }}
                          placeholder="Ex Partner"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* NEW: Table configuration GUI */}
        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Tables (configuration)
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadTablesFromJson}
                className="text-[11px] px-2 py-1 rounded-md border border-slate-700 bg-slate-950 hover:border-teal-400 hover:text-teal-300 transition-colors"
              >
                Load from JSON
              </button>
              <button
                type="button"
                onClick={syncTablesToJson}
                className="text-[11px] px-2 py-1 rounded-md border border-slate-700 bg-slate-950 hover:border-teal-400 hover:text-teal-300 transition-colors"
              >
                Sync to JSON editor
              </button>
              <button
                type="button"
                onClick={addTable}
                className="text-[11px] px-2 py-1 rounded-md border border-slate-700 bg-slate-950 hover:border-teal-400 hover:text-teal-300 transition-colors"
              >
                + Add table
              </button>
            </div>
          </div>

          {tablesConfig && tablesConfig.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-slate-200">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-2 py-1 text-left">ID</th>
                    <th className="px-2 py-1 text-left">Name</th>
                    <th className="px-2 py-1 text-left">Shape</th>
                    <th className="px-2 py-1 text-left">Capacity</th>
                    <th className="px-2 py-1 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {tablesConfig.map((tbl, idx) => (
                    <tr
                      key={tbl.id || idx}
                      className="border-b border-slate-800 last:border-b-0"
                    >
                      <td className="px-2 py-1">
                        <input
                          className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                          value={tbl.id}
                          onChange={(e) => {
                            const next = [...tablesConfig];
                            next[idx] = { ...tbl, id: e.target.value };
                            setTablesConfig(next);
                          }}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                          value={tbl.name}
                          onChange={(e) => {
                            const next = [...tablesConfig];
                            next[idx] = { ...tbl, name: e.target.value };
                            setTablesConfig(next);
                          }}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <select
                          className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                          value={tbl.shape ?? "round"}
                          onChange={(e) => {
                            const shape =
                              e.target.value === "trestle"
                                ? "trestle"
                                : "round";
                            const next = [...tablesConfig];
                            next[idx] = { ...tbl, shape };
                            setTablesConfig(next);
                          }}
                        >
                          <option value="round">Round</option>
                          <option value="trestle">Trestle</option>
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min={1}
                          className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                          value={tbl.capacity ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const capacity =
                              val === "" ? undefined : Number(val);
                            const next = [...tablesConfig];
                            next[idx] = { ...tbl, capacity };
                            setTablesConfig(next);
                          }}
                        />
                      </td>
                      <td className="px-2 py-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeTableAt(idx)}
                          className="text-[11px] px-2 py-1 rounded-md border border-slate-700 bg-slate-950 hover:border-red-500 hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              No tables loaded yet. Load from JSON or add tables manually.
            </p>
          )}
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
            JSON must include top-level{" "}
            <code className="text-teal-300">guests</code> and{" "}
            <code className="text-teal-300">tables</code> arrays.
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
            <span className="text-sm text-red-400">Error: {error}</span>
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

              {/* Simple derived score using current weights */}
              {(() => {
                const m = result.metrics;
                const score =
                  -m.mustNotViolations * weights.mustNotWeight +
                  m.wantsSatisfied * weights.wantsWeight -
                  m.adjacentSingles * weights.adjacentSinglesWeight -
                  m.sameGenderAdjacencies * weights.sameGenderAdjWeight +
                  m.alternatingTables * weights.alternatingTablesWeight -
                  m.splitCouples * weights.splitCouplesWeight;

                return (
                  <p className="text-sm mb-2 text-slate-200">
                    <span className="font-semibold">Weighted score: </span>
                    <span className="font-mono text-teal-300">
                      {score.toFixed(1)}
                    </span>
                  </p>
                );
              })()}

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
                Metrics reflect the current profile ({profile}) and the weights
                you&apos;ve configured above.
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

        {result && (
          <section className="mt-6 bg-slate-900 rounded-xl border border-slate-800 p-4">
            <h2 className="text-sm font-semibold mb-3 text-slate-100">
              Visual seating layout
            </h2>
            <p className="text-[11px] text-slate-500 mb-3">
              SVG-based rendering of tables and seats. Table shapes come from
              the <code className="text-teal-300">tables</code> JSON (
              <code className="text-teal-300">shape</code>:{" "}
              <code className="text-teal-300">&quot;round&quot;</code> |{" "}
              <code className="text-teal-300">&quot;trestle&quot;</code>); guest
              colour shows gender and the tooltip shows full name and tags.
            </p>
            <SeatingLayout
              plan={result}
              guestsById={guestsById}
              getTableShape={getTableShape}
            />
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
