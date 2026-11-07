"""Marginal profit strategy API: request schema, chart data builder and route. All money in dollars."""

from dataclasses import asdict, replace
from typing import Literal

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field

from donor_economics import MarginalProfitScenario
from donor_economics.marginal_profit import (
    break_even_capital,
    break_even_months,
    evaluate,
    first_dollar_return,
    price_at,
    return_per_dollar,
)

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

    # The donation is the one lever with an interior optimum: profit is linear in the position size
    # and rises with hold time. The grid starts at a $0 donation, which earns exactly $0 (the same as
    # doing nothing), so the best donation is never worse than that.
    best_d, best_d_profit = _argmax(np.linspace(0, MAX_DONATION, 401), lambda d: _profit(replace(m, donation=d)))
    # Price rise needed just to earn the donation back: D / (shares).
    needed_move = m.donation / (m.capital / p0) if m.capital > 0 else None

    months = np.linspace(0, MAX_MONTHS, 49)
    time_curve = {
        "months": months,
        "market_price": [price_at(m, float(t)) for t in months],
        "target_price": [o.target_price] * len(months),
        "true_prob": [o.true_prob] * len(months),
        "start_price": [p0] * len(months),
        "profit": [_profit(replace(m, hold_months=float(t))) for t in months],
    }

    d_max = min(max(2.5 * max(m.donation, best_d), 50e6), MAX_DONATION)
    d_grid = np.linspace(0, d_max, 101)
    donation_curve = {
        "donation": d_grid,
        "profit": [_profit(replace(m, donation=float(d))) for d in d_grid],
    }

    q_max = min(max(2.5 * m.capital, 100e6), MAX_CAPITAL)
    q_grid = np.linspace(0, q_max, 101)
    capital_curve = {
        "capital": q_grid,
        "profit": [_profit(replace(m, capital=float(q))) for q in q_grid],
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
        "profit": [[_profit(replace(m, donation=float(d), capital=float(q))) for d in hd] for q in hq],
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
                "return_per_dollar": return_per_dollar(m),
                "break_even_capital": break_even_capital(m),
                "break_even_months": break_even_months(m),
                "first_dollar_return": first_dollar_return(m),
                "optimal_donation": best_d,
                "optimal_donation_profit": best_d_profit,
            },
            "curves": {"time": time_curve, "donation": donation_curve, "capital": capital_curve},
            "sweeps": {"time": time_heat, "size": size_heat},
        }
    )


# --- Request schema --------------------------------------------------------------------------


class MarginalIn(BaseModel):
    """Marginal profit strategy. Win-probability curve fields match ``ScenarioIn``."""

    base_win_prob: float = Field(0.50, gt=0, lt=0.99)
    effect_size: float = Field(0.015, ge=0, le=1)
    effect_scale: float = Field(10e6, gt=0, le=1e11)
    effect_form: Literal["log", "linear", "saturating"] = "log"
    donation: float = Field(10e6, ge=0, le=1e10)
    capital: float = Field(100e6, ge=0, le=1e10)  # $ spent buying YES
    hold_months: float = Field(3.0, ge=0, le=60)
    half_life_months: float = Field(1.0, ge=0, le=60)  # 0 = the market reprices instantly
    belief: float = Field(1.0, ge=0, le=3)  # share of the true boost the market ends up pricing

    def to_model(self) -> MarginalProfitScenario:
        return MarginalProfitScenario(**self.model_dump())


# --- Route -----------------------------------------------------------------------------------

router = APIRouter(prefix="/api/marginal-profit", tags=["marginal profit"])


@router.post("/analysis")
def post_analysis(body: MarginalIn) -> dict:
    return marginal_analysis(body.to_model())
