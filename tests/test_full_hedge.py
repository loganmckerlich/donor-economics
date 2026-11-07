import numpy as np
import pytest

from donor_economics import (
    Scenario,
    donation_ev,
    evaluate,
    full_hedge_size,
    optimal_donation,
    optimal_hedge,
)

D = 50e6


def test_hedge_is_fair_so_ev_is_independent_of_hedge_size():
    s = Scenario()
    evs = [evaluate(s, D, h).ev for h in (0, 10e6, 25e6, 80e6)]
    assert evs == pytest.approx([evs[0]] * 4, abs=1)


def test_full_hedge_closed_form_and_zero_variance():
    s = Scenario()
    h = full_hedge_size(s, D)
    assert h == pytest.approx(s.payoff_if_win * (1 - s.win_prob(D)))
    r = evaluate(s, D, h)
    assert r.pnl_win == pytest.approx(r.pnl_lose, abs=1)
    assert r.std == pytest.approx(0, abs=1)
    # Locked-in value is p(D) * V - D.
    assert r.pnl_win == pytest.approx(s.win_prob(D) * s.payoff_if_win - D, abs=1)


def test_partial_hedge_reduces_variance():
    s = Scenario()
    assert evaluate(s, D, 25e6).std < evaluate(s, D, 0).std


def test_risk_neutral_certainty_equivalent_is_ev():
    s = Scenario(risk_aversion=0.0)
    r = evaluate(s, D, 25e6)
    assert r.certainty_equivalent == pytest.approx(r.ev)


def test_risk_averse_prefers_full_hedge_over_grid():
    s = Scenario(risk_aversion=1e-8)
    hs = np.linspace(0, 150e6, 301)
    best = max(hs, key=lambda h: evaluate(s, D, h).certainty_equivalent)
    assert best == pytest.approx(optimal_hedge(s, D), abs=1e6)


def test_risk_averse_ce_below_ev_and_hedging_raises_it():
    s = Scenario(risk_aversion=1e-8)
    unhedged = evaluate(s, D, 0)
    assert unhedged.certainty_equivalent < unhedged.ev
    assert evaluate(s, D, 25e6).certainty_equivalent > unhedged.certainty_equivalent


@pytest.mark.parametrize("form", ["log", "linear", "saturating"])
def test_win_prob_monotone_and_bounded(form):
    s = Scenario(effect_form=form)
    ps = [s.win_prob(d) for d in (0, 1e6, 10e6, 100e6, 1e9)]
    assert ps == sorted(ps) and ps[0] == s.base_win_prob and ps[-1] < 1


def test_log_is_concave():
    s = Scenario()
    first = s.win_prob(10e6) - s.win_prob(0)
    second = s.win_prob(20e6) - s.win_prob(10e6)
    assert second < first


def test_optimal_donation_matches_first_order_condition():
    # log form: V * k / (s + D) = 1  =>  D* = V*k - s
    s = Scenario(effect_size=0.30, effect_scale=10e6, base_win_prob=0.2)
    assert optimal_donation(s) == pytest.approx(s.payoff_if_win * 0.30 - 10e6, abs=1e5)
    assert donation_ev(s, optimal_donation(s)) > 0


def test_literature_sized_effect_makes_donation_negative_ev():
    s = Scenario()  # k = 0.015
    assert donation_ev(s, D) < 0
    assert optimal_donation(s) == 0
