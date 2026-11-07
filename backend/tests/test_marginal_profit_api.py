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


def post(**body):
    r = c.post(URL, json=body)
    assert r.status_code == 200, r.text
    return r.json()


def model(**body) -> MarginalProfitScenario:
    return replace(MarginalProfitScenario(), **body)


def test_default_scenario_hand_computed():
    j = post()
    o, st = j["outcome"], j["strategy"]
    # k = 0.015, D = $10M, s = $10M: lift = 0.015 * ln 2 = 1.0397 pts; 87.5% caught up after 3 months at a 1-month half-life.
    assert o["target_price"] == pytest.approx(0.5 + 0.015 * math.log(2))
    assert o["market_price"] == pytest.approx(0.5 + 0.875 * 0.015 * math.log(2))
    assert o["shares"] == pytest.approx(200e6)  # $100M at 50 cents
    assert o["price_gain"] == pytest.approx(1.8195e6, rel=1e-3)
    assert o["profit"] == pytest.approx(o["price_gain"] - 10e6)
    assert st["needed_move"] == pytest.approx(0.05)  # $10M / 200M contracts
    assert st["profitable"] is False
    # the price move is what has happened by the sale, not where the price is heading
    assert st["price_move"] == pytest.approx(o["market_price"] - 0.5)
    assert st["true_move"] == pytest.approx(o["true_prob"] - 0.5)
    assert st["price_move"] == pytest.approx(0.875 * st["true_move"])
    assert st["price_move"] < st["true_move"]
    # no donation pays here, so the best donation is exactly doing nothing
    assert st["optimal_donation"] == 0 and st["optimal_donation_profit"] == 0


def test_response_has_no_friction_fields():
    j = post()
    assert set(j["outcome"]) == {"market_price", "target_price", "true_prob", "shares", "price_gain", "donation", "profit", "roi"}
    assert not {"fees", "carry", "slippage", "entry_price", "exit_price"} & set(j["outcome"])
    assert not {"depth_per_point", "fee_rate", "carry_rate"} & set(j["scenario"])


def test_zero_capital_does_not_break_the_response():
    # the trade-size slider can sit at $0: break-even figures are undefined, and must serialise as null
    j = post(capital=0)
    assert j["outcome"]["profit"] == pytest.approx(-10e6)
    assert j["strategy"]["needed_move"] is None
    assert j["strategy"]["break_even_months"] is None


def test_no_donation_means_zero_profit_and_nothing_to_earn_back():
    j = post(donation=0)
    assert j["outcome"]["profit"] == pytest.approx(0)
    assert j["strategy"]["break_even_months"] == 0
    assert j["strategy"]["optimal_donation"] == 0 and j["strategy"]["optimal_donation_profit"] == 0


@pytest.mark.parametrize(
    "name, body, low, high",
    [  # the numbers quoted in the UI's scenario blurbs
        ("literature", dict(effect_size=0.027 / LN6), -8.5e6, -7.8e6),
        ("huge position", dict(effect_size=0.027 / LN6, capital=1e9), 8e6, 8.6e6),
        ("strong", dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6), 22e6, 24e6),
        ("fast", dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6, hold_months=2, half_life_months=0.25), 31e6, 32.5e6),
        ("slow", dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6, hold_months=2, half_life_months=4), -20e6, -18e6),
        ("skeptic", dict(effect_size=0.08 / LN6, belief=0.4, donation=40e6, capital=500e6), -16e6, -14e6),
        ("overreact", dict(effect_size=0.05 / LN6, belief=2, donation=30e6, capital=500e6), 37e6, 38.5e6),
    ],
)
def test_preset_profits_match_the_ui_blurbs(name, body, low, high):
    j = post(**body)
    assert low < j["outcome"]["profit"] < high, name
    assert j["strategy"]["profitable"] is (j["outcome"]["profit"] > 0)


def test_break_even_times_quoted_in_the_blurbs():
    strong = dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6)
    assert post(**strong)["strategy"]["break_even_months"] == pytest.approx(1.17, abs=0.02)
    slow = post(**strong, hold_months=2, half_life_months=4)
    assert slow["strategy"]["break_even_months"] == pytest.approx(4.69, abs=0.02)
    # at exactly that hold time the profit is zero; it is negative before and positive after
    be = slow["strategy"]["break_even_months"]
    assert post(**strong, hold_months=be, half_life_months=4)["outcome"]["profit"] == pytest.approx(0, abs=1e3)
    assert post(**strong, hold_months=be - 1, half_life_months=4)["outcome"]["profit"] < 0
    assert post(**strong, hold_months=be + 1, half_life_months=4)["outcome"]["profit"] > 0
    assert post(effect_size=0.08 / LN6, belief=0.4, donation=40e6, capital=500e6)["strategy"]["break_even_months"] is None


def test_break_even_capital_is_where_profit_crosses_zero():
    body = dict(effect_size=0.08 / LN6, donation=40e6)
    j = post(**body)
    q = j["strategy"]["break_even_capital"]
    assert q == pytest.approx(318.1e6, rel=2e-3)  # the figure the UI shows for the strong scenario
    assert post(**body, capital=q)["outcome"]["profit"] == pytest.approx(0, abs=1e3)
    assert post(**body, capital=0.9 * q)["outcome"]["profit"] < 0 < post(**body, capital=1.1 * q)["outcome"]["profit"]
    assert j["strategy"]["return_per_dollar"] == pytest.approx(j["outcome"]["price_gain"] / 100e6)


def test_first_dollar_return_is_the_slope_of_profit_at_zero_donation():
    for form in ("log", "linear", "saturating"):
        j = post(effect_form=form, effect_size=0.02, capital=300e6, belief=0.8, hold_months=2)
        at_one = post(effect_form=form, effect_size=0.02, capital=300e6, belief=0.8, hold_months=2, donation=1)
        at_zero = post(effect_form=form, effect_size=0.02, capital=300e6, belief=0.8, hold_months=2, donation=0)
        slope = at_one["outcome"]["profit"] - at_zero["outcome"]["profit"]  # d profit / dD at D = 0
        assert j["strategy"]["first_dollar_return"] - 1 == pytest.approx(slope, rel=1e-3), form


def test_donation_only_pays_when_the_first_dollar_returns_more_than_a_dollar():
    weak = post()  # first dollar returns about $0.26
    assert weak["strategy"]["first_dollar_return"] < 1
    assert weak["strategy"]["optimal_donation"] == 0
    strong = post(effect_size=0.08 / LN6, capital=500e6)
    assert strong["strategy"]["first_dollar_return"] > 1
    assert strong["strategy"]["optimal_donation"] > 0
    assert strong["strategy"]["optimal_donation_profit"] > 0


def test_profit_is_linear_in_position_size_and_rises_with_hold_time():
    body = dict(effect_size=0.08 / LN6, donation=40e6)
    cap = post(**body)["curves"]["capital"]
    xs, ys = cap["capital"], cap["profit"]
    assert ys[0] == pytest.approx(-40e6)  # nothing spent on YES: only the donation is lost
    slopes = [(ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]) for i in range(len(xs) - 1)]
    assert max(slopes) == pytest.approx(min(slopes), rel=1e-9)  # a straight line: no price impact
    prof = post(**body)["curves"]["time"]["profit"]
    assert all(b >= a for a, b in zip(prof, prof[1:]))  # no cost of waiting, so it never falls


def test_curves_match_the_model_at_their_grid_points():
    body = dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6)
    j = post(**body)
    m = model(**body)
    t = j["curves"]["time"]
    for k in (0, 10, 24, 48):
        assert t["profit"][k] == pytest.approx(evaluate(replace(m, hold_months=t["months"][k])).profit)
    d = j["curves"]["donation"]
    for k in (0, 30, 100):
        assert d["profit"][k] == pytest.approx(evaluate(replace(m, donation=d["donation"][k])).profit)


def test_heatmap_cells_match_the_model_at_their_axis_values():
    body = dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6)
    m = model(**body)
    j = post(**body)["sweeps"]
    ds, qs, z = j["size"]["donation"], j["size"]["capital"], j["size"]["profit"]
    for r, col in [(3, 7), (15, 2), (20, 20)]:  # rows are capital, columns are donation
        assert z[r][col] == pytest.approx(evaluate(replace(m, donation=ds[col], capital=qs[r])).profit)
    hs, ls, zt = j["time"]["hold_months"], j["time"]["half_life_months"], j["time"]["profit"]
    for r, col in [(3, 7), (15, 2), (20, 20)]:  # rows are half-life, columns are hold time
        assert zt[r][col] == pytest.approx(evaluate(replace(m, hold_months=hs[col], half_life_months=ls[r])).profit)


def test_reported_best_donation_is_the_maximum_of_its_curve():
    body = dict(effect_size=0.08 / LN6, donation=40e6, capital=500e6)
    j = post(**body)
    st, curve = j["strategy"], j["curves"]["donation"]
    assert st["optimal_donation_profit"] == pytest.approx(evaluate(replace(model(**body), donation=st["optimal_donation"])).profit)
    assert st["optimal_donation_profit"] >= max(curve["profit"]) - 1e-6
    assert 25e6 < st["optimal_donation"] < 35e6  # about $29M for the strong scenario


def test_validation():
    assert c.post(URL, json={"belief": 5}).status_code == 422
    assert c.post(URL, json={"base_win_prob": 1.5}).status_code == 422
    assert c.post(URL, json={"capital": -1}).status_code == 422
