from fastapi.testclient import TestClient

from app.main import app

c = TestClient(app)


def test_defaults_and_health():
    assert c.get("/api/health").json() == {"status": "ok"}
    d = c.get("/api/defaults").json()
    assert d["donation"] == 50e6 and d["scenario"]["effect_form"] == "log"


def test_analysis_matches_closed_forms():
    r = c.post("/api/analysis", json={"scenario": {"risk_aversion": 4e-10}, "donation": 50e6, "hedge": 25e6})
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
    j = c.post("/api/analysis", json={"hedge": None}).json()
    assert abs(j["hedge"] - j["strategy"]["full_hedge_size"]) < 1


def test_validation_rejects_bad_input():
    assert c.post("/api/analysis", json={"scenario": {"base_win_prob": 1.5}}).status_code == 422


def test_heatmaps():
    j = c.post("/api/sweep/donation-heatmap", json={"n": 6}).json()
    assert len(j["optimal_donation"]) == 6 and len(j["optimal_donation"][0]) == 6
    assert j["optimal_donation"][0][0] == 0  # k = 0: donating never pays
    j = c.post("/api/sweep/hedge-value", json={"n": 6}).json()
    assert all(v >= -1 for row in j["ce_gain"] for v in row)  # hedging never hurts CE
