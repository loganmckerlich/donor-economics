import math
from dataclasses import replace

import pytest

from donor_economics import MarginalProfitScenario
from donor_economics.marginal_profit import (
    break_even_capital,
    break_even_months,
    catch_up,
    evaluate,
    first_dollar_return,
    price_at,
    return_per_dollar,
    target_price,
)

STRONG = MarginalProfitScenario(effect_size=0.08 / math.log1p(5), donation=40e6, capital=500e6, hold_months=3.0)


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


def test_profit_is_price_gain_on_the_shares_minus_the_donation():
    m = MarginalProfitScenario(hold_months=2.0, half_life_months=1.0)
    p0 = m.base_win_prob
    o = evaluate(m)
    assert o.shares == pytest.approx(m.capital / p0)
    assert o.price_gain == pytest.approx((m.capital / p0) * (price_at(m, 2.0) - p0))
    assert o.profit == pytest.approx(o.price_gain - m.donation)
    assert o.roi == pytest.approx(o.profit / (m.capital + m.donation))


def test_default_scenario_hand_computed():
    # k = 0.015, D = s = $10M: lift = 0.015 * ln 2 = 0.010397; 87.5% caught up after 3 months at a 1-month half-life.
    o = evaluate(MarginalProfitScenario())
    move = 0.875 * 0.015 * math.log(2)
    assert o.market_price == pytest.approx(0.5 + move)
    assert o.price_gain == pytest.approx(200e6 * move)  # 200M contracts bought at 50 cents
    assert o.profit == pytest.approx(200e6 * move - 10e6)
    assert o.profit == pytest.approx(-8.1805e6, rel=1e-4)


def test_doing_nothing_earns_exactly_zero():
    # no donation, no price move, and no frictions: nothing is earned or lost
    assert evaluate(replace(STRONG, donation=0.0)).profit == pytest.approx(0)
    assert evaluate(replace(STRONG, capital=0.0, donation=0.0)).profit == 0


def test_profit_is_linear_in_position_size():
    gain = lambda q: evaluate(replace(STRONG, capital=q)).price_gain  # noqa: E731
    assert gain(200e6) == pytest.approx(2 * gain(100e6))
    assert gain(1e9) == pytest.approx(10 * gain(100e6))
    # no price impact: there is no size at which the return per dollar falls
    assert return_per_dollar(replace(STRONG, capital=1e9)) == pytest.approx(return_per_dollar(STRONG))


def test_slower_market_earns_less_at_a_fixed_hold():
    m = replace(STRONG, hold_months=2.0)
    assert evaluate(replace(m, half_life_months=0.25)).profit > evaluate(replace(m, half_life_months=4.0)).profit


def test_waiting_never_hurts_because_it_costs_nothing():
    profits = [evaluate(replace(STRONG, hold_months=t)).profit for t in (0, 1, 3, 6, 12)]
    assert profits == sorted(profits)


def test_lower_belief_earns_less():
    assert evaluate(replace(STRONG, belief=0.4)).profit < evaluate(STRONG).profit < evaluate(replace(STRONG, belief=2.0)).profit


def test_break_even_capital_is_where_profit_is_zero():
    q = break_even_capital(STRONG)
    assert q == pytest.approx(STRONG.donation / return_per_dollar(STRONG))
    assert evaluate(replace(STRONG, capital=q)).profit == pytest.approx(0, abs=1e-3)
    assert break_even_capital(replace(STRONG, donation=0.0)) is None  # the price never rises


def test_break_even_months_is_where_profit_is_zero():
    m = replace(STRONG, donation=40e6, half_life_months=4.0)
    t = break_even_months(m)
    assert t == pytest.approx(4.69, abs=0.01)
    assert evaluate(replace(m, hold_months=t)).profit == pytest.approx(0, abs=1e-3)


def test_break_even_months_edge_cases():
    assert break_even_months(replace(STRONG, donation=0.0)) == 0.0  # nothing to earn back
    assert break_even_months(replace(STRONG, capital=0.0)) is None  # nothing spent on YES
    assert break_even_months(MarginalProfitScenario()) is None  # even a full catch-up gains less than the donation
    assert break_even_months(replace(STRONG, half_life_months=0.0)) == 0.0  # instant market, profitable at once
    assert break_even_months(replace(STRONG, belief=0.0)) is None  # the price never moves


@pytest.mark.parametrize("form", ["log", "linear", "saturating"])
def test_first_dollar_return_is_the_slope_of_profit_at_zero_donation(form):
    m = MarginalProfitScenario(effect_form=form, effect_size=0.02, capital=300e6, belief=0.8, hold_months=2.0)
    slope = evaluate(replace(m, donation=1.0)).profit - evaluate(replace(m, donation=0.0)).profit
    assert first_dollar_return(m) - 1 == pytest.approx(slope, rel=1e-3)
