import math
from dataclasses import replace

import pytest

from donor_economics import MarginalProfitScenario
from donor_economics.marginal_profit import (
    break_even_capital,
    break_even_capture,
    evaluate,
    first_dollar_return,
    price_after,
    return_per_dollar,
)

# 8-point boost from $50M, $40M donation, $500M of YES, $100M win payoff, price captures all of the boost.
STRONG = MarginalProfitScenario(effect_size=0.08 / math.log1p(5), donation=40e6, capital=500e6)
LIFT_DEFAULT = 0.015 * math.log(2)  # default k = 0.015, D = s = $10M


def test_price_after_is_the_captured_share_of_the_true_boost():
    m = MarginalProfitScenario(capture=0.5)
    p0, p_true = m.base_win_prob, m.win_prob(m.donation)
    assert price_after(m) == pytest.approx(p0 + 0.5 * (p_true - p0))
    assert price_after(replace(m, capture=0.0)) == pytest.approx(p0)  # the market ignores the donation
    assert price_after(replace(m, capture=1.0)) == pytest.approx(p_true)
    assert price_after(replace(m, capture=2.0)) == pytest.approx(p0 + 2 * (p_true - p0))  # over-reaction


def test_default_scenario_hand_computed():
    o = evaluate(MarginalProfitScenario())
    assert o.shares == pytest.approx(200e6)  # $100M at 50 cents
    assert o.price_after == pytest.approx(0.5 + LIFT_DEFAULT)
    assert o.trade_profit == pytest.approx(200e6 * LIFT_DEFAULT)
    assert o.trade_profit == pytest.approx(2.0794e6, rel=1e-4)
    assert o.payoff_lose == pytest.approx(-10e6 + o.trade_profit)  # about -$7.92M
    assert o.payoff_win == pytest.approx(100e6 - 10e6 + o.trade_profit)  # about +$92.08M
    assert o.win_value == pytest.approx(100e6 * LIFT_DEFAULT)
    assert o.ev == pytest.approx(o.profit + o.win_value)
    assert o.ev == pytest.approx(-6.8809e6, rel=1e-4)


def test_the_trade_adds_the_same_amount_to_both_outcomes():
    o = evaluate(STRONG)
    assert o.payoff_win - o.payoff_win_no_trade == pytest.approx(o.trade_profit)
    assert o.payoff_lose - o.payoff_lose_no_trade == pytest.approx(o.trade_profit)
    # so it cannot remove the election risk: the gap between winning and losing is still V
    assert o.payoff_win - o.payoff_lose == pytest.approx(STRONG.payoff_if_win)
    assert o.payoff_win_no_trade - o.payoff_lose_no_trade == pytest.approx(STRONG.payoff_if_win)
    assert o.profit == pytest.approx(o.payoff_lose)  # the trade net of the donation is the losing case


def test_expected_gain_is_the_probability_weighted_payoff_minus_doing_nothing():
    o = evaluate(STRONG)
    p, p0 = o.true_prob, STRONG.base_win_prob
    assert o.ev == pytest.approx(p * o.payoff_win + (1 - p) * o.payoff_lose - p0 * STRONG.payoff_if_win)


def test_with_no_win_payoff_it_is_a_pure_trade():
    o = evaluate(replace(STRONG, payoff_if_win=0.0))
    assert o.payoff_win == pytest.approx(o.payoff_lose)
    assert o.win_value == 0
    assert o.ev == pytest.approx(o.profit)


def test_doing_nothing_earns_exactly_zero():
    # no donation, no price move, and no frictions: nothing is earned or lost
    for m in (replace(STRONG, donation=0.0), replace(STRONG, donation=0.0, capital=0.0)):
        o = evaluate(m)
        assert o.profit == pytest.approx(0) and o.ev == pytest.approx(0) and o.trade_profit == pytest.approx(0)


def test_the_worst_case_is_the_donation_itself():
    # the price can never move against you in this model, and there are no fees, so the trade cannot lose
    for capture in (0.0, 0.25, 1.0, 2.0):
        for capital in (0.0, 100e6, 1e9):
            o = evaluate(replace(STRONG, capture=capture, capital=capital))
            assert o.payoff_lose >= -STRONG.donation - 1e-6
    assert evaluate(replace(STRONG, capture=0.0)).payoff_lose == pytest.approx(-40e6)


def test_profit_is_linear_in_position_size():
    gain = lambda q: evaluate(replace(STRONG, capital=q)).trade_profit  # noqa: E731
    assert gain(200e6) == pytest.approx(2 * gain(100e6))
    assert gain(1e9) == pytest.approx(10 * gain(100e6))
    # no price impact: there is no size at which the return per dollar falls
    assert return_per_dollar(replace(STRONG, capital=1e9)) == pytest.approx(return_per_dollar(STRONG))


def test_more_capture_earns_more():
    profits = [evaluate(replace(STRONG, capture=c)).profit for c in (0.0, 0.4, 1.0, 2.0)]
    assert profits == sorted(profits) and len(set(profits)) == 4


def test_break_even_capital_is_where_the_trade_covers_the_donation():
    q = break_even_capital(STRONG)
    assert q == pytest.approx(STRONG.donation / return_per_dollar(STRONG))
    at = evaluate(replace(STRONG, capital=q))
    assert at.trade_profit == pytest.approx(STRONG.donation) and at.payoff_lose == pytest.approx(0, abs=1e-3)
    assert evaluate(replace(STRONG, capital=0.9 * q)).payoff_lose < 0 < evaluate(replace(STRONG, capital=1.1 * q)).payoff_lose
    assert break_even_capital(replace(STRONG, capture=0.0)) is None  # the price never rises


def test_break_even_capture_is_where_the_trade_covers_the_donation():
    m = replace(STRONG, capital=250e6)
    c = break_even_capture(m)
    assert evaluate(replace(m, capture=c)).payoff_lose == pytest.approx(0, abs=1e-3)
    assert evaluate(replace(m, capture=0.9 * c)).payoff_lose < 0 < evaluate(replace(m, capture=1.1 * c)).payoff_lose


def test_break_even_capture_edge_cases():
    assert break_even_capture(replace(STRONG, donation=0.0)) == 0.0  # nothing to earn back
    assert break_even_capture(replace(STRONG, capital=0.0)) is None  # nothing spent on YES
    assert break_even_capture(replace(STRONG, effect_size=0.0)) is None  # no boost to capture
    assert break_even_capture(MarginalProfitScenario()) > 1  # even a full catch-up would not cover the donation


@pytest.mark.parametrize("form", ["log", "linear", "saturating"])
def test_first_dollar_return_is_the_slope_of_expected_gain_at_zero_donation(form):
    m = MarginalProfitScenario(effect_form=form, effect_size=0.02, capital=300e6, capture=0.8, payoff_if_win=250e6)
    slope = evaluate(replace(m, donation=1.0)).ev - evaluate(replace(m, donation=0.0)).ev
    assert first_dollar_return(m) - 1 == pytest.approx(slope, rel=1e-3)
    # both parts count: the win payoff and the trade
    assert first_dollar_return(m) > first_dollar_return(replace(m, payoff_if_win=0.0)) > 0
    assert first_dollar_return(m) > first_dollar_return(replace(m, capital=0.0)) > 0
