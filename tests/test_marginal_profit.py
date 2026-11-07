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
