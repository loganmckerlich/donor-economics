import type { EffectForm } from "@/lib/effect";
import { post } from "@/lib/http";

export interface MarginalOutcome {
  entry_price: number;
  exit_price: number;
  market_price: number;
  target_price: number;
  true_prob: number;
  shares: number;
  gross_gain: number;
  slippage: number;
  fees: number;
  carry: number;
  donation: number;
  profit: number;
  roi: number;
}

export interface MarginalParams {
  base_win_prob: number;
  effect_size: number;
  effect_scale: number;
  effect_form: EffectForm;
  donation: number;
  capital: number;
  hold_months: number;
  half_life_months: number;
  belief: number;
  depth_per_point: number;
  fee_rate: number;
  carry_rate: number;
}

export interface MarginalAnalysis {
  scenario: { donation: number; capital: number; hold_months: number; half_life_months: number; belief: number };
  outcome: MarginalOutcome;
  strategy: {
    profitable: boolean;
    price_move: number;
    true_move: number;
    needed_move: number;
    best_plan: { donation: number; capital: number; hold_months: number; profit: number };
    optimal_hold: number;
    optimal_hold_profit: number;
    optimal_donation: number;
    optimal_donation_profit: number;
    optimal_capital: number;
    optimal_capital_profit: number;
  };
  curves: {
    time: {
      months: number[]; market_price: number[]; target_price: number[]; true_prob: number[];
      start_price: number[]; profit: number[]; profit_before_costs: number[];
    };
    donation: { donation: number[]; profit: number[]; exit_price: number[] };
    capital: { capital: number[]; profit: number[]; profit_before_costs: number[] };
  };
  sweeps: {
    time: { hold_months: number[]; half_life_months: number[]; profit: number[][] }; // [half_life][hold]
    size: { donation: number[]; capital: number[]; profit: number[][] }; // [capital][donation]
  };
}

export const fetchMarginal = (params: MarginalParams, signal?: AbortSignal) =>
  post<MarginalAnalysis>("/api/marginal-profit/analysis", params, signal);
