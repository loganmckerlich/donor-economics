from typing import Literal

from pydantic import BaseModel, Field

from donor_economics import MarginalScenario, Scenario


class ScenarioIn(BaseModel):
    payoff_if_win: float = Field(100e6, gt=0, le=1e12)
    base_win_prob: float = Field(0.50, gt=0, lt=0.99)
    effect_size: float = Field(0.015, ge=0, le=1)
    effect_scale: float = Field(10e6, gt=0, le=1e11)
    effect_form: Literal["log", "linear", "saturating"] = "log"
    risk_aversion: float = Field(0.0, ge=0, le=1e-5)

    def to_model(self) -> Scenario:
        return Scenario(**self.model_dump())


class MarginalIn(BaseModel):
    """Marginal-profit strategy. Win-probability curve fields match ``ScenarioIn``."""

    base_win_prob: float = Field(0.50, gt=0, lt=0.99)
    effect_size: float = Field(0.015, ge=0, le=1)
    effect_scale: float = Field(10e6, gt=0, le=1e11)
    effect_form: Literal["log", "linear", "saturating"] = "log"
    donation: float = Field(10e6, ge=0, le=1e10)
    capital: float = Field(100e6, ge=0, le=1e10)  # $ spent buying YES
    hold_months: float = Field(3.0, ge=0, le=60)
    half_life_months: float = Field(1.0, ge=0, le=60)  # 0 = the market reprices instantly
    belief: float = Field(1.0, ge=0, le=3)  # share of the true boost the market ends up pricing
    depth_per_point: float = Field(200e6, gt=0, le=1e12)  # $ of orders that move the price 1 point
    fee_rate: float = Field(0.01, ge=0, le=0.2)  # per side
    carry_rate: float = Field(0.05, ge=0, le=1)  # annual

    def to_model(self) -> MarginalScenario:
        d = self.model_dump()
        base = Scenario(**{k: d.pop(k) for k in ("base_win_prob", "effect_size", "effect_scale", "effect_form")})
        return MarginalScenario(base=base, **d)


class AnalysisIn(BaseModel):
    scenario: ScenarioIn = ScenarioIn()
    donation: float = Field(50e6, ge=0, le=1e11)
    hedge: float | None = Field(25e6, ge=0, le=1e12)  # null = use the full hedge
    # Hedge as a fraction of the full (zero-variance) hedge; takes precedence over `hedge` when set.
    hedge_fraction: float | None = Field(None, ge=0, le=5)


class DonationHeatmapIn(BaseModel):
    scenario: ScenarioIn = ScenarioIn()
    effect_size_range: tuple[float, float] = (0.0, 0.1)
    payoff_range: tuple[float, float] = (20e6, 10e9)  # log-spaced
    n: int = Field(25, ge=5, le=60)


class HedgeValueIn(BaseModel):
    scenario: ScenarioIn = ScenarioIn()
    risk_aversion_range: tuple[float, float] = (1e-11, 1e-7)  # log-spaced
    donation_range: tuple[float, float] = (0.0, 150e6)
    n: int = Field(25, ge=5, le=60)
