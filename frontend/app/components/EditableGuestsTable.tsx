// app/components/EditableGuestsTable.tsx
"use client";

import { Guest } from "../types";

type Props = {
  guests: Guest[] | null;
  onGuestsChange: (guests: Guest[]) => void;
  onSyncToJson: () => void;
};

export function EditableGuestsTable({
  guests,
  onGuestsChange,
  onSyncToJson,
}: Props) {
  if (!guests) return null;

  return (
    <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Guests (editable)
        </h2>
        <button
          type="button"
          className="text-[11px] px-2 py-1 rounded-md border border-slate-700 bg-slate-950 hover:border-teal-400 hover:text-teal-300 transition-colors"
          onClick={onSyncToJson}
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
            {guests.map((guest, idx) => (
              <tr
                key={guest.id}
                className="border-b border-slate-800 last:border-b-0"
              >
                <td className="px-2 py-1">
                  <input
                    className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                    value={guest.name}
                    onChange={(e) => {
                      const next = [...guests];
                      next[idx] = { ...guest, name: e.target.value };
                      onGuestsChange(next);
                    }}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                    value={guest.gender ?? ""}
                    onChange={(e) => {
                      const next = [...guests];
                      next[idx] = {
                        ...guest,
                        gender: e.target.value || null,
                      };
                      onGuestsChange(next);
                    }}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                    value={guest.maritalStatus ?? ""}
                    onChange={(e) => {
                      const next = [...guests];
                      next[idx] = {
                        ...guest,
                        maritalStatus: e.target.value || null,
                      };
                      onGuestsChange(next);
                    }}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="w-full bg-slate-950/40 border border-slate-700 rounded-sm px-1 py-0.5"
                    value={guest.attributes?.side ?? ""}
                    onChange={(e) => {
                      const next = [...guests];
                      next[idx] = {
                        ...guest,
                        attributes: {
                          ...guest.attributes,
                          side: e.target.value,
                        },
                      };
                      onGuestsChange(next);
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
                      const next = [...guests];
                      next[idx] = { ...guest, tags };
                      onGuestsChange(next);
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
                      const next = [...guests];
                      next[idx] = {
                        ...guest,
                        attributes: {
                          ...guest.attributes,
                          wantsByName,
                        },
                      };
                      onGuestsChange(next);
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
                      const next = [...guests];
                      next[idx] = {
                        ...guest,
                        attributes: {
                          ...guest.attributes,
                          mustNotByName,
                        },
                      };
                      onGuestsChange(next);
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
  );
}
