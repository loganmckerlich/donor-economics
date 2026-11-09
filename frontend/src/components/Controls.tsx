"use client";

import { createContext, useContext, useRef } from "react";
import type { EffectForm } from "@/lib/effect";
import Tip, { T } from "./Tip";

/**
 * Generic form controls shared by every strategy page. They know nothing about any one model:
 * each page supplies the tooltip and chart chips for its own parameters (see `FieldMeta`).
 */

interface Ctx {
  /** the parameter the user is hovering or focused on, to outline the charts it drives */
  setActive: (id: string | null) => void;
  /** remember the current charts as the "before" line, called when an interaction starts */
  snapshot: () => void;
}
export const ControlCtx = createContext<Ctx>({ setActive: () => {}, snapshot: () => {} });

/** What a control says about itself: its tooltip, and which numbered charts it changes. Supplied by each page. */
export interface FieldMeta {
  tip: React.ReactNode;
  /** chart number -> whether the control reshapes the chart ("curve") or only moves your marker */
  affects: Record<number, "curve" | "marker">;
  /** chart number -> chart title, for the chip tooltips */
  titles: Record<number, string>;
}

function Chips({ affects, titles }: Pick<FieldMeta, "affects" | "titles">) {
  return (
    <span className="flex items-center gap-1">
      {Object.entries(affects).map(([n, kind]) => (
        <Tip
          key={n} focusable align="right" width="w-56" className="inline-flex"
          content={
            <T title={`Chart ${n}`}>
              {titles[Number(n)]}.{" "}
              {kind === "curve" ? "This control reshapes the chart." : "This control only moves your scenario's marker on the chart."}
            </T>
          }
        >
          <span className="inline-flex h-4 min-w-4 cursor-default items-center justify-center rounded-full border border-axis px-1 text-[10px] leading-none text-ink-3">
            {n}
          </span>
        </Tip>
      ))}
    </span>
  );
}

function Field({ param, label, display, readout, children, tip, affects, titles }: FieldMeta & {
  param: string; label: string; display?: string; readout?: string; children: React.ReactNode;
}) {
  const { setActive } = useContext(ControlCtx);
  return (
    <div
      onPointerEnter={() => setActive(param)}
      onPointerLeave={() => setActive(null)}
      onFocus={() => setActive(param)}
      onBlur={() => setActive(null)}
    >
      <Tip content={tip} width="w-full min-w-64">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="text-ink">{label}</span>
          {display !== undefined && <span className="font-mono tabular-nums text-ink-2">{display}</span>}
        </div>
        {children}
      </Tip>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs text-ink-3">{readout}</span>
        <Chips affects={affects} titles={titles} />
      </div>
    </div>
  );
}

export function SliderField(props: FieldMeta & {
  param: string; label: string; readout?: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (v: number) => void;
}) {
  const { param, label, readout, value, min, max, step, display, onChange, tip, affects, titles } = props;
  const { snapshot } = useContext(ControlCtx);
  const armed = useRef(true); // first key press of a keyboard interaction snapshots once
  return (
    <Field param={param} label={label} display={display} readout={readout} tip={tip} affects={affects} titles={titles}>
      <input
        type="range" min={min} max={max} step={step} value={value} aria-label={label}
        onPointerDown={() => snapshot()}
        onKeyDown={() => { if (armed.current) { snapshot(); armed.current = false; } }}
        onBlur={() => { armed.current = true; }}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-1.5 w-full cursor-pointer accent-[var(--series-1)]"
      />
    </Field>
  );
}

export function FormField({ value, onChange, ...meta }: FieldMeta & { value: EffectForm; onChange: (v: EffectForm) => void }) {
  const { snapshot } = useContext(ControlCtx);
  return (
    <Field param="effectForm" label="Functional form" {...meta}>
      <select
        value={value} aria-label="Functional form"
        onChange={(e) => { snapshot(); onChange(e.target.value as EffectForm); }}
        className="mt-1 w-full rounded-md border border-axis bg-surface px-2 py-1.5 text-sm"
      >
        <option value="log">Logarithmic: k·ln(1 + D/s)</option>
        <option value="saturating">Saturating: k·(1 − e^(−D/s))</option>
        <option value="linear">Linear: k·D/s</option>
      </select>
    </Field>
  );
}

/** Rarely-changed assumptions, collapsed by default. A dot shows when any are off their defaults. */
export function AdvancedGroup({ modified, children }: { modified: boolean; children: React.ReactNode }) {
  return (
    <details className="group/adv rounded-lg border border-grid">
      <summary className="flex cursor-pointer select-none items-center justify-between px-3 py-2 text-sm text-ink-2 hover:text-ink">
        <span className="flex items-center gap-2">
          Advanced assumptions
          {modified && (
            <span className="inline-flex items-center gap-1 rounded border border-axis px-1.5 text-[10px] font-medium text-ink-2">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-series-2" />
              changed
            </span>
          )}
        </span>
        <span aria-hidden className="text-ink-3 transition-transform group-open/adv:rotate-90">›</span>
      </summary>
      <div className="space-y-5 border-t border-grid px-3 py-4">{children}</div>
    </details>
  );
}

/** A section's left-hand control column. */
export function ControlPanel({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5 rounded-xl border border-grid bg-surface p-4 lg:self-start">{children}</div>;
}
