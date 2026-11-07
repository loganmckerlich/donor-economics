import math
from dataclasses import replace

import pytest
from fastapi.testclient import TestClient

from app.main import app
from donor_economics import MarginalProfitScenario, Scenario, optimal_donation
from donor_economics.marginal_profit import evaluate as mp_evaluate

c = TestClient(app)


def test_defaults_and_health():
    assert c.get("/api/health").json() == {"status": "ok"}
    d = c.get("/api/defaults").json()
    assert d["donation"] == 50e6 and d["scenario"]["effect_form"] == "log"


def test_analysis_matches_closed_forms():
    r = c.post("/api/full-hedge/analysis", json={"scenario": {"risk_aversion": 4e-10}, "donation": 50e6, "hedge": 25e6})
    assert r.status_code == 200
    j = r.json()
    full = j["fully_hedged"]
    assert abs(full["pnl_win"] - full["pnl_lose"]) < 1
    assert abs(j["strategy"]["locked_in_pnl"] - full["pnl_win"]) < 1
    assert j["strategy"]["optimal_donation"] == 0
    assert j["strategy"]["ce_gain_from_full_hedge"] > 0
    h = j["curves"]["hedge"]
    assert len(h["hedge"]) == len(h["ce_gain"]) == 121
    assert set(j["curves"]["win_prob"]) == {"donation", "log", "linear", "saturating"}


def test_null_hedge_means_full_hedge():
    j = c.post("/api/full-hedge/analysis", json={"hedge": None}).json()
    assert abs(j["hedge"] - j["strategy"]["full_hedge_size"]) < 1


def test_hedge_fraction_scales_the_full_hedge():
    j = c.post("/api/full-hedge/analysis", json={"hedge_fraction": 0.5}).json()
    assert abs(j["hedge"] - 0.5 * j["strategy"]["full_hedge_size"]) < 1
    j = c.post("/api/full-hedge/analysis", json={"hedge_fraction": 1.0, "hedge": 3e6}).json()  # fraction wins
    assert abs(j["hedge"] - j["strategy"]["full_hedge_size"]) < 1


def test_validation_rejects_bad_input():
    assert c.post("/api/full-hedge/analysis", json={"scenario": {"base_win_prob": 1.5}}).status_code == 422


def test_heatmaps():
    j = c.post("/api/full-hedge/sweep/donation-heatmap", json={"n": 6}).json()
    assert len(j["optimal_donation"]) == 6 and len(j["optimal_donation"][0]) == 6
    assert j["optimal_donation"][0][0] == 0  # k = 0: donating never pays
    j = c.post("/api/full-hedge/sweep/hedge-value", json={"n": 6}).json()
    assert all(v >= -1 for row in j["ce_gain"] for v in row)  # hedging never hurts CE


def test_marginal_analysis_shape_and_consistency():
    r = c.post("/api/marginal-profit/analysis", json={})
    assert r.status_code == 200
    j = r.json()
    o = j["outcome"]
    assert abs(o["gross_gain"] + o["slippage"] - o["fees"] - o["carry"] - o["donation"] - o["profit"]) < 1
    t = j["curves"]["time"]
    assert len(t["months"]) == len(t["market_price"]) == len(t["profit"]) == 49
    assert t["market_price"][0] == 0.5 and t["market_price"][-1] > t["market_price"][1]
    assert len(j["sweeps"]["time"]["profit"]) == len(j["sweeps"]["time"]["profit"][0]) == 21
    assert j["strategy"]["best_plan"]["profit"] >= 0  # doing nothing is always available


def test_marginal_best_plan_beats_doing_nothing_when_it_pays():
    big = {"effect_size": 0.045, "depth_per_point": 500e6, "fee_rate": 0.005}
    j = c.post("/api/marginal-profit/analysis", json=big).json()
    plan = j["strategy"]["best_plan"]
    assert plan["profit"] > 0 and plan["donation"] > 0 and plan["capital"] > 0
    again = c.post("/api/marginal-profit/analysis", json={**big, "donation": plan["donation"], "capital": plan["capital"], "hold_months": plan["hold_months"]}).json()
    assert abs(again["outcome"]["profit"] - plan["profit"]) < 1


def test_marginal_validation():
    assert c.post("/api/marginal-profit/analysis", json={"belief": 5}).status_code == 422
    assert c.post("/api/marginal-profit/analysis", json={"depth_per_point": 0}).status_code == 422


def test_knowledge_list_and_get():
    docs = c.get("/api/knowledge").json()
    slugs = [d["slug"] for d in docs]
    assert slugs[0] == "overview" and "01-hedging-and-risk" in slugs and len(slugs) == 8
    doc = c.get("/api/knowledge/01-hedging-and-risk").json()
    assert doc["title"].startswith("01") and "Implications for this project" in doc["markdown"]


def test_knowledge_unknown_and_traversal_rejected():
    assert c.get("/api/knowledge/nope").status_code == 404
    assert c.get("/api/knowledge/..%2Fpyproject").status_code == 404
    assert c.get("/api/knowledge/%2e%2e/README").status_code == 404


# --- Marginal profit: the API layer, checked against the model rather than for shape only -------

MP = "/api/marginal-profit/analysis"
K_8PT = 0.08 / math.log1p(5)  # effect size giving an 8-point boost from $50M with s = $10M
DEEP = dict(depth_per_point=500e6, fee_rate=0.005)


def _model(body: dict) -> MarginalProfitScenario:
    return replace(MarginalProfitScenario(), **body)


def test_breakeven_move_matches_the_costs_in_the_response():
    j = c.post(MP, json={}).json()
    o, p0 = j["outcome"], j["scenario"]["base_win_prob"]
    expected = (o["donation"] + o["fees"] + o["carry"] - o["slippage"]) / (j["scenario"]["capital"] / p0)
    assert j["strategy"]["needed_move"] == pytest.approx(expected)
    assert o["slippage"] <= 0  # slippage is a cost, so the break-even move exceeds the bare costs


def test_profitable_flag_and_best_plan_follow_the_profit():
    loss = c.post(MP, json={}).json()
    assert loss["outcome"]["profit"] < 0 and loss["strategy"]["profitable"] is False
    assert loss["strategy"]["best_plan"] == {"donation": 0.0, "capital": 0.0, "hold_months": 3.0, "profit": 0.0}
    win = c.post(MP, json={"effect_size": K_8PT, "donation": 60e6, "capital": 1e9, "hold_months": 4.5, **DEEP}).json()
    assert win["outcome"]["profit"] > 0 and win["strategy"]["profitable"] is True


@pytest.mark.parametrize(
    "name, body, low, high",
    [  # the numbers quoted in the UI's scenario blurbs
        ("deep", dict(effect_size=K_8PT, donation=60e6, capital=1e9, hold_months=4.5, **DEEP), 30e6, 33e6),
        ("fast", dict(effect_size=K_8PT, donation=40e6, capital=800e6, hold_months=2, half_life_months=0.25, **DEEP), 29e6, 33e6),
        ("slow", dict(effect_size=K_8PT, donation=40e6, capital=800e6, hold_months=2, half_life_months=4, **DEEP), -49e6, -45e6),
        ("skeptic", dict(effect_size=K_8PT, belief=0.4, donation=40e6, capital=800e6, hold_months=3, **DEEP), -46e6, -42e6),
        ("overreact", dict(effect_size=0.05 / math.log1p(5), belief=2, donation=30e6, capital=800e6, hold_months=3, **DEEP), 30e6, 33e6),
    ],
)
def test_preset_profits_match_the_ui_blurbs(name, body, low, high):
    assert low < c.post(MP, json=body).json()["outcome"]["profit"] < high, name


def test_before_costs_curve_adds_back_fees_and_carry():
    body = {"effect_size": K_8PT, **DEEP}
    t = c.post(MP, json=body).json()["curves"]["time"]
    for k in (0, 10, 24, 48):
        o = mp_evaluate(replace(_model(body), hold_months=t["months"][k]))
        assert t["profit"][k] == pytest.approx(o.profit)
        assert t["profit_before_costs"][k] == pytest.approx(o.profit + o.fees + o.carry)
    assert t["profit_before_costs"][-1] > t["profit"][-1]  # carry makes a long hold cost something


def test_heatmap_cells_match_the_model_at_their_axis_values():
    body = {"effect_size": K_8PT, **DEEP}
    m = _model(body)
    j = c.post(MP, json=body).json()["sweeps"]
    ds, qs, z = j["size"]["donation"], j["size"]["capital"], j["size"]["profit"]
    for r, col in [(3, 7), (15, 2), (20, 20)]:  # rows are capital, columns are donation
        assert z[r][col] == pytest.approx(mp_evaluate(replace(m, donation=ds[col], capital=qs[r])).profit)
    hs, ls, zt = j["time"]["hold_months"], j["time"]["half_life_months"], j["time"]["profit"]
    for r, col in [(3, 7), (15, 2), (20, 20)]:  # rows are half-life, columns are hold time
        assert zt[r][col] == pytest.approx(mp_evaluate(replace(m, hold_months=hs[col], half_life_months=ls[r])).profit)


def test_each_reported_optimum_is_the_maximum_of_its_curve():
    body = {"effect_size": K_8PT, "donation": 60e6, "capital": 500e6, **DEEP}
    m = _model(body)
    j = c.post(MP, json=body).json()
    st, cv = j["strategy"], j["curves"]
    assert st["optimal_hold_profit"] == pytest.approx(mp_evaluate(replace(m, hold_months=st["optimal_hold"])).profit)
    assert st["optimal_hold_profit"] >= max(cv["time"]["profit"]) - 1e-6
    assert st["optimal_donation_profit"] == pytest.approx(mp_evaluate(replace(m, donation=st["optimal_donation"])).profit)
    assert st["optimal_donation_profit"] >= max(cv["donation"]["profit"]) - 1e-6
    assert st["optimal_capital_profit"] == pytest.approx(mp_evaluate(replace(m, capital=st["optimal_capital"])).profit)
    assert st["optimal_capital_profit"] >= max(cv["capital"]["profit"]) - 1e-6


def test_full_hedge_reports_a_positive_optimal_donation_when_one_exists():
    # V * k / s = 7.5 > 1: the first donated dollar pays, so the best donation is not zero.
    j = c.post("/api/full-hedge/analysis", json={"scenario": {"payoff_if_win": 5e9}, "donation": 50e6}).json()
    s = Scenario(payoff_if_win=5e9)
    assert j["strategy"]["optimal_donation"] > 0
    assert j["strategy"]["optimal_donation"] == pytest.approx(optimal_donation(s, 1e9, 2001))
    assert j["strategy"]["optimal_donation_ev"] > 0
