// app/components/WeightSliderRow.tsx
"use client";

import React from "react";

type SliderProps = {
  label: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
};

export const WeightSliderRow: React.FC<SliderProps> = ({
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
