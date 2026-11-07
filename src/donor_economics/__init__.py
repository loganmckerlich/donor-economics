"""Economics of a political donor using a prediction market.

Two strategies share the donation-effect curve in ``effect``:
  * ``full_hedge``: donate, then hedge the outcome.
  * ``marginal_profit``: buy YES, donate, and sell once the market has priced in the boost.
"""

from .full_hedge import (
    Outcome,
    Scenario,
    certainty_equivalent,
    donation_ev,
    evaluate,
    full_hedge_size,
    optimal_donation,
    optimal_hedge,
)
from .marginal_profit import MarginalProfitOutcome, MarginalProfitScenario

__all__ = [
    "MarginalProfitOutcome",
    "MarginalProfitScenario",
    "Outcome",
    "Scenario",
    "certainty_equivalent",
    "donation_ev",
    "evaluate",
    "full_hedge_size",
    "optimal_donation",
    "optimal_hedge",
]
