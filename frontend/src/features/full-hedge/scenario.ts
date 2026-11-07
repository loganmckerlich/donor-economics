import type { EffectForm } from "@/lib/effect";

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
