"use client";

import type { EffectForm } from "@/lib/api";

export interface UiState {
  payoff: number; // $
  baseProb: number;
  effectSize: number;
  effectScale: number; // $
  effectForm: EffectForm;
  gamma: number; // CRRA-equivalent risk aversion
  wealthB: number; // $B
  donation: number; // $
  fullHedge: boolean;
  hedge: number; // $
}

export const DEFAULT_UI: UiState = {
  payoff: 100e6,
  baseProb: 0.45,
  effectSize: 0.015,
  effectScale: 10e6,
  effectForm: "log",
  gamma: 2,
  wealthB: 5,
  donation: 50e6,
  fullHedge: false,
  hedge: 25e6,
};

function Slider(props: {
  label: string; hint?: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (v: number) => void;
}) {
  const { label, hint, value, min, max, step, display, onChange } = props;
  return (
    <label className="block">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-ink">{label}</span>
        <span className="font-mono tabular-nums text-ink-2">{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-1.5 w-full cursor-pointer accent-[var(--series-1)]"
      />
      {hint && <div className="mt-0.5 text-xs text-ink-3">{hint}</div>}
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-grid pt-4 first:border-0 first:pt-0">
      <legend className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-3">{title}</legend>
      {children}
    </fieldset>
  );
}

export default function Controls({
  ui, set, onApplyOptimal, optimalDonation,
}: {
  ui: UiState;
  set: (patch: Partial<UiState>) => void;
  onApplyOptimal: () => void;
  optimalDonation: number | null;
}) {
  const m = (v: number) => `$${(v / 1e6).toFixed(0)}M`;
  return (
    <div className="space-y-5 rounded-xl border border-grid bg-surface p-4">
      <button
        onClick={onApplyOptimal}
        className="w-full rounded-lg bg-series-1 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Apply optimal strategy{optimalDonation !== null && ` (donate ${m(optimalDonation)}, full hedge)`}
      </button>

      <Group title="Strategy">
        <Slider label="Donation" value={ui.donation} min={0} max={300e6} step={1e6}
          display={m(ui.donation)} onChange={(v) => set({ donation: v })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={ui.fullHedge} onChange={(e) => set({ fullHedge: e.target.checked })}
            className="accent-[var(--series-1)]" />
          Use the full (zero-variance) hedge
        </label>
        <div className={ui.fullHedge ? "opacity-40" : ""}>
          <Slider label="Hedge (spend on NO)" value={ui.hedge} min={0} max={200e6} step={1e6}
            display={m(ui.hedge)} onChange={(v) => set({ hedge: v, fullHedge: false })} />
        </div>
      </Group>

      <Group title="Payoff">
        <Slider label="Payoff if candidate wins (V)" value={ui.payoff} min={20e6} max={500e6} step={5e6}
          display={m(ui.payoff)} onChange={(v) => set({ payoff: v })} />
        <Slider label="Win probability with no donation" value={ui.baseProb} min={0.05} max={0.95} step={0.01}
          display={`${(ui.baseProb * 100).toFixed(0)}%`} onChange={(v) => set({ baseProb: v })} />
      </Group>

      <Group title="Donation effect on winning">
        <label className="block text-sm">
          <span className="text-ink">Functional form</span>
          <select value={ui.effectForm} onChange={(e) => set({ effectForm: e.target.value as EffectForm })}
            className="mt-1 w-full rounded-md border border-axis bg-surface px-2 py-1.5 text-sm">
            <option value="log">Logarithmic: k·ln(1 + D/s)</option>
            <option value="saturating">Saturating: k·(1 − e^(−D/s))</option>
            <option value="linear">Linear: k·D/s</option>
          </select>
        </label>
        <Slider label="Effect size (k)" value={ui.effectSize} min={0} max={0.1} step={0.001}
          display={ui.effectSize.toFixed(3)} onChange={(v) => set({ effectSize: v })}
          hint="Win-probability points gained per unit of the curve" />
        <Slider label="Effect scale (s)" value={ui.effectScale} min={1e6} max={100e6} step={1e6}
          display={m(ui.effectScale)} onChange={(v) => set({ effectScale: v })}
          hint="Smaller s: effect arrives with fewer dollars" />
      </Group>

      <Group title="Risk aversion">
        <Slider label="Risk aversion (γ)" value={ui.gamma} min={0} max={20} step={0.5}
          display={ui.gamma === 0 ? "risk-neutral" : ui.gamma.toFixed(1)} onChange={(v) => set({ gamma: v })} />
        <Slider label="Donor wealth" value={ui.wealthB} min={0.5} max={100} step={0.5}
          display={`$${ui.wealthB}B`} onChange={(v) => set({ wealthB: v })}
          hint={`CARA a = γ / wealth = ${(ui.gamma / (ui.wealthB * 1e9)).toExponential(1)}`} />
      </Group>
    </div>
  );
}
