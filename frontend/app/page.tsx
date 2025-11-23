// app/page.tsx
"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import {
  SeatingPlanResponse,
  Guest,
  TableConfig,
  Weights,
  DEFAULT_WEIGHTS,
  SAMPLE_GUESTS_AND_TABLES,
  EventSummary,
} from "./types";
import {
  generateSeating,
  importGuestsCsv,
  fetchEvents,
  fetchEvent,
  saveEvent,
} from "./lib/api";

import { BrandHeader } from "./components/BrandHeader";
import { IntroPanel } from "./components/IntroPanel";
import { ProfileControls } from "./components/ProfileControls";
import { WeightsPanel } from "./components/WeightsPanel";
import { CsvImportSection } from "./components/CsvImportSection";
import { EditableGuestsTable } from "./components/EditableGuestsTable";
import { TablesConfigPanel } from "./components/TablesConfigPanel";
import { JsonEditor } from "./components/JsonEditor";
import { ActionsBar } from "./components/ActionsBar";
import { MetricsPanel } from "./components/MetricsPanel";
import { TablesList } from "./components/TablesList";
import { VisualLayoutPanel } from "./components/VisualLayoutPanel";
import { RawResultPanel } from "./components/RawResultPanel";
import { SaveEventBar } from "./components/SaveEventBar";
import { EventsSidebar } from "./components/EventsSidebar";

function isSeatingPlanResponse(data: any): data is SeatingPlanResponse {
  return (
    data &&
    Array.isArray(data.tables) &&
    typeof data.metrics === "object" &&
    typeof data.attemptsMade === "number"
  );
}

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

  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [tablesConfig, setTablesConfig] = useState<TableConfig[] | null>(
    SAMPLE_GUESTS_AND_TABLES.tables as TableConfig[]
  );

  // Events state
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [savingEvent, setSavingEvent] = useState<boolean>(false);
  const [eventName, setEventName] = useState<string>("");
  const [currentEventId, setCurrentEventId] = useState<number | null>(null);

  const resetWeights = () => setWeights(DEFAULT_WEIGHTS);

  const guestsById = useMemo(() => {
    const map = new Map<string, Guest>();

    if (importedGuests) {
      importedGuests.forEach((g) => map.set(g.id, g));
      return map;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed.guests)) {
        (parsed.guests as Guest[]).forEach((g) => {
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
    setCurrentEventId(null);
    setEventName("");
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

      const data = await generateSeating({
        guests: parsed.guests,
        tables: parsed.tables,
        profile,
        maxAttempts: maxAttemptsNumber,
        seed: seedValue,
        weights,
      });

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
      const data = await importGuestsCsv(file, profile);
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

  /**
   * Events: load list
   */
  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const list = await fetchEvents();
      setEvents(list);
    } catch (err: any) {
      console.error(err);
      setEventsError(err.message || "Failed to load events");
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  /**
   * Save current configuration as an event
   */
  const handleSaveEvent = async () => {
    if (!eventName.trim()) {
      setError("Please enter an event name before saving.");
      return;
    }

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
        if (trimmed === "") return null;
        const n = Number(trimmed);
        return Number.isFinite(n) ? n : null;
      })();

      setSavingEvent(true);
      setError(null);

      const detail = await saveEvent({
        name: eventName.trim(),
        profile,
        maxAttempts: maxAttemptsNumber,
        seed: seedValue,
        weights,
        guests: parsed.guests as Guest[],
        tables: parsed.tables as TableConfig[],
        lastResult: result,
      });

      setCurrentEventId(detail.id);
      // Refresh list so the new event appears
      await loadEvents();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save event");
    } finally {
      setSavingEvent(false);
    }
  };

  /**
   * Load a specific event and hydrate UI
   */
  const handleSelectEvent = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const ev = await fetchEvent(id);

      setCurrentEventId(ev.id);
      setEventName(ev.name);
      setProfile(ev.profile);
      setMaxAttempts(String(ev.maxAttempts ?? 1000));
      setSeed(ev.seed != null ? String(ev.seed) : "");
      setWeights(ev.weights || DEFAULT_WEIGHTS);
      setImportedGuests(ev.guests);
      setTablesConfig(ev.tables);

      const combined = {
        guests: ev.guests,
        tables: ev.tables,
      };
      setJsonInput(JSON.stringify(combined, null, 2));

      if (ev.lastResult) {
        setResult(ev.lastResult);
        setRawResult(JSON.stringify(ev.lastResult, null, 2));
      } else {
        setResult(null);
        setRawResult(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <BrandHeader />

      <div className="max-w-6xl mx-auto py-8 px-4">
        <IntroPanel />

        {/* Layout: sidebar + main content */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sidebar – visible on all sizes, stacked on mobile */}
          <div className="w-full lg:w-64 mb-4 lg:mb-0">
            <EventsSidebar
              events={events}
              loading={eventsLoading}
              error={eventsError}
              selectedEventId={currentEventId}
              onRefresh={loadEvents}
              onSelectEvent={handleSelectEvent}
            />
          </div>

          <div className="flex-1">
            <SaveEventBar
              eventName={eventName}
              onEventNameChange={setEventName}
              onSave={handleSaveEvent}
              saving={savingEvent}
              currentEventId={currentEventId}
            />

            <ProfileControls
              profile={profile}
              onProfileChange={setProfile}
              maxAttempts={maxAttempts}
              onMaxAttemptsChange={setMaxAttempts}
              seed={seed}
              onSeedChange={setSeed}
            />

            <WeightsPanel
              weights={weights}
              onChange={setWeights}
              onReset={resetWeights}
            />

            <CsvImportSection
              csvLoading={csvLoading}
              csvWarnings={csvWarnings}
              onUpload={handleCsvUpload}
              onExport={handleExportCsv}
            />

            <EditableGuestsTable
              guests={importedGuests}
              onGuestsChange={setImportedGuests}
              onSyncToJson={syncImportedToJson}
            />

            <TablesConfigPanel
              tablesConfig={tablesConfig}
              onTablesChange={setTablesConfig}
              onLoadFromJson={loadTablesFromJson}
              onSyncToJson={syncTablesToJson}
              onAddTable={addTable}
              onRemoveTableAt={removeTableAt}
            />

            <JsonEditor
              jsonInput={jsonInput}
              onChange={setJsonInput}
              onUseSample={handleUseSample}
            />

            <ActionsBar
              loading={loading}
              error={error}
              onGenerate={handleGenerate}
            />

            {result && (
              <section className="grid gap-6 md:grid-cols-2 mt-4">
                <MetricsPanel
                  result={result}
                  profile={profile}
                  weights={weights}
                />
                <TablesList result={result} />
              </section>
            )}

            {result && (
              <VisualLayoutPanel
                result={result}
                guestsById={guestsById}
                getTableShape={getTableShape}
              />
            )}

            <RawResultPanel rawResult={rawResult} />
          </div>
        </div>
      </div>
    </main>
  );
}
