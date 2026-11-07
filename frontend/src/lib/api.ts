export type EffectForm = "log" | "linear" | "saturating";

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

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export const fetchAnalysis = (
  scenario: ScenarioParams,
  donation: number,
  hedgeFraction: number,
  signal?: AbortSignal,
) => post<Analysis>("/api/analysis", { scenario, donation, hedge_fraction: hedgeFraction }, signal);

export const fetchDonationHeatmap = (scenario: ScenarioParams, signal?: AbortSignal) =>
  post<DonationHeatmap>(
    "/api/sweep/donation-heatmap",
    { scenario, effect_size_range: [0, 0.1], payoff_range: [20e6, 10e9], n: 25 },
    signal,
  );

export const fetchHedgeValue = (scenario: ScenarioParams, signal?: AbortSignal) =>
  post<HedgeValueHeatmap>(
    "/api/sweep/hedge-value",
    { scenario, risk_aversion_range: [1e-11, 1e-7], donation_range: [0, 150e6], n: 25 },
    signal,
  );

export const fetchMarginal = (params: MarginalParams, signal?: AbortSignal) =>
  post<MarginalAnalysis>("/api/marginal", params, signal);
