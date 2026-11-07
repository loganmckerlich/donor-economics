"""Marginal profit strategy API: request schema, chart data builder and route. All money in dollars."""

from dataclasses import asdict, replace
from typing import Literal

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field

from donor_economics import MarginalProfitScenario
from donor_economics.marginal_profit import evaluate, price_at

from .util import clean

MAX_MONTHS = 12.0
MAX_DONATION = 200e6  # matches the UI slider ranges; beyond these the model is extrapolating
MAX_CAPITAL = 1e9
HALF_LIFE_RANGE = (0.1, 6.0)  # months, log-spaced on the heatmap


def _profit(m: MarginalProfitScenario) -> float:
    return evaluate(m).profit


def _argmax(xs: np.ndarray, f) -> tuple[float, float]:
    vals = [f(float(x)) for x in xs]
    i = int(np.argmax(vals))
    return float(xs[i]), float(vals[i])


def marginal_analysis(m: MarginalProfitScenario, n_heat: int = 21) -> dict:
    o = evaluate(m)
    p0 = m.base_win_prob

    # Best choice of each lever on its own, the others held where the user has them.
    best_hold, best_hold_profit = _argmax(
        np.linspace(0, MAX_MONTHS, 121), lambda t: _profit(replace(m, hold_months=t))
    )
    best_d, best_d_profit = _argmax(
        np.linspace(0, MAX_DONATION, 251), lambda d: _profit(replace(m, donation=d))
    )
    best_q, best_q_profit = _argmax(
        np.linspace(0, MAX_CAPITAL, 401), lambda q: _profit(replace(m, capital=q))
    )

    # Best overall plan: coarse donation x capital grid at the user's hold time, then tune the hold.
    # Doing nothing earns $0, so a plan only counts if it beats that.
    best = (0.0, 0.0, m.hold_months, 0.0)
    for d in np.linspace(0, MAX_DONATION, 26):
        for q in np.linspace(0, MAX_CAPITAL, 31):
            p = _profit(replace(m, donation=float(d), capital=float(q)))
            if p > best[3]:
                best = (float(d), float(q), m.hold_months, p)
    if best[3] > 0:
        d, q = best[0], best[1]
        t, p = _argmax(
            np.linspace(0, MAX_MONTHS, 49), lambda t: _profit(replace(m, donation=d, capital=q, hold_months=t))
        )
        best = (d, q, t, p)
    best_plan = {"donation": best[0], "capital": best[1], "hold_months": best[2], "profit": best[3]}

    # Price move the position needs just to cover its costs (approximate: costs shift a little with the move).
    needed_gain = o.donation + o.fees + o.carry - o.slippage
    needed_move = needed_gain / (m.capital / p0) if m.capital > 0 else float("inf")

    months = np.linspace(0, MAX_MONTHS, 49)
    time_rows = [evaluate(replace(m, hold_months=float(t))) for t in months]
    time_curve = {
        "months": months,
        "market_price": [price_at(m, float(t)) for t in months],
        "target_price": [o.target_price] * len(months),
        "true_prob": [o.true_prob] * len(months),
        "start_price": [p0] * len(months),
        "profit": [r.profit for r in time_rows],
        # before fees and carry: the trade's price gain net of slippage, minus the donation
        "profit_before_costs": [r.profit + r.fees + r.carry for r in time_rows],
    }

    d_max = min(max(2.5 * max(m.donation, best_d), 50e6), MAX_DONATION)
    d_grid = np.linspace(0, d_max, 101)
    d_rows = [evaluate(replace(m, donation=float(d))) for d in d_grid]
    donation_curve = {
        "donation": d_grid,
        "profit": [r.profit for r in d_rows],
        "exit_price": [r.market_price for r in d_rows],
    }

    q_max = min(max(2.5 * max(m.capital, best_q), 100e6), MAX_CAPITAL)
    q_grid = np.linspace(0, q_max, 101)
    q_rows = [evaluate(replace(m, capital=float(q))) for q in q_grid]
    capital_curve = {
        "capital": q_grid,
        "profit": [r.profit for r in q_rows],
        "profit_before_costs": [r.profit + r.fees + r.carry for r in q_rows],
    }

    # Heatmap 1: the time assumptions. Hold time across, market speed up.
    h_months = np.linspace(0.25, MAX_MONTHS, n_heat)
    h_life = np.geomspace(*HALF_LIFE_RANGE, n_heat)
    time_heat = {
        "hold_months": h_months,
        "half_life_months": h_life,
        "profit": [
            [_profit(replace(m, hold_months=float(t), half_life_months=float(h))) for t in h_months]
            for h in h_life
        ],
    }

    # Heatmap 2: the two dollar levers. Donation across, capital up.
    hd = np.linspace(0, d_max, n_heat)
    hq = np.linspace(0, q_max, n_heat)
    size_heat = {
        "donation": hd,
        "capital": hq,
        "profit": [
            [_profit(replace(m, donation=float(d), capital=float(q))) for d in hd] for q in hq
        ],
    }

    return clean(
        {
            "scenario": asdict(m),
            "outcome": asdict(o),
            "strategy": {
                "profitable": o.profit > 0,
                "price_move": o.market_price - p0,
                "true_move": o.true_prob - p0,
                "needed_move": needed_move,
                "best_plan": best_plan,
                "optimal_hold": best_hold,
                "optimal_hold_profit": best_hold_profit,
                "optimal_donation": best_d,
                "optimal_donation_profit": best_d_profit,
                "optimal_capital": best_q,
                "optimal_capital_profit": best_q_profit,
            },
            "curves": {"time": time_curve, "donation": donation_curve, "capital": capital_curve},
            "sweeps": {"time": time_heat, "size": size_heat},
        }
    )


# --- Request schema --------------------------------------------------------------------------


class MarginalIn(BaseModel):
    """Marginal-profit strategy. Win-probability curve fields match ``ScenarioIn``."""

    base_win_prob: float = Field(0.50, gt=0, lt=0.99)
    effect_size: float = Field(0.015, ge=0, le=1)
    effect_scale: float = Field(10e6, gt=0, le=1e11)
    effect_form: Literal["log", "linear", "saturating"] = "log"
    donation: float = Field(10e6, ge=0, le=1e10)
    capital: float = Field(100e6, ge=0, le=1e10)  # $ spent buying YES
    hold_months: float = Field(3.0, ge=0, le=60)
    half_life_months: float = Field(1.0, ge=0, le=60)  # 0 = the market reprices instantly
    belief: float = Field(1.0, ge=0, le=3)  # share of the true boost the market ends up pricing
    depth_per_point: float = Field(200e6, gt=0, le=1e12)  # $ of orders that move the price 1 point
    fee_rate: float = Field(0.01, ge=0, le=0.2)  # per side
    carry_rate: float = Field(0.05, ge=0, le=1)  # annual

    def to_model(self) -> MarginalProfitScenario:
        return MarginalProfitScenario(**self.model_dump())


# --- Route -----------------------------------------------------------------------------------

router = APIRouter(prefix="/api/marginal-profit", tags=["marginal profit"])


@router.post("/analysis")
def post_analysis(body: MarginalIn) -> dict:
    return marginal_analysis(body.to_model())
