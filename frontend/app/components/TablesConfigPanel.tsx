// app/components/TablesConfigPanel.tsx
"use client";

import { TableConfig } from "../types";

type Props = {
  tablesConfig: TableConfig[] | null;
  onTablesChange: (tables: TableConfig[] | null) => void;
  onLoadFromJson: () => void;
  onSyncToJson: () => void;
  onAddTable: () => void;
  onRemoveTableAt: (index: number) => void;
};

export function TablesConfigPanel({
  tablesConfig,
  onTablesChange,
  onLoadFromJson,
  onSyncToJson,
  onAddTable,
  onRemoveTableAt,
}: Props) {
  return (
    <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Tables (configuration)
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadFromJson}
            className="text-[11px] px-2 py-1 rounded-md border border-slate-700 bg-slate-950 hover:border-teal-400 hover:text-teal-300 transition-colors"
          >
            Load from JSON
          </button>
          <button
            type="button"
            onClick={onSyncToJson}
            className="text-[11px] px-2 py-1 rounded-md border border-slate-700 bg-slate-950 hover:border-teal-400 hover:text-teal-300 transition-colors"
          >
            Sync to JSON editor
          </button>
          <button
            type="button"
            onClick={onAddTable}
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
                        onTablesChange(next);
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
                        onTablesChange(next);
                      }}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                      value={tbl.shape ?? "round"}
                      onChange={(e) => {
                        const shape =
                          e.target.value === "trestle" ? "trestle" : "round";
                        const next = [...tablesConfig];
                        next[idx] = { ...tbl, shape };
                        onTablesChange(next);
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
                        onTablesChange(next);
                      }}
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <button
                      type="button"
                      onClick={() => onRemoveTableAt(idx)}
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
  );
}
