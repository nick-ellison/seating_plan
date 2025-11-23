// app/components/ActionsBar.tsx
"use client";

type Props = {
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
};

export function ActionsBar({ loading, error, onGenerate }: Props) {
  return (
    <section className="mb-4 flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={onGenerate}
        disabled={loading}
        className="px-4 py-2 rounded-md bg-teal-500 text-slate-950 text-sm font-medium hover:bg-teal-400 disabled:bg-teal-800 disabled:text-slate-300 transition-colors"
      >
        {loading ? "Generating seating..." : "Generate seating plan"}
      </button>
      {error && <span className="text-sm text-red-400">Error: {error}</span>}
    </section>
  );
}
