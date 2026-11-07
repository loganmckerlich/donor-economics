from dataclasses import replace

import pytest

from donor_economics import MarginalProfitScenario
from donor_economics.marginal_profit import catch_up, evaluate, price_at, target_price

# Frictionless: no impact, fees or carry, so profit is just the price move on the shares minus D.
FREE = dict(depth_per_point=1e18, fee_rate=0.0, carry_rate=0.0)


def test_catch_up_halves_the_gap_each_half_life():
    assert catch_up(0, 2) == 0
    assert catch_up(2, 2) == pytest.approx(0.5)
    assert catch_up(4, 2) == pytest.approx(0.75)
    assert catch_up(0, 0) == 1  # instant market


def test_price_converges_to_belief_share_of_the_true_boost():
    m = MarginalProfitScenario(belief=0.5, half_life_months=1.0)
    p0, p_true = m.base_win_prob, m.win_prob(m.donation)
    assert target_price(m) == pytest.approx(p0 + 0.5 * (p_true - p0))
    assert price_at(m, 0) == pytest.approx(p0)
    assert price_at(m, 200) == pytest.approx(target_price(m))


def test_frictionless_profit_is_price_gain_times_shares_minus_donation():
    m = MarginalProfitScenario(**FREE, hold_months=2.0, half_life_months=1.0)
    p0 = m.base_win_prob
    o = evaluate(m)
    expected = (m.capital / p0) * (price_at(m, 2.0) - p0) - m.donation
    assert o.profit == pytest.approx(expected)
    assert o.slippage == pytest.approx(0, abs=1e-3) and o.fees == 0 and o.carry == 0


def test_breakdown_adds_up_to_profit():
    o = evaluate(MarginalProfitScenario())
    assert o.gross_gain + o.slippage - o.fees - o.carry - o.donation == pytest.approx(o.profit)


def test_no_donation_no_belief_means_only_costs():
    base = MarginalProfitScenario()
    o = evaluate(replace(base, donation=0.0))
    assert o.market_price == pytest.approx(base.base_win_prob)
    assert o.profit < 0  # fees, carry and slippage with nothing to gain


def test_more_depth_or_lower_costs_never_hurt():
    m = MarginalProfitScenario(effect_size=0.08 / 1.79, donation=40e6, capital=500e6)
    assert evaluate(replace(m, depth_per_point=1e9)).profit > evaluate(m).profit
    assert evaluate(replace(m, fee_rate=0.0)).profit > evaluate(m).profit
    assert evaluate(replace(m, carry_rate=0.0)).profit > evaluate(m).profit


def test_slower_market_earns_less_at_a_fixed_hold():
    m = MarginalProfitScenario(effect_size=0.05, hold_months=2.0)
    assert evaluate(replace(m, half_life_months=0.25)).profit > evaluate(replace(m, half_life_months=4.0)).profit


def test_without_carry_waiting_never_hurts():
    m = MarginalProfitScenario(effect_size=0.05, carry_rate=0.0)
    profits = [evaluate(replace(m, hold_months=t)).profit for t in (0, 1, 3, 6, 12)]
    assert profits == sorted(profits)


# --- Cost mechanics, pinned to hand-computed numbers --------------------------------------------
# A position with no donation effect (k = 0) sits at p0 = 0.5, so every cost can be worked out by hand.
FLAT = dict(effect_size=0.0, donation=0.0, base_win_prob=0.5)


def test_entry_and_exit_price_impact_hand_computed():
    # depth $100M per point, Q = $50M: buying moves the price 0.5 pts, so the average fill is 0.25 pts up.
    m = MarginalProfitScenario(**FLAT, capital=50e6, depth_per_point=100e6, fee_rate=0.0, carry_rate=0.0)
    o = evaluate(m)
    assert o.entry_price == pytest.approx(0.5025)
    # shares = 50e6 / 0.5025; selling them at 0.5 moves the price shares*0.5/(100e6*100) = 0.004975,
    # so the average fill is half of that below the quote.
    assert o.exit_price == pytest.approx(0.4975124, abs=1e-7)
    assert o.profit == pytest.approx(o.shares * o.exit_price - 50e6)  # no fees, carry or donation
    assert o.slippage == pytest.approx(o.profit)  # all of the loss is slippage


def test_fees_are_paid_on_both_the_buy_and_the_sell():
    # No move and no impact: shares are bought and sold at 0.5, so proceeds == Q and fees == 2% of Q.
    m = MarginalProfitScenario(**FLAT, capital=100e6, depth_per_point=1e18, fee_rate=0.01, carry_rate=0.0)
    o = evaluate(m)
    assert o.fees == pytest.approx(2e6)
    assert o.profit == pytest.approx(-2e6)


def test_carry_is_annual_rate_times_months_over_twelve():
    m = MarginalProfitScenario(**FLAT, capital=120e6, depth_per_point=1e18, fee_rate=0.0, carry_rate=0.05, hold_months=6.0)
    o = evaluate(m)
    assert o.carry == pytest.approx(3e6)  # 120M * 5% * 6/12
    assert o.profit == pytest.approx(-3e6)


def test_slippage_grows_with_the_square_of_the_order_size():
    def slip(q):
        return -evaluate(MarginalProfitScenario(**FLAT, capital=q, depth_per_point=1e9, fee_rate=0.0, carry_rate=0.0)).slippage

    ratio = slip(200e6) / slip(100e6)
    assert 3.8 < ratio < 4.2  # linear impact: doubling the order roughly quadruples the cost
