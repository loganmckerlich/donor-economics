"""Marginal profit strategy: buy YES, donate, sell once the market has moved.

The donor does not hold to the election and does not hedge. They buy YES contracts at the
current price, make the donation, wait ``hold`` months, then sell. The donation raises the
true win probability from p0 to p(D); the market takes time to notice. The trade profits from
the part of that move that has shown up in the price by the time they sell. The donation
itself is a sunk cost that the trade has to earn back.

Heavy simplifications (see README):
  * One entry, one exit. YES is bought at the pre-donation price p0, the donation lands
    immediately, and the position is closed after ``hold`` months. Resolution risk is ignored.
  * The market only ever moves because of the donation: no other news, drift or noise.
  * Catch-up is exponential. The gap between the price and its eventual level halves every
    ``half_life`` months.
  * The market ends up pricing ``belief`` of the true boost (1 = all of it, 0.5 = it only half
    believes the donation matters, 1.5 = it over-reacts).
  * Price impact is linear in order size; each fill gets the average of the move it causes.
  * Fees are a flat share of traded dollars on each side; cash costs a fixed annual rate.

Money flows, with ``Q`` dollars of YES bought at fill price ``e`` (so ``N = Q / e`` shares),
sold at fill price ``x``:
    profit = N * x - Q - fees - carry - D
"""

from __future__ import annotations

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
    depth_per_point: float = 50e6  # $ of orders that move the price one point (0.01)
    fee_rate: float = 0.01  # per side, share of dollars traded (fees + spread)
    carry_rate: float = 0.05  # annual opportunity cost of the cash tied up in YES


    def win_prob(self, donation: float) -> float:
        """True win probability after donating ``donation``."""
        return win_prob(
            donation, base=self.base_win_prob, size=self.effect_size, scale=self.effect_scale, form=self.effect_form
        )


@dataclass(frozen=True)
class MarginalProfitOutcome:
    entry_price: float  # average fill when buying
    exit_price: float  # average fill when selling
    market_price: float  # quoted price at exit, before the sale moves it
    target_price: float  # price the market is converging to
    true_prob: float  # win probability with the donation
    shares: float
    gross_gain: float  # frictionless: shares bought at p0, sold at the market price
    slippage: float  # negative: cost of moving the price on the way in and out
    fees: float  # positive number, subtracted
    carry: float  # positive number, subtracted
    donation: float  # positive number, subtracted
    profit: float
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
    tgt = target_price(m)
    mkt = p0 + (tgt - p0) * catch_up(m.hold_months, m.half_life_months)
    q = m.capital
    per_dollar = 1.0 / (m.depth_per_point * 100.0)  # price move per $ of orders

    entry = min(p0 + 0.5 * q * per_dollar, P_CAP)  # linear impact: average of the move
    shares = q / entry
    exit_move = shares * mkt * per_dollar  # exit order size, in dollars, times impact
    exit_ = max(mkt - 0.5 * exit_move, 0.0)
    proceeds = shares * exit_

    gross = (q / p0) * (mkt - p0)
    slippage = (proceeds - q) - gross
    fees = m.fee_rate * (q + proceeds)
    carry = q * m.carry_rate * m.hold_months / 12.0
    profit = proceeds - q - fees - carry - m.donation
    return MarginalProfitOutcome(
        entry_price=entry,
        exit_price=exit_,
        market_price=mkt,
        target_price=tgt,
        true_prob=m.win_prob(m.donation),
        shares=shares,
        gross_gain=gross,
        slippage=slippage,
        fees=fees,
        carry=carry,
        donation=m.donation,
        profit=profit,
        roi=profit / (q + m.donation) if q + m.donation > 0 else 0.0,
    )
