"use client";

import { createContext, useContext, useRef } from "react";
import type { EffectForm } from "@/lib/api";
import Tip, { T } from "./Tip";

export interface UiState {
  payoff: number; // $
  boost: number; // win-probability boost from a $50M donation (0.027 = 2.7 points)
  donation: number; // $
  hedgeFrac: number; // hedge as a fraction of the risk-free hedge
  gamma: number; // CRRA-equivalent risk aversion
  // advanced
  baseProb: number;
  effectForm: EffectForm;
  effectScale: number; // $
  wealthB: number; // $B
}

export const DEFAULT_UI: UiState = {
  payoff: 100e6,
  boost: 0.027,
  donation: 50e6,
  hedgeFrac: 0.5,
  gamma: 2,
  baseProb: 0.5,
  effectForm: "log",
  effectScale: 10e6,
  wealthB: 5,
};

export type ParamId =
  | "payoff" | "baseProb" | "boost" | "effectScale" | "effectForm"
  | "donation" | "hedge" | "gamma" | "wealth";

export const CHART_TITLES: Record<number, string> = {
  1: "Donation → win probability",
  2: "Expected value of donating",
  3: "Hedge size → payoffs",
  4: "Hedge size → value to the donor",
  5: "When is donating worth it?",
  6: "When is hedging worth it?",
};

/** Charts each parameter changes: "curve" reshapes the chart, "marker" only moves your scenario's marker or line. */
export const AFFECTS: Record<ParamId, Record<number, "curve" | "marker">> = {
  baseProb: { 1: "curve", 3: "curve", 4: "curve", 6: "curve" },
  payoff: { 2: "curve", 3: "curve", 4: "curve", 5: "marker", 6: "curve" },
  boost: { 1: "curve", 2: "curve", 3: "curve", 4: "curve", 5: "marker", 6: "curve" },
  effectScale: { 1: "curve", 2: "curve", 3: "curve", 4: "curve", 5: "curve", 6: "curve" },
  effectForm: { 1: "curve", 2: "curve", 3: "curve", 4: "curve", 5: "curve", 6: "curve" },
  donation: { 1: "marker", 2: "marker", 3: "curve", 4: "curve", 6: "marker" },
  hedge: { 3: "marker", 4: "marker" },
  gamma: { 4: "curve", 6: "marker" },
  wealth: { 4: "curve", 6: "marker" },
};
export const affectedCharts = (p: ParamId) => Object.keys(AFFECTS[p]).map(Number);

const TIPS: Record<ParamId, React.ReactNode> = {
  payoff: (
    <T title="Payoff if the candidate wins (V)">
      What the donor receives, in dollars, if their candidate wins. They receive nothing if the candidate loses.
      A bigger V makes both donating and hedging matter more.
    </T>
  ),
  baseProb: (
    <T title="Win probability with no donation (p₀)">
      The chance the candidate wins if the donor gives nothing. The donation then adds to this.
      It is also the market price of &ldquo;wins&rdquo; before any money is spent.
    </T>
  ),
  effectForm: (
    <T title="Functional form of the donation effect">
      How donated dollars turn into win probability. <b className="text-ink">Log</b> (default): each extra dollar helps
      less than the last. <b className="text-ink">Saturating</b>: the effect levels off at +k.{" "}
      <b className="text-ink">Linear</b>: every dollar helps equally, so it can reach 100%.
    </T>
  ),
  boost: (
    <T title="Win-probability boost from a $50M donation">
      How many points of win probability a $50M donation buys. Studies of campaign spending find effects of a few
      points at most, so small values are realistic. Smaller donations buy less, and with the default (log) curve each
      extra dollar helps a little less than the last.
    </T>
  ),
  effectScale: (
    <T title="Effect scale (s)">
      The dollar size at which returns start to fade. A small s means the first few million dollars do most of the work;
      a large s means the effect builds slowly. The boost from a $50M donation stays fixed, so this only changes how that
      boost is spread across smaller and larger donations.
    </T>
  ),
  donation: (
    <T title="Donation (D)">
      What the donor gives, in dollars. It is spent whether the candidate wins or loses, and it raises the win
      probability along the donation-effect curve. The market price of &ldquo;wins&rdquo; rises with it.
    </T>
  ),
  hedge: (
    <T title="Hedge (% of the risk-free hedge)">
      How much to bet on &ldquo;NO&rdquo; (candidate loses) on the prediction market, as a share of the amount that
      removes all risk. 0% is no hedge; 100% makes your profit identical whether the candidate wins or loses; above
      100% over-hedges. The price is fair, so the hedge never changes expected profit. It only narrows the gap between
      the win and lose outcomes.
    </T>
  ),
  gamma: (
    <T title="Risk aversion (γ)">
      How much the donor dislikes uncertain outcomes. 0 means they only care about the average, so hedging is
      pointless. Around 2 is a common benchmark. Higher values pay more to avoid risk.
    </T>
  ),
  wealth: (
    <T title="Donor wealth">
      Combined with γ to set risk aversion in dollar terms: a = γ / wealth. A wealthier donor is bothered less by a
      swing of tens of millions, so hedging is worth less to them.
    </T>
  ),
};

interface Ctx {
  set: (patch: Partial<UiState>) => void;
  /** the parameter the user is hovering or focused on, to outline the charts it drives */
  setActive: (id: ParamId | null) => void;
  /** remember the current charts as the "before" line, called when an interaction starts */
  snapshot: () => void;
}
export const ControlCtx = createContext<Ctx>({ set: () => {}, setActive: () => {}, snapshot: () => {} });

function Chips({ param }: { param: ParamId }) {
  return (
    <span className="flex items-center gap-1">
      {Object.entries(AFFECTS[param]).map(([n, kind]) => (
        <Tip
          key={n} focusable align="right" width="w-56" className="inline-flex"
          content={
            <T title={`Chart ${n}`}>
              {CHART_TITLES[Number(n)]}.{" "}
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

function Field({ param, label, display, readout, children }: {
  param: ParamId; label: string; display?: string; readout?: string; children: React.ReactNode;
}) {
  const { setActive } = useContext(ControlCtx);
  return (
    <div
      onPointerEnter={() => setActive(param)}
      onPointerLeave={() => setActive(null)}
      onFocus={() => setActive(param)}
      onBlur={() => setActive(null)}
    >
      <Tip content={TIPS[param]} width="w-full min-w-64">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="text-ink">{label}</span>
          {display !== undefined && <span className="font-mono tabular-nums text-ink-2">{display}</span>}
        </div>
        {children}
      </Tip>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs text-ink-3">{readout}</span>
        <Chips param={param} />
      </div>
    </div>
  );
}

export function SliderField(props: {
  param: ParamId; label: string; readout?: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (v: number) => void;
}) {
  const { param, label, readout, value, min, max, step, display, onChange } = props;
  const { snapshot } = useContext(ControlCtx);
  const armed = useRef(true); // first key press of a keyboard interaction snapshots once
  return (
    <Field param={param} label={label} display={display} readout={readout}>
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

export function FormField({ value, onChange }: { value: EffectForm; onChange: (v: EffectForm) => void }) {
  const { snapshot } = useContext(ControlCtx);
  return (
    <Field param="effectForm" label="Functional form">
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
