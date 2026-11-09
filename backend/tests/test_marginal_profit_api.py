"""Marginal profit API: checked against the model and against hand-worked numbers, not just for shape."""

import math
from dataclasses import replace

import pytest
from fastapi.testclient import TestClient

from app.main import app
from donor_economics import MarginalProfitScenario
from donor_economics.marginal_profit import evaluate

c = TestClient(app)
URL = "/api/marginal-profit/analysis"
LN6 = math.log1p(5)  # effect size = boost / LN6 gives that boost from $50M with s = $10M
LIFT = 0.015 * math.log(2)  # default k = 0.015, D = s = $10M


def post(**body):
    r = c.post(URL, json=body)
    assert r.status_code == 200, r.text
    return r.json()


def model(**body) -> MarginalProfitScenario:
    return replace(MarginalProfitScenario(), **body)


def test_default_scenario_hand_computed():
    j = post()
    o, st = j["outcome"], j["strategy"]
    assert o["price_after"] == pytest.approx(0.5 + LIFT)
    assert o["shares"] == pytest.approx(200e6)  # $100M at 50 cents
    assert o["trade_profit"] == pytest.approx(200e6 * LIFT)
    assert o["payoff_lose"] == pytest.approx(-10e6 + 200e6 * LIFT)
    assert o["payoff_win"] == pytest.approx(100e6 - 10e6 + 200e6 * LIFT)
    assert o["payoff_win_no_trade"] == pytest.approx(90e6) and o["payoff_lose_no_trade"] == pytest.approx(-10e6)
    assert o["ev"] == pytest.approx(-6.8809e6, rel=1e-4)
    assert st["needed_move"] == pytest.approx(0.05)  # $10M / 200M contracts
    assert st["profitable"] is False
    # the price move is what happened by the sale; the true move is where the probability went
    assert st["price_move"] == pytest.approx(o["price_after"] - 0.5)
    assert st["true_move"] == pytest.approx(o["true_prob"] - 0.5)
    # no donation pays here, so the best donation is exactly doing nothing
    assert st["optimal_donation"] == 0 and st["optimal_donation_ev"] == 0


def test_price_move_follows_capture_and_true_move_does_not():
    # at 100% capture the two are equal, so the default scenario cannot tell them apart: use 50%
    j = post(capture=0.5)
    st, o = j["strategy"], j["outcome"]
    assert st["true_move"] == pytest.approx(LIFT)  # the donation's real effect, whatever the market does
    assert st["price_move"] == pytest.approx(0.5 * LIFT)  # the price captures half
    assert st["price_move"] == pytest.approx(o["price_after"] - 0.5)
    assert st["true_move"] == pytest.approx(o["true_prob"] - 0.5)


def test_roi_is_profit_over_the_money_deployed():
    o = post(effect_size=0.08 / LN6, donation=40e6, capital=500e6)["outcome"]
    assert o["roi"] == pytest.approx(o["profit"] / 540e6)  # $500M of YES plus the $40M donation
    assert o["roi"] == pytest.approx(31.86e6 / 540e6, rel=1e-3)
    assert post(capital=0, donation=0)["outcome"]["roi"] == 0  # nothing deployed


def test_response_has_no_time_or_friction_fields():
    j = post()
    assert not {"fees", "carry", "slippage", "entry_price", "exit_price", "market_price", "target_price"} & set(j["outcome"])
    assert not {"depth_per_point", "fee_rate", "carry_rate", "hold_months", "half_life_months", "belief"} & set(j["scenario"])
    assert "months" not in j["curves"] and "time" not in j["sweeps"]
    assert set(j["scenario"]) >= {"payoff_if_win", "capture", "donation", "capital"}


def test_the_trade_adds_the_same_amount_to_both_outcomes():
    o = post(effect_size=0.08 / LN6, donation=40e6, capital=500e6)["outcome"]
    assert o["payoff_win"] - o["payoff_win_no_trade"] == pytest.approx(o["trade_profit"])
    assert o["payoff_lose"] - o["payoff_lose_no_trade"] == pytest.approx(o["trade_profit"])
    assert o["payoff_win"] - o["payoff_lose"] == pytest.approx(100e6)  # the win payoff: election risk is untouched
    assert o["profit"] == pytest.approx(o["payoff_lose"])


def test_zero_capital_does_not_break_the_response():
    # the trade-size slider can sit at $0: break-even figures are undefined, and must serialise as null
    j = post(capital=0)
    assert j["outcome"]["payoff_lose"] == pytest.approx(-10e6)
    assert j["strategy"]["needed_move"] is None
    assert j["strategy"]["break_even_capture"] is None


def test_no_donation_means_nothing_to_earn_back():
    j = post(donation=0)
    assert j["outcome"]["profit"] == pytest.approx(0) and j["outcome"]["ev"] == pytest.approx(0)
    assert j["strategy"]["break_even_capture"] == 0


@pytest.mark.parametrize(
    "name, body, lose, win, ev",
    [  # (approximately) the numbers quoted in the UI's scenario blurbs, in $M
        ("literature", dict(effect_size=0.027 / LN6), (-8.0, -7.8), (91.9, 92.3), (-7.0, -6.7)),
        ("huge", dict(effect_size=0.027 / LN6, capital=1e9), (10.7, 11.1), (110.7, 111.1), (11.7, 12.2)),
        ("strong", dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6), (31.5, 32.2), (131.5, 132.2), (38.7, 39.4)),
        ("stakes", dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6, payoff_if_win=1e9), (31.5, 32.2), (1031.5, 1032.2), (103.4, 104.0)),
        ("ignores", dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6, payoff_if_win=1e9, capture=0), (-40.0, -40.0), (960.0, 960.0), (31.5, 32.2)),
        ("half", dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6, payoff_if_win=1e9, capture=0.5), (-4.3, -3.9), (995.7, 996.1), (67.5, 68.1)),
        ("overreact", dict(effect_size=0.05 / LN6, donation=30e6, capital=500e6, payoff_if_win=1e9, capture=2), (47.1, 47.7), (1047.1, 1047.7), (85.8, 86.4)),
    ],
)
def test_preset_figures_match_the_ui_blurbs(name, body, lose, win, ev):
    o = post(**body)["outcome"]
    for got, (low, high) in ((o["payoff_lose"], lose), (o["payoff_win"], win), (o["ev"], ev)):
        assert low <= got / 1e6 <= high, (name, got / 1e6)


def test_three_market_responses_side_by_side():
    body = dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6, payoff_if_win=1e9, capture=1.7)  # capture is ignored here
    j = post(**body)
    rs = j["responses"]
    assert [r["capture"] for r in rs] == [0.0, 0.5, 1.0]
    assert [r["label"] for r in rs] == ["Ignores the donation", "Prices half of it", "Prices all of it"]
    for r in rs:
        o = evaluate(replace(model(**body), capture=r["capture"]))
        assert r["trade_profit"] == pytest.approx(o.trade_profit)
        assert r["payoff_lose"] == pytest.approx(o.payoff_lose) and r["payoff_win"] == pytest.approx(o.payoff_win)
        assert r["ev"] == pytest.approx(o.ev)
    assert rs[0]["trade_profit"] == 0 and rs[0]["payoff_lose"] == pytest.approx(-40e6)  # worst case: the donation
    assert rs[1]["trade_profit"] == pytest.approx(rs[2]["trade_profit"] / 2)


def test_break_even_capital_and_capture():
    body = dict(effect_size=0.08 / LN6, donation=40e6)
    j = post(**body)
    q = j["strategy"]["break_even_capital"]
    assert q == pytest.approx(278.3e6, rel=2e-3)  # the figure the UI shows for the strong scenario
    assert post(**body, capital=q)["outcome"]["payoff_lose"] == pytest.approx(0, abs=1e3)
    assert j["strategy"]["return_per_dollar"] == pytest.approx(j["outcome"]["trade_profit"] / 100e6)
    assert j["strategy"]["break_even_capture"] == pytest.approx(2.78, abs=0.01)  # $100M of YES needs a big over-reaction
    big = dict(body, capital=500e6)  # with $500M of YES the price only has to capture about 56% of the boost
    cap = post(**big)["strategy"]["break_even_capture"]
    assert cap == pytest.approx(0.56, abs=0.01)
    assert post(**big, capture=cap)["outcome"]["payoff_lose"] == pytest.approx(0, abs=1e3)
    assert post(**big, capture=0.9 * cap)["outcome"]["payoff_lose"] < 0 < post(**big, capture=1.1 * cap)["outcome"]["payoff_lose"]
    assert post(effect_size=0.08 / LN6, donation=40e6, capture=0)["strategy"]["break_even_capital"] is None


def test_first_dollar_return_is_the_slope_of_expected_gain_at_zero_donation():
    for form in ("log", "linear", "saturating"):
        body = dict(effect_form=form, effect_size=0.02, capital=300e6, capture=0.8, payoff_if_win=250e6)
        slope = post(**body, donation=1)["outcome"]["ev"] - post(**body, donation=0)["outcome"]["ev"]
        assert post(**body)["strategy"]["first_dollar_return"] - 1 == pytest.approx(slope, rel=1e-3), form


def test_donation_only_pays_when_the_first_dollar_returns_more_than_a_dollar():
    weak = post()  # first dollar returns about $0.45
    assert weak["strategy"]["first_dollar_return"] < 1 and weak["strategy"]["optimal_donation"] == 0
    strong = post(effect_size=0.08 / LN6, capital=500e6)
    assert strong["strategy"]["first_dollar_return"] > 1
    assert 35e6 < strong["strategy"]["optimal_donation"] < 43e6  # about $39M
    assert strong["strategy"]["optimal_donation_ev"] > 0


def test_capital_curve_shifts_both_outcomes_equally_in_a_straight_line():
    body = dict(effect_size=0.08 / LN6, donation=40e6, payoff_if_win=300e6)
    cap = post(**body)["curves"]["capital"]
    xs, win, lose = cap["capital"], cap["payoff_win"], cap["payoff_lose"]
    assert lose[0] == pytest.approx(-40e6) and win[0] == pytest.approx(260e6)  # nothing spent on YES
    assert all(w - l == pytest.approx(300e6) for w, l in zip(win, lose))  # the gap is always V
    slopes = [(lose[i + 1] - lose[i]) / (xs[i + 1] - xs[i]) for i in range(len(xs) - 1)]
    assert max(slopes) == pytest.approx(min(slopes), rel=1e-9)  # a straight line: no price impact


def test_capture_curve_is_a_straight_line_from_the_donation():
    body = dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6)
    cp = post(**body)["curves"]["capture"]
    assert cp["capture"][0] == -1 and cp["capture"][-1] == 2
    assert cp["capture"][20] == pytest.approx(0)
    assert cp["profit"][20] == pytest.approx(-40e6)  # the market ignores it: only the donation is lost
    assert cp["profit"][0] < -40e6  # the price falls back: the trade loses money on top of the donation
    slopes = [(cp["profit"][i + 1] - cp["profit"][i]) / 0.05 for i in range(len(cp["profit"]) - 1)]
    assert max(slopes) == pytest.approx(min(slopes), rel=1e-9)
    m = model(**body)
    for k in (0, 10, 20, 40, 60):
        assert cp["ev"][k] == pytest.approx(evaluate(replace(m, capture=cp["capture"][k])).ev)


def test_donation_curve_and_best_donation_match_the_model():
    body = dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6)
    j = post(**body)
    m, d, st = model(**body), j["curves"]["donation"], j["strategy"]
    for k in (0, 30, 100):
        assert d["ev"][k] == pytest.approx(evaluate(replace(m, donation=d["donation"][k])).ev)
        assert d["profit"][k] == pytest.approx(evaluate(replace(m, donation=d["donation"][k])).profit)
    assert st["optimal_donation_ev"] == pytest.approx(evaluate(replace(m, donation=st["optimal_donation"])).ev)
    assert st["optimal_donation_ev"] >= max(d["ev"]) - 1e-6


def test_heatmap_cells_match_the_model_at_their_axis_values():
    body = dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6)
    m = model(**body)
    s = post(**body)["sweeps"]["size"]
    for r, col in [(3, 7), (15, 2), (20, 20)]:  # rows are capital, columns are donation
        assert s["ev"][r][col] == pytest.approx(evaluate(replace(m, donation=s["donation"][col], capital=s["capital"][r])).ev)


def test_validation():
    assert c.post(URL, json={"capture": 5}).status_code == 422
    assert c.post(URL, json={"payoff_if_win": -1}).status_code == 422
    assert c.post(URL, json={"base_win_prob": 1.5}).status_code == 422
    assert c.post(URL, json={"capital": -1}).status_code == 422


def test_a_falling_price_makes_the_cushion_lose_money():
    j = post(effect_size=0.08 / LN6, donation=40e6, capital=500e6, capture=-0.5)
    assert j["outcome"]["trade_profit"] < 0
    assert j["outcome"]["payoff_lose"] < -40e6
    assert c.post(URL, json={"capture": -1.5}).status_code == 422
