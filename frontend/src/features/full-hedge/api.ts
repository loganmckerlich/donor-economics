import type { EffectForm } from "@/lib/effect";
import { post } from "@/lib/http";

export interface ScenarioParams {
  payoff_if_win: number;
  base_win_prob: number;
  effect_size: number;
  effect_scale: number;
  effect_form: EffectForm;
  risk_aversion: number;
}

export interface Outcome {
  donation: number;
  hedge: number;
  p_win: number;
  pnl_win: number;
  pnl_lose: number;
  ev: number;
  std: number;
  certainty_equivalent: number;
}

export interface Analysis {
  scenario: ScenarioParams;
  donation: number;
  hedge: number;
  market_price: number;
  outcome: Outcome;
  unhedged: Outcome;
  fully_hedged: Outcome;
  strategy: {
    optimal_donation: number;
    optimal_donation_ev: number;
    optimal_hedge: number;
    full_hedge_size: number;
    donation_ev: number;
    donation_worthwhile: boolean;
    ce_gain_from_full_hedge: number;
    locked_in_pnl: number;
  };
  curves: {
    win_prob: { donation: number[]; log: number[]; linear: number[]; saturating: number[] };
    donation_ev: { donation: number[]; ev: number[] };
    hedge: {
      hedge: number[];
      pnl_win: number[];
      pnl_lose: number[];
      ev: number[];
      std: number[];
      ce_gain: number[];
      ce_gain_by_a: { a: number; values: number[] }[];
    };
  };
}

export interface DonationHeatmap {
  effect_size: number[];
  payoff: number[];
  optimal_donation: number[][]; // [effect_size][payoff]
}

export interface HedgeValueHeatmap {
  risk_aversion: number[];
  donation: number[];
  ce_gain: number[][]; // [risk_aversion][donation]
}

export const fetchAnalysis = (
  scenario: ScenarioParams,
  donation: number,
  hedgeFraction: number,
  signal?: AbortSignal,
) => post<Analysis>("/api/full-hedge/analysis", { scenario, donation, hedge_fraction: hedgeFraction }, signal);

export const fetchDonationHeatmap = (scenario: ScenarioParams, signal?: AbortSignal) =>
  post<DonationHeatmap>(
    "/api/full-hedge/sweep/donation-heatmap",
    { scenario, effect_size_range: [0, 0.1], payoff_range: [20e6, 10e9], n: 25 },
    signal,
  );

export const fetchHedgeValue = (scenario: ScenarioParams, signal?: AbortSignal) =>
  post<HedgeValueHeatmap>(
    "/api/full-hedge/sweep/hedge-value",
    { scenario, risk_aversion_range: [1e-11, 1e-7], donation_range: [0, 150e6], n: 25 },
    signal,
  );
