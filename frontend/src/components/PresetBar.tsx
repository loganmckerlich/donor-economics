"use client";

import Tip, { T } from "./Tip";

/** A row of one-click scenarios. Hovering a chip explains the scenario. */
export default function PresetBar<P extends { id: string; label: string; blurb: string }>({
  presets, isActive, onPick,
}: { presets: P[]; isActive: (p: P) => boolean; onPick: (index: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Scenarios">
      <span className="mr-1 text-sm text-ink-2">Scenarios</span>
      {presets.map((p, i) => {
        const on = isActive(p);
        return (
          <Tip key={p.id} side="bottom" width="w-80" className="inline-block" content={<T title={p.label}>{p.blurb}</T>}>
            <button
              onClick={() => onPick(i)} aria-pressed={on}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                on ? "border-series-1 bg-series-1 text-white" : "border-axis bg-surface text-ink-2 hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          </Tip>
        );
      })}
    </div>
  );
}
