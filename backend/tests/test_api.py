import pytest
from fastapi.testclient import TestClient

from app.main import app
from donor_economics import Scenario, optimal_donation

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


def test_full_hedge_reports_a_positive_optimal_donation_when_one_exists():
    # V * k / s = 7.5 > 1: the first donated dollar pays, so the best donation is not zero.
    j = c.post("/api/full-hedge/analysis", json={"scenario": {"payoff_if_win": 5e9}, "donation": 50e6}).json()
    s = Scenario(payoff_if_win=5e9)
    assert j["strategy"]["optimal_donation"] > 0
    assert j["strategy"]["optimal_donation"] == pytest.approx(optimal_donation(s, 1e9, 2001))
    assert j["strategy"]["optimal_donation_ev"] > 0


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
