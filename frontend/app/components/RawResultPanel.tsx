// app/components/RawResultPanel.tsx
"use client";

type Props = {
  rawResult: string | null;
};

export function RawResultPanel({ rawResult }: Props) {
  if (!rawResult) return null;

  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold mb-2 text-slate-100">
        Raw API response
      </h2>
      <pre className="w-full font-mono text-xs rounded-md border border-slate-800 p-2 bg-slate-950 text-slate-100 overflow-x-auto">
        {rawResult}
      </pre>
      <p className="mt-2 text-[11px] text-slate-500">
        Use this output to debug solver behaviour, metrics, and future profile
        extensions.
      </p>
    </section>
  );
}
