from typing import Literal

from pydantic import BaseModel, Field

from donor_economics import Scenario


class ScenarioIn(BaseModel):
    payoff_if_win: float = Field(100e6, gt=0, le=1e12)
    base_win_prob: float = Field(0.45, gt=0, lt=0.99)
    effect_size: float = Field(0.015, ge=0, le=1)
    effect_scale: float = Field(10e6, gt=0, le=1e11)
    effect_form: Literal["log", "linear", "saturating"] = "log"
    risk_aversion: float = Field(0.0, ge=0, le=1e-5)

    def to_model(self) -> Scenario:
        return Scenario(**self.model_dump())


class AnalysisIn(BaseModel):
    scenario: ScenarioIn = ScenarioIn()
    donation: float = Field(50e6, ge=0, le=1e11)
    hedge: float | None = Field(25e6, ge=0, le=1e12)  # null = use the full hedge


class DonationHeatmapIn(BaseModel):
    scenario: ScenarioIn = ScenarioIn()
    effect_size_range: tuple[float, float] = (0.0, 0.1)
    payoff_range: tuple[float, float] = (20e6, 500e6)
    n: int = Field(25, ge=5, le=60)


class HedgeValueIn(BaseModel):
    scenario: ScenarioIn = ScenarioIn()
    risk_aversion_range: tuple[float, float] = (1e-11, 1e-7)  # log-spaced
    donation_range: tuple[float, float] = (0.0, 150e6)
    n: int = Field(25, ge=5, le=60)
