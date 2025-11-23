// app/components/JsonEditor.tsx
"use client";

type Props = {
  jsonInput: string;
  onChange: (value: string) => void;
  onUseSample: () => void;
};

export function JsonEditor({ jsonInput, onChange, onUseSample }: Props) {
  return (
    <section className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-slate-200">
          Guests &amp; Tables JSON (input)
        </h2>
        <button
          type="button"
          onClick={onUseSample}
          className="text-[11px] px-2 py-1 rounded-md border border-slate-700 bg-slate-900 text-slate-100 hover:border-teal-400 hover:text-teal-300 transition-colors"
        >
          Use sample data
        </button>
      </div>
      <textarea
        value={jsonInput}
        onChange={(e) => onChange(e.target.value)}
        rows={16}
        className="w-full font-mono text-xs rounded-md border border-slate-800 p-2 bg-slate-950 text-slate-100 focus:outline-none_focus:ring-1 focus:ring-teal-400"
      />
      <p className="mt-2 text-[11px] text-slate-500">
        JSON must include top-level{" "}
        <code className="text-teal-300">guests</code> and{" "}
        <code className="text-teal-300">tables</code> arrays.
      </p>
    </section>
  );
}
