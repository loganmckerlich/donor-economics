import type { EffectForm } from "@/lib/effect";

/** Slider state for the Marginal Profit Strategy page. */
export interface UiState {
  boost: number; // win-probability boost from a $50M donation (0.027 = 2.7 points)
  donation: number; // $
  capital: number; // $ spent buying YES
  hold: number; // months between buying and selling
  halfLife: number; // months for the market to close half of the remaining gap (0 = instant)
  belief: number; // share of the true boost the market ends up pricing
  // advanced
  baseProb: number;
  effectForm: EffectForm;
  effectScale: number; // $
  depth: number; // $ of orders that move the price one point
  fee: number; // per side, share of dollars traded
  carry: number; // annual cost of the cash tied up
}

export const DEFAULT_UI: UiState = {
  boost: 0.027,
  donation: 10e6,
  capital: 100e6,
  hold: 3,
  halfLife: 1,
  belief: 1,
  baseProb: 0.5,
  effectForm: "log",
  effectScale: 10e6,
  depth: 200e6,
  fee: 0.01,
  carry: 0.05,
};

export type ParamId =
  | "boost" | "donation" | "capital" | "hold" | "halfLife" | "belief"
  | "baseProb" | "effectForm" | "effectScale" | "depth" | "fee" | "carry";

export const CHART_TITLES: Record<number, string> = {
  1: "Price over time",
  2: "Profit by when you sell",
  3: "Profit by donation size",
  4: "Profit by trade size",
  5: "When does timing pay?",
  6: "When does size pay?",
};

type Kind = "curve" | "marker";
const all = (k: Kind): Record<number, Kind> => ({ 1: k, 2: k, 3: k, 4: k, 5: k, 6: k });

/** Charts each parameter changes: "curve" reshapes the chart, "marker" only moves your scenario's marker or line. */
export const AFFECTS: Record<ParamId, Record<number, Kind>> = {
  boost: all("curve"),
  baseProb: all("curve"),
  effectForm: all("curve"),
  effectScale: all("curve"),
  belief: all("curve"),
  donation: { 1: "curve", 2: "curve", 3: "marker", 4: "curve", 5: "curve", 6: "marker" },
  halfLife: { 1: "curve", 2: "curve", 3: "curve", 4: "curve", 5: "marker", 6: "curve" },
  hold: { 1: "marker", 2: "marker", 3: "curve", 4: "curve", 5: "marker", 6: "curve" },
  capital: { 2: "curve", 3: "curve", 4: "marker", 5: "curve", 6: "marker" },
  depth: { 2: "curve", 3: "curve", 4: "curve", 5: "curve", 6: "curve" },
  fee: { 2: "curve", 3: "curve", 4: "curve", 5: "curve", 6: "curve" },
  carry: { 2: "curve", 3: "curve", 4: "curve", 5: "curve", 6: "curve" },
};
export const affectedCharts = (p: ParamId) => Object.keys(AFFECTS[p]).map(Number);
