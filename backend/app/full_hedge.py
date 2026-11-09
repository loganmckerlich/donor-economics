"""Full hedge strategy API: request schemas, chart data builders and routes. All money in dollars."""

from dataclasses import asdict, replace
from typing import Literal

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field

from donor_economics import (
    Scenario,
    certainty_equivalent,
    donation_ev,
    evaluate,
    full_hedge_size,
    optimal_donation,
    optimal_hedge,
)

from .util import clean

# Reference risk aversions for the "CE gain vs hedge size" chart (CARA a, 1/$).
# a ~ gamma / wealth: 4e-10 = gamma 2 on $5B, 2e-9 = gamma 10 on $5B, 1e-8 = stress case.
REFERENCE_A = (4e-10, 2e-9, 1e-8)
FORMS = ("log", "linear", "saturating")
MAX_DONATION = 1e9


def analysis(
    s: Scenario, donation: float, hedge: float | None, hedge_fraction: float | None = None
) -> dict:
    h_full = full_hedge_size(s, donation)
    if hedge_fraction is not None:
        h = hedge_fraction * h_full
    else:
        h = h_full if hedge is None else hedge
    d_star = optimal_donation(s, MAX_DONATION, 2001)
    h_star = optimal_hedge(s, d_star)

    chosen = evaluate(s, donation, h)
    unhedged = evaluate(s, donation, 0.0)
    full = evaluate(s, donation, h_full)
    d_max = max(2.5 * max(donation, d_star), 100e6)
    d_grid = np.linspace(0, min(d_max, MAX_DONATION), 101)

    # Win probability vs donation, for each functional form (same k and s).
    win_prob = {
        "donation": d_grid,
        **{f: replace(s, effect_form=f).win_prob(d_grid) for f in FORMS},
    }

    # Donation EV relative to not donating.
    ev_curve = {"donation": d_grid, "ev": donation_ev(s, d_grid)}

    # Hedge sweep at the chosen donation.
    h_grid = np.linspace(0, 1.5 * h_full, 121)
    rows = [evaluate(s, donation, x) for x in h_grid]
    ce0 = unhedged.certainty_equivalent
    ref = [
        {
            "a": a,
            "values": [
                certainty_equivalent(r.p_win, r.pnl_win, r.pnl_lose, a)
                - certainty_equivalent(unhedged.p_win, unhedged.pnl_win, unhedged.pnl_lose, a)
                for r in rows
            ],
        }
        for a in REFERENCE_A
    ]
    hedge_curve = {
        "hedge": h_grid,
        "pnl_win": [r.pnl_win for r in rows],
        "pnl_lose": [r.pnl_lose for r in rows],
        "ev": [r.ev for r in rows],
        "std": [r.std for r in rows],
        "ce_gain": [r.certainty_equivalent - ce0 for r in rows],  # at the chosen a
        "ce_gain_by_a": ref,
    }

    return clean(
        {
            "scenario": asdict(s),
            "donation": donation,
            "hedge": h,
            "market_price": s.market_price(donation),
            "outcome": asdict(chosen),
            "unhedged": asdict(unhedged),
            "fully_hedged": asdict(full),
            "strategy": {
                "optimal_donation": d_star,
                "optimal_donation_ev": float(donation_ev(s, d_star)),
                "optimal_hedge": h_star,
                "full_hedge_size": h_full,
                "donation_ev": float(donation_ev(s, donation)),
                "donation_worthwhile": bool(donation_ev(s, donation) > 0),
                "ce_gain_from_full_hedge": full.certainty_equivalent - ce0,
                "locked_in_pnl": full.pnl_win,
            },
            "curves": {"win_prob": win_prob, "donation_ev": ev_curve, "hedge": hedge_curve},
        }
    )


def donation_heatmap(
    s: Scenario, k_range: tuple[float, float], v_range: tuple[float, float], n: int
) -> dict:
    """Optimal donation over (effect size k) x (payoff V)."""
    ks = np.linspace(*k_range, n)
    vs = np.geomspace(*v_range, n)  # payoffs span orders of magnitude, so space them geometrically
    z = [
        [optimal_donation(replace(s, effect_size=float(k), payoff_if_win=float(v)), MAX_DONATION, 1501)
         for v in vs]
        for k in ks
    ]
    return clean({"effect_size": ks, "payoff": vs, "optimal_donation": z})


def hedge_value_heatmap(
    s: Scenario, a_range: tuple[float, float], d_range: tuple[float, float], n: int
) -> dict:
    """Certainty-equivalent gain ($) from the full hedge over (risk aversion a) x (donation D)."""
    a_grid = np.geomspace(*a_range, n)
    d_grid = np.linspace(*d_range, n)
    z = []
    for a in a_grid:
        row = []
        for d in d_grid:
            p = s.win_prob(d)
            h = full_hedge_size(s, d)
            win0, lose0 = s.payoff_if_win - d, -d
            wh, lh = win0 - h, -d + h * s.market_price(d) / (1 - s.market_price(d))
            row.append(
                certainty_equivalent(p, wh, lh, float(a)) - certainty_equivalent(p, win0, lose0, float(a))
            )
        z.append(row)
    return clean({"risk_aversion": a_grid, "donation": d_grid, "ce_gain": z})

# --- Request schemas -------------------------------------------------------------------------


class ScenarioIn(BaseModel):
    payoff_if_win: float = Field(100e6, gt=0, le=1e12)
    base_win_prob: float = Field(0.50, gt=0, lt=0.99)
    effect_size: float = Field(0.015, ge=0, le=1)
    effect_scale: float = Field(10e6, gt=0, le=1e11)
    effect_form: Literal["log", "linear", "saturating"] = "log"
    risk_aversion: float = Field(0.0, ge=0, le=1e-5)

    def to_model(self) -> Scenario:
        return Scenario(**self.model_dump())


class AnalysisIn(BaseModel):
    scenario: ScenarioIn = ScenarioIn()
    donation: float = Field(50e6, ge=0, le=1e11)
    hedge: float | None = Field(25e6, ge=0, le=1e12)  # null = use the full hedge
    # Hedge as a fraction of the full (zero-variance) hedge; takes precedence over `hedge` when set.
    hedge_fraction: float | None = Field(None, ge=0, le=5)


class DonationHeatmapIn(BaseModel):
    scenario: ScenarioIn = ScenarioIn()
    effect_size_range: tuple[float, float] = (0.0, 0.1)
    payoff_range: tuple[float, float] = (20e6, 10e9)  # log-spaced
    n: int = Field(25, ge=5, le=60)


class HedgeValueIn(BaseModel):
    scenario: ScenarioIn = ScenarioIn()
    risk_aversion_range: tuple[float, float] = (1e-11, 1e-7)  # log-spaced
    donation_range: tuple[float, float] = (0.0, 150e6)
    n: int = Field(25, ge=5, le=60)


# --- Routes ----------------------------------------------------------------------------------

router = APIRouter(prefix="/api/full-hedge", tags=["full hedge"])


@router.post("/analysis")
def post_analysis(body: AnalysisIn) -> dict:
    return analysis(body.scenario.to_model(), body.donation, body.hedge, body.hedge_fraction)


@router.post("/sweep/donation-heatmap")
def post_donation_heatmap(body: DonationHeatmapIn) -> dict:
    return donation_heatmap(body.scenario.to_model(), body.effect_size_range, body.payoff_range, body.n)


@router.post("/sweep/hedge-value")
def post_hedge_value(body: HedgeValueIn) -> dict:
    return hedge_value_heatmap(body.scenario.to_model(), body.risk_aversion_range, body.donation_range, body.n)
