import type { EffectForm } from "@/lib/effect";
import { post } from "@/lib/http";

export interface MarginalOutcome {
  price_after: number; // YES price when selling
  true_prob: number; // win probability with the donation
  shares: number;
  trade_profit: number; // the same whether the candidate wins or loses
  donation: number;
  profit: number; // trade profit minus the donation (= payoff if the candidate loses)
  payoff_win: number;
  payoff_lose: number;
  payoff_win_no_trade: number;
  payoff_lose_no_trade: number;
  win_value: number; // V * (p(D) - p0)
  ev: number; // profit + win value, vs doing nothing
  roi: number;
}

export interface MarginalParams {
  payoff_if_win: number;
  base_win_prob: number;
  effect_size: number;
  effect_scale: number;
  effect_form: EffectForm;
  donation: number;
  capital: number;
  capture: number;
}

export interface MarketResponse {
  capture: number;
  label: string;
  trade_profit: number;
  profit: number;
  payoff_win: number;
  payoff_lose: number;
  ev: number;
}

export interface MarginalAnalysis {
  scenario: { payoff_if_win: number; base_win_prob: number; donation: number; capital: number; capture: number };
  outcome: MarginalOutcome;
  strategy: {
    profitable: boolean;
    price_move: number;
    true_move: number;
    needed_move: number | null; // null when nothing is spent on YES
    return_per_dollar: number;
    break_even_capital: number | null; // null when the price never rises
    break_even_capture: number | null; // null when there is no boost or nothing spent on YES
    first_dollar_return: number;
    optimal_donation: number;
    optimal_donation_ev: number;
  };
  responses: MarketResponse[];
  curves: {
    capital: { capital: number[]; payoff_win: number[]; payoff_lose: number[]; ev: number[] };
    donation: { donation: number[]; profit: number[]; ev: number[] };
    capture: { capture: number[]; profit: number[]; ev: number[] };
  };
  sweeps: {
    size: { donation: number[]; capital: number[]; ev: number[][] }; // [capital][donation]
  };
}

export const fetchMarginal = (params: MarginalParams, signal?: AbortSignal) =>
  post<MarginalAnalysis>("/api/marginal-profit/analysis", params, signal);
