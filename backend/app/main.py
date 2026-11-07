from dataclasses import asdict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from donor_economics import Scenario

from . import full_hedge, knowledge, marginal_profit

app = FastAPI(title="Donor Economics API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# One router per strategy page.
app.include_router(full_hedge.router)
app.include_router(marginal_profit.router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/defaults")
def defaults() -> dict:
    return {"scenario": asdict(Scenario()), "donation": 50e6, "hedge": 25e6}


@app.get("/api/knowledge")
def list_knowledge() -> list[dict]:
    return knowledge.list_docs()


@app.get("/api/knowledge/{slug}")
def get_knowledge(slug: str) -> dict:
    doc = knowledge.get_doc(slug)
    if doc is None:
        raise HTTPException(status_code=404, detail="unknown document")
    return doc
