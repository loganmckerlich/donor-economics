from dataclasses import asdict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from donor_economics import Scenario

from . import analysis, knowledge, marginal
from .schemas import AnalysisIn, DonationHeatmapIn, HedgeValueIn, MarginalIn

app = FastAPI(title="Donor Economics API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/defaults")
def defaults() -> dict:
    return {"scenario": asdict(Scenario()), "donation": 50e6, "hedge": 25e6}


@app.post("/api/analysis")
def post_analysis(body: AnalysisIn) -> dict:
    return analysis.analysis(body.scenario.to_model(), body.donation, body.hedge, body.hedge_fraction)


@app.post("/api/sweep/donation-heatmap")
def post_donation_heatmap(body: DonationHeatmapIn) -> dict:
    return analysis.donation_heatmap(
        body.scenario.to_model(), body.effect_size_range, body.payoff_range, body.n
    )


@app.post("/api/sweep/hedge-value")
def post_hedge_value(body: HedgeValueIn) -> dict:
    return analysis.hedge_value_heatmap(
        body.scenario.to_model(), body.risk_aversion_range, body.donation_range, body.n
    )


@app.post("/api/marginal")
def post_marginal(body: MarginalIn) -> dict:
    return marginal.marginal_analysis(body.to_model())


@app.get("/api/knowledge")
def list_knowledge() -> list[dict]:
    return knowledge.list_docs()


@app.get("/api/knowledge/{slug}")
def get_knowledge(slug: str) -> dict:
    doc = knowledge.get_doc(slug)
    if doc is None:
        raise HTTPException(status_code=404, detail="unknown document")
    return doc
