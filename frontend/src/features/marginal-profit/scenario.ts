import type { EffectForm } from "@/lib/effect";

/** Slider state for the Marginal Profit Strategy page. */
export interface UiState {
  boost: number; // win-probability boost from a $50M donation (0.027 = 2.7 points)
  donation: number; // $
  capital: number; // $ spent buying YES
  capture: number; // share of the true boost the price captures by the time you sell
  payoff: number; // $ received if the candidate wins (0 = pure trade)
  // advanced
  baseProb: number;
  effectForm: EffectForm;
  effectScale: number; // $
}

export const DEFAULT_UI: UiState = {
  boost: 0.027,
  donation: 10e6,
  capital: 100e6,
  capture: 1,
  payoff: 100e6,
  baseProb: 0.5,
  effectForm: "log",
  effectScale: 10e6,
};

export type ParamId =
  | "boost" | "donation" | "capital" | "capture" | "payoff"
  | "baseProb" | "effectForm" | "effectScale";

export const CHART_TITLES: Record<number, string> = {
  1: "How the probability moves",
  2: "Payoff by outcome",
  3: "Payoff by trade size",
  4: "Profit by donation size",
  5: "Profit by market response",
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
  donation: { 1: "curve", 2: "curve", 3: "curve", 4: "marker", 5: "curve", 6: "marker" },
  capital: { 2: "curve", 3: "marker", 4: "curve", 5: "curve", 6: "marker" },
  capture: { 1: "curve", 2: "curve", 3: "curve", 4: "curve", 5: "marker", 6: "curve" },
  payoff: { 2: "curve", 3: "curve", 4: "curve", 5: "curve", 6: "curve" },
};
export const affectedCharts = (p: ParamId) => Object.keys(AFFECTS[p]).map(Number);
