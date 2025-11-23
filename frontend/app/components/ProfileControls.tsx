// app/components/ProfileControls.tsx
"use client";

type Props = {
  profile: string;
  onProfileChange: (value: string) => void;
  maxAttempts: string;
  onMaxAttemptsChange: (value: string) => void;
  seed: string;
  onSeedChange: (value: string) => void;
};

export function ProfileControls({
  profile,
  onProfileChange,
  maxAttempts,
  onMaxAttemptsChange,
  seed,
  onSeedChange,
}: Props) {
  return (
    <section className="mb-6 grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-200">Profile</label>
        <select
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400"
          value={profile}
          onChange={(e) => onProfileChange(e.target.value)}
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
            onMaxAttemptsChange(raw === "" ? "1" : raw);
          }}
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
          onChange={(e) => onSeedChange(e.target.value)}
          placeholder="leave blank for random"
        />
        <p className="text-[11px] text-slate-500">
          Use the same seed to reproduce a given seating plan.
        </p>
      </div>
    </section>
  );
}
