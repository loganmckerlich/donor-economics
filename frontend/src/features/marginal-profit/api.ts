import type { EffectForm } from "@/lib/effect";
import { post } from "@/lib/http";

export interface MarginalOutcome {
  market_price: number; // YES price when selling
  target_price: number; // price the market is heading to
  true_prob: number; // win probability with the donation
  shares: number;
  price_gain: number;
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
}

export interface MarginalAnalysis {
  scenario: { donation: number; capital: number; hold_months: number; half_life_months: number; belief: number };
  outcome: MarginalOutcome;
  strategy: {
    profitable: boolean;
    price_move: number;
    true_move: number;
    needed_move: number | null; // null when nothing is spent on YES
    return_per_dollar: number;
    break_even_capital: number | null; // null when the price never rises
    break_even_months: number | null; // null when the market never closes enough of the gap
    first_dollar_return: number;
    optimal_donation: number;
    optimal_donation_profit: number;
  };
  curves: {
    time: {
      months: number[]; market_price: number[]; target_price: number[]; true_prob: number[];
      start_price: number[]; profit: number[];
    };
    donation: { donation: number[]; profit: number[] };
    capital: { capital: number[]; profit: number[] };
  };
  sweeps: {
    time: { hold_months: number[]; half_life_months: number[]; profit: number[][] }; // [half_life][hold]
    size: { donation: number[]; capital: number[]; profit: number[][] }; // [capital][donation]
  };
}

export const fetchMarginal = (params: MarginalParams, signal?: AbortSignal) =>
  post<MarginalAnalysis>("/api/marginal-profit/analysis", params, signal);
