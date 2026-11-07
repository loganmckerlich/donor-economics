"""Marginal profit strategy: buy YES, donate, sell once the price has gone up.

The idea in five steps:
  1. Buy YES at the current price p0.
  2. Donate D. That raises the true win probability from p0 to p(D).
  3. The market's price goes up, but only by a share ``capture`` of the true boost.
  4. Sell the YES at the higher price. The gain is the *trade profit*.
  5. Optionally, also win the payoff V if the candidate wins.

Because the YES is sold before the election, the trade profit is the same whether the candidate
wins or loses. That is the point: the donation earns a profit on the price boost whatever the
result, and V (if any) is a separate bet on the election that the donor already had.

Assumptions (see README.md), in the same spirit as the Full Hedge model:
  * One buy and one sell. YES is bought at p0 before the donation lands; the donation acts at once;
    the position is sold before the election.
  * The market only moves because of the donation: no other news, drift or noise.
  * The price ends up ``capture`` of the way to the true win probability (1 = all of it,
    0.5 = half, 0 = it ignores the donation, 1.5 = it over-reacts). Time is folded into this one
    number: it is the share of the boost the price has captured by the time you sell.
  * No frictions: orders fill at the quoted price at any size, with no fees, spread, price impact
    or cost of tying up cash. So the trade profit is linear in the size of the position.
  * The donor judges the plan by its expected profit compared with doing nothing.

Money flows, with ``Q`` dollars of YES bought at ``p0`` (so ``N = Q / p0`` shares) and sold at the
new price ``m``:
    trade profit   T = N * (m - p0)
    candidate wins : V - D + T
    candidate loses:     -D + T
"""

from __future__ import annotations

from dataclasses import dataclass

from .effect import P_CAP, win_prob


@dataclass(frozen=True)
class MarginalProfitScenario:
    payoff_if_win: float = 100e6  # V: what the donor receives if the candidate wins (0 = pure trade)
    base_win_prob: float = 0.50  # p0: the price YES is bought at, before the donation
    effect_size: float = 0.015  # k: see ``effect.win_prob``
    effect_scale: float = 10e6  # s
    effect_form: str = "log"  # "log" | "linear" | "saturating"
    donation: float = 10e6  # D
    capital: float = 100e6  # Q: dollars spent buying YES
    capture: float = 1.0  # share of the true boost the price captures by the time you sell

    def win_prob(self, donation: float) -> float:
        """True win probability after donating ``donation``."""
        return win_prob(
            donation, base=self.base_win_prob, size=self.effect_size, scale=self.effect_scale, form=self.effect_form
        )


@dataclass(frozen=True)
class MarginalProfitOutcome:
    price_after: float  # YES price when selling
    true_prob: float  # win probability with the donation
    shares: float  # contracts bought, Q / p0
    trade_profit: float  # T: shares * (price after - p0). The same whether the candidate wins or loses
    donation: float  # D
    profit: float  # T - D: the trade net of the donation, compared with doing nothing (= payoff if it loses)
    payoff_win: float  # V - D + T
    payoff_lose: float  # -D + T
    payoff_win_no_trade: float  # V - D: donating without the trade
    payoff_lose_no_trade: float  # -D
    win_value: float  # V * (p(D) - p0): expected gain from the higher win probability
    ev: float  # profit + win value: expected gain compared with doing nothing
    roi: float  # profit / (capital + donation)


def price_after(m: MarginalProfitScenario) -> float:
    """Price the YES sells at: p0 plus ``capture`` of the true boost."""
    p0 = m.base_win_prob
    boost = m.win_prob(m.donation) - p0
    return min(max(p0 + m.capture * boost, 0.001), P_CAP)


def evaluate(m: MarginalProfitScenario) -> MarginalProfitOutcome:
    p0 = m.base_win_prob
    p_true = m.win_prob(m.donation)
    shares = m.capital / p0
    trade = shares * (price_after(m) - p0)
    profit = trade - m.donation
    win_value = m.payoff_if_win * (p_true - p0)
    spent = m.capital + m.donation
    return MarginalProfitOutcome(
        price_after=price_after(m),
        true_prob=p_true,
        shares=shares,
        trade_profit=trade,
        donation=m.donation,
        profit=profit,
        payoff_win=m.payoff_if_win - m.donation + trade,
        payoff_lose=-m.donation + trade,
        payoff_win_no_trade=m.payoff_if_win - m.donation,
        payoff_lose_no_trade=-m.donation,
        win_value=win_value,
        ev=profit + win_value,
        roi=profit / spent if spent > 0 else 0.0,
    )


def return_per_dollar(m: MarginalProfitScenario) -> float:
    """Gain per dollar spent on YES: ``(price after - p0) / p0``. The trade profit is this times Q."""
    p0 = m.base_win_prob
    return (price_after(m) - p0) / p0


def break_even_capital(m: MarginalProfitScenario) -> float | None:
    """Smallest position whose trade profit alone earns back the donation, ``D / return per dollar``.
    None if the price never rises (no position size can)."""
    g = return_per_dollar(m)
    return m.donation / g if g > 0 else None


def break_even_capture(m: MarginalProfitScenario) -> float | None:
    """Share of the boost the price must capture for the trade profit to earn back the donation,
    ``D * p0 / (Q * boost)``. None if there is no boost or no money in YES."""
    p0 = m.base_win_prob
    boost = m.win_prob(m.donation) - p0
    if m.donation <= 0:
        return 0.0
    if m.capital <= 0 or boost <= 0:
        return None
    return m.donation * p0 / (m.capital * boost)


def first_dollar_return(m: MarginalProfitScenario) -> float:
    """Expected gain from the first donated dollar, ``(V + capture * Q / p0) * k / s``: the higher win
    probability pays V, and the higher price pays on the position. The slope of the effect curve at
    zero is k / s for every form. A donation only pays when this exceeds $1 (compare ``V * k / s`` in
    the Full Hedge model)."""
    return (m.payoff_if_win + m.capture * m.capital / m.base_win_prob) * (m.effect_size / m.effect_scale)
