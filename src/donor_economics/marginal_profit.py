"""Marginal profit strategy: buy YES, donate, sell once the market has priced in the boost.

The donor does not hold to the election and does not hedge. They buy YES contracts at the
current price, make the donation, wait ``hold`` months, then sell. The donation raises the
true win probability from p0 to p(D); the market takes time to notice. The trade profits from
the part of that move that has shown up in the price by the time they sell. The donation
itself is a sunk cost that the trade has to earn back.

Assumptions (see README.md), in the same spirit as the Full Hedge model:
  * One entry, one exit. YES is bought at the pre-donation price p0, the donation lands
    immediately, and the position is closed after ``hold`` months. Resolution risk is ignored.
  * The market only ever moves because of the donation: no other news, drift or noise.
  * Catch-up is exponential. The gap between the price and its eventual level halves every
    ``half_life`` months.
  * The market ends up pricing ``belief`` of the true boost (1 = all of it, 0.5 = it only half
    believes the donation matters, 1.5 = it over-reacts).
  * No frictions: orders fill at the quoted price at any size, with no fees, no spread, no
    price impact and no cost of tying up cash. So profit is linear in the size of the position.
  * The donor judges the plan by its profit compared with doing nothing, ignoring risk.

Money flows, with ``Q`` dollars of YES bought at ``p0`` (so ``N = Q / p0`` shares) and sold at
the market price ``m`` after ``hold`` months:
    profit = N * (m - p0) - D
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from .effect import P_CAP, win_prob


@dataclass(frozen=True)
class MarginalProfitScenario:
    base_win_prob: float = 0.50  # p0: the price YES is bought at, before the donation
    effect_size: float = 0.015  # k: see ``effect.win_prob``
    effect_scale: float = 10e6  # s
    effect_form: str = "log"  # "log" | "linear" | "saturating"
    donation: float = 10e6  # D
    capital: float = 100e6  # Q: dollars spent buying YES
    hold_months: float = 3.0  # time between buying and selling
    half_life_months: float = 1.0  # time for the market to close half the remaining gap
    belief: float = 1.0  # share of the true boost the market ends up pricing

    def win_prob(self, donation: float) -> float:
        """True win probability after donating ``donation``."""
        return win_prob(
            donation, base=self.base_win_prob, size=self.effect_size, scale=self.effect_scale, form=self.effect_form
        )


@dataclass(frozen=True)
class MarginalProfitOutcome:
    market_price: float  # YES price when selling
    target_price: float  # price the market is converging to
    true_prob: float  # win probability with the donation
    shares: float  # contracts bought, Q / p0
    price_gain: float  # shares * (market price - p0)
    donation: float  # subtracted
    profit: float  # price gain - donation, compared with doing nothing
    roi: float  # profit / (capital + donation)


def target_price(m: MarginalProfitScenario) -> float:
    """Price the market converges to: p0 plus ``belief`` of the true boost."""
    p0 = m.base_win_prob
    boost = m.win_prob(m.donation) - p0
    return min(max(p0 + m.belief * boost, 0.001), P_CAP)


def catch_up(hold_months: float, half_life_months: float) -> float:
    """Share of the eventual move that has happened after ``hold_months``."""
    if half_life_months <= 0:
        return 1.0
    return 1.0 - 0.5 ** (hold_months / half_life_months)


def price_at(m: MarginalProfitScenario, months: float) -> float:
    p0 = m.base_win_prob
    return p0 + (target_price(m) - p0) * catch_up(months, m.half_life_months)


def evaluate(m: MarginalProfitScenario) -> MarginalProfitOutcome:
    p0 = m.base_win_prob
    mkt = price_at(m, m.hold_months)
    shares = m.capital / p0
    gain = shares * (mkt - p0)
    profit = gain - m.donation
    spent = m.capital + m.donation
    return MarginalProfitOutcome(
        market_price=mkt,
        target_price=target_price(m),
        true_prob=m.win_prob(m.donation),
        shares=shares,
        price_gain=gain,
        donation=m.donation,
        profit=profit,
        roi=profit / spent if spent > 0 else 0.0,
    )


def return_per_dollar(m: MarginalProfitScenario) -> float:
    """Gain per dollar spent on YES: ``(m - p0) / p0``. Profit is this times Q, minus D."""
    p0 = m.base_win_prob
    return (price_at(m, m.hold_months) - p0) / p0


def break_even_capital(m: MarginalProfitScenario) -> float | None:
    """Smallest position that earns back the donation, ``D / return per dollar``. None if the
    price never rises (the donation can't be earned back at any size)."""
    g = return_per_dollar(m)
    return m.donation / g if g > 0 else None


def break_even_months(m: MarginalProfitScenario) -> float | None:
    """Hold time at which profit reaches zero, or None if the market never closes enough of the gap
    (profit only approaches the eventual gain, which may still be below the donation)."""
    p0 = m.base_win_prob
    gap = target_price(m) - p0
    if m.donation <= 0:
        return 0.0
    if m.capital <= 0 or gap <= 0:
        return None
    needed = m.donation * p0 / (m.capital * gap)  # share of the gap that must be closed
    if needed >= 1:
        return None
    if m.half_life_months <= 0:
        return 0.0
    return m.half_life_months * math.log2(1.0 / (1.0 - needed))


def first_dollar_return(m: MarginalProfitScenario) -> float:
    """Expected gain from the first donated dollar, ``(Q / p0) * belief * catch-up * k / s``. The
    slope of the effect curve at zero is k / s for every form. A donation only pays when this
    exceeds $1 (compare ``V * k / s`` in the Full Hedge model)."""
    return (m.capital / m.base_win_prob) * m.belief * catch_up(m.hold_months, m.half_life_months) * (
        m.effect_size / m.effect_scale
    )
