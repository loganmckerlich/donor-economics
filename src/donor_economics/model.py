"""Core economics of a donor hedging a political outcome on a prediction market.

Assumptions (see README.md):
  * Static, one-shot, binary market.
  * Donor receives ``V`` iff candidate A wins. Donation ``D`` is a sunk cost.
  * Win probability is a concave function of donation, ``p(D)`` (log by default).
  * The market is efficient and reprices for the donation: the YES price is p(D).
  * The donor fills the whole order at that price: no impact, no fees, no carry cost.
  * The donor has CARA utility, ``u(x) = -exp(-a x)``; ``a = 0`` is risk-neutral.

Payoffs, with ``m = p(D)`` the YES price and ``H`` dollars spent on NO:
    A wins : V - D - H
    A loses: -D + H * m / (1 - m)        (NO shares = H / (1 - m), each pays 1)
"""

from __future__ import annotations

from dataclasses import dataclass
import math

import numpy as np

P_CAP = 0.999  # keep prices strictly inside (0, 1)


@dataclass(frozen=True)
class Scenario:
    payoff_if_win: float = 100e6  # V
    base_win_prob: float = 0.45  # p0: P(A wins) with no donation
    effect_size: float = 0.015  # k: prob. per unit of ln(1+D/s); ~+2.7pts at $50M (unverified)
    effect_scale: float = 10e6  # s: donation scale of the curve ($)
    effect_form: str = "log"  # "log" | "linear" | "saturating"
    risk_aversion: float = 0.0  # a: CARA coefficient (per $); 0 = risk-neutral

    def win_prob(self, donation):
        """P(A wins) given donation(s). Accepts a float or a numpy array."""
        x = np.asarray(donation, dtype=float) / self.effect_scale
        if self.effect_form == "log":
            lift = self.effect_size * np.log1p(x)
        elif self.effect_form == "linear":
            lift = self.effect_size * x
        elif self.effect_form == "saturating":
            lift = self.effect_size * (1 - np.exp(-x))
        else:
            raise ValueError(f"unknown effect_form {self.effect_form!r}")
        out = np.minimum(self.base_win_prob + lift, P_CAP)
        return float(out) if out.ndim == 0 else out

    def market_price(self, donation: float) -> float:
        """YES price. Efficient market that has priced in the donation."""
        return self.win_prob(donation)


@dataclass(frozen=True)
class Outcome:
    donation: float
    hedge: float
    p_win: float
    pnl_win: float
    pnl_lose: float
    ev: float
    std: float
    certainty_equivalent: float


def pnl(s: Scenario, donation: float, hedge: float) -> tuple[float, float]:
    """(P&L if A wins, P&L if A loses)."""
    m = s.market_price(donation)
    win = s.payoff_if_win - donation - hedge
    lose = -donation + hedge * m / (1 - m)
    return win, lose


def certainty_equivalent(p: float, win: float, lose: float, a: float) -> float:
    """CARA certainty equivalent of the two-point gamble. Equals EV when a == 0."""
    if a == 0:
        return p * win + (1 - p) * lose
    # -log(E[exp(-a x)]) / a, computed with log-sum-exp for stability.
    terms = np.array([math.log(p) - a * win, math.log1p(-p) - a * lose])
    top = terms.max()
    return -(top + math.log(np.exp(terms - top).sum())) / a


def evaluate(s: Scenario, donation: float, hedge: float) -> Outcome:
    p = s.win_prob(donation)
    win, lose = pnl(s, donation, hedge)
    ev = p * win + (1 - p) * lose
    std = math.sqrt(p * (win - ev) ** 2 + (1 - p) * (lose - ev) ** 2)
    ce = certainty_equivalent(p, win, lose, s.risk_aversion)
    return Outcome(donation, hedge, p, win, lose, ev, std, ce)


def full_hedge_size(s: Scenario, donation: float) -> float:
    """Zero-variance hedge: equalises win and lose P&L. H = V * (1 - m)."""
    return s.payoff_if_win * (1 - s.market_price(donation))


def optimal_hedge(s: Scenario, donation: float) -> float:
    """CE-maximising hedge. The hedge is fairly priced, so EV is unchanged by H and
    any risk-averse donor fully hedges; a risk-neutral donor is indifferent (0 returned).
    """
    return 0.0 if s.risk_aversion == 0 else full_hedge_size(s, donation)


def donation_ev(s: Scenario, donation):
    """EV of donating ``donation`` relative to not donating at all (hedge-independent)."""
    return (s.win_prob(donation) - s.win_prob(0)) * s.payoff_if_win - donation


def optimal_donation(s: Scenario, max_donation: float = 500e6, n: int = 5001) -> float:
    """Donation maximising EV gain over no donation (grid search). The fair hedge only
    removes variance, so it does not change this."""
    grid = np.linspace(0, max_donation, n)
    return float(grid[int(np.argmax(donation_ev(s, grid)))])
