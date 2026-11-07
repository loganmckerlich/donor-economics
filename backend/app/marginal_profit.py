"""Marginal profit strategy API: request schema, chart data builder and route. All money in dollars."""

from dataclasses import asdict, replace
from typing import Literal

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field

from donor_economics import MarginalProfitScenario
from donor_economics.marginal_profit import (
    break_even_capital,
    break_even_capture,
    evaluate,
    first_dollar_return,
    return_per_dollar,
)

from .util import clean

MAX_DONATION = 200e6  # matches the UI slider ranges; beyond these the model is extrapolating
MAX_CAPITAL = 1e9
MAX_CAPTURE = 2.0
# Three fixed market responses, shown side by side so the risk is about the market, not the election.
RESPONSES = ((0.0, "Ignores the donation"), (0.5, "Prices half of it"), (1.0, "Prices all of it"))


def _ev(m: MarginalProfitScenario) -> float:
    return evaluate(m).ev


def marginal_analysis(m: MarginalProfitScenario, n_heat: int = 21) -> dict:
    o = evaluate(m)
    p0 = m.base_win_prob

    # The donation is the one lever with an interior optimum: the trade profit is linear in the position
    # and the win value is linear in the probability, but the effect curve flattens. The grid starts at a
    # $0 donation, which earns exactly $0 (the same as doing nothing), so the best donation is never worse.
    d_opt = np.linspace(0, MAX_DONATION, 401)
    evs = [_ev(replace(m, donation=float(d))) for d in d_opt]
    i = int(np.argmax(evs))
    best_d, best_d_ev = float(d_opt[i]), float(evs[i])

    needed_move = m.donation / (m.capital / p0) if m.capital > 0 else None  # price rise that earns D back

    q_max = min(max(2.5 * m.capital, 100e6), MAX_CAPITAL)
    q_grid = np.linspace(0, q_max, 101)
    q_rows = [evaluate(replace(m, capital=float(q))) for q in q_grid]
    capital_curve = {
        "capital": q_grid,
        "payoff_win": [r.payoff_win for r in q_rows],
        "payoff_lose": [r.payoff_lose for r in q_rows],
        "ev": [r.ev for r in q_rows],
    }

    d_max = min(max(2.5 * max(m.donation, best_d), 50e6), MAX_DONATION)
    d_grid = np.linspace(0, d_max, 101)
    d_rows = [evaluate(replace(m, donation=float(d))) for d in d_grid]
    donation_curve = {
        "donation": d_grid,
        "profit": [r.profit for r in d_rows],
        "ev": [r.ev for r in d_rows],
    }

    c_grid = np.linspace(0, MAX_CAPTURE, 41)
    c_rows = [evaluate(replace(m, capture=float(c))) for c in c_grid]
    capture_curve = {
        "capture": c_grid,
        "profit": [r.profit for r in c_rows],
        "ev": [r.ev for r in c_rows],
    }

    responses = []
    for share, label in RESPONSES:
        r = evaluate(replace(m, capture=share))
        responses.append(
            {
                "capture": share,
                "label": label,
                "trade_profit": r.trade_profit,
                "profit": r.profit,
                "payoff_win": r.payoff_win,
                "payoff_lose": r.payoff_lose,
                "ev": r.ev,
            }
        )

    # Heatmap: the two dollar levers. Donation across, position size up. Shaded by expected gain.
    hd = np.linspace(0, d_max, n_heat)
    hq = np.linspace(0, q_max, n_heat)
    size_heat = {
        "donation": hd,
        "capital": hq,
        "ev": [[_ev(replace(m, donation=float(d), capital=float(q))) for d in hd] for q in hq],
    }

    return clean(
        {
            "scenario": asdict(m),
            "outcome": asdict(o),
            "strategy": {
                "profitable": o.profit > 0,
                "price_move": o.price_after - p0,
                "true_move": o.true_prob - p0,
                "needed_move": needed_move,
                "return_per_dollar": return_per_dollar(m),
                "break_even_capital": break_even_capital(m),
                "break_even_capture": break_even_capture(m),
                "first_dollar_return": first_dollar_return(m),
                "optimal_donation": best_d,
                "optimal_donation_ev": best_d_ev,
            },
            "responses": responses,
            "curves": {"capital": capital_curve, "donation": donation_curve, "capture": capture_curve},
            "sweeps": {"size": size_heat},
        }
    )


# --- Request schema --------------------------------------------------------------------------


class MarginalIn(BaseModel):
    """Marginal profit strategy. Win-probability curve fields match ``ScenarioIn``."""

    payoff_if_win: float = Field(100e6, ge=0, le=1e12)  # V: 0 = pure trade
    base_win_prob: float = Field(0.50, gt=0, lt=0.99)
    effect_size: float = Field(0.015, ge=0, le=1)
    effect_scale: float = Field(10e6, gt=0, le=1e11)
    effect_form: Literal["log", "linear", "saturating"] = "log"
    donation: float = Field(10e6, ge=0, le=1e10)
    capital: float = Field(100e6, ge=0, le=1e10)  # $ spent buying YES
    capture: float = Field(1.0, ge=0, le=3)  # share of the true boost the price captures by the sale

    def to_model(self) -> MarginalProfitScenario:
        return MarginalProfitScenario(**self.model_dump())


# --- Route -----------------------------------------------------------------------------------

router = APIRouter(prefix="/api/marginal-profit", tags=["marginal profit"])


@router.post("/analysis")
def post_analysis(body: MarginalIn) -> dict:
    return marginal_analysis(body.to_model())
