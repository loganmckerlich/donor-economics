# donor-economics

Is it economically viable for a billionaire political donor to hedge on a prediction market?

**Example:** a donor receives $100M if candidate A wins. They donate $50M to A, then buy $25M of "NO" (A loses) on a prediction market. If A wins they keep the payoff minus the donation and the lost bet. If A loses they lose the donation but collect on the bet. The question is whether, and under what conditions, that hedge is worth doing.

This is a theory exercise. Real-world frictions are deliberately set aside (see below).

- Model code: `src/donor_economics/model.py`
- Background research (web-sourced, partly unverified): [`economics-knowledgebase/`](economics-knowledgebase/README.md)

## Modeling assumptions

The app shows these in a collapsible "Model assumptions" panel with a worked example for each (`frontend/src/lib/assumptions.ts`; keep the two in sync).

### Structure
1. **Static, one-shot.** The donor donates, hedges once, and the election resolves. No dynamic rebalancing.
2. **Binary market.** A single binary contract: A wins / A loses. No multi-candidate or primary-vs-general structure.
3. **Payoff is simple, predefined and static.** The donor receives `V` if and only if A wins, and nothing otherwise. No outcome-independent value (no "access" benefit). The donation `D` is a sunk cost either way.

### The donor
4. **Unlimited capital, motivated only by money.** The donor can always fund both the donation and the hedge, and only cares about making more money.
5. **Risk aversion is a parameter.** The app starts at gamma = 2 on $5B of wealth (a = 4e-10); gamma = 0 is risk-neutral. It uses absolute risk aversion (CARA, `u(x) = -exp(-a x)`) with `a = gamma / wealth`, so wealth only enters through that conversion. Sweeping it shows how risk-averse a donor must be for hedging to pay.
6. **No private information**, other than the fact that they are donating (see 8).

### Donation effect on the election
7. **Win probability is a concave function of donation, not linear.** `p(D)` is a parameter, with a logarithmic form as the default, for example `p(D) = p0 + k * ln(1 + D / s)`, capped below 1. The functional form, `k` and `s` are swept. See the evidence note below.

### The market
8. **Efficient, and it reprices for the donation.** The market price of A winning equals the true probability given the donation, `p(D)`. The donor has no edge, so any hedge is bought at a fair price before impact.
9. **No price impact.** The donor fills their entire order at the prevailing market price, however large. There is no slippage and no signaling or reputational effect.

### Explicitly out of scope
- Outcome-independent value from donating (access, goodwill). Assumption 3 makes the payoff purely contingent on winning. This is probably the largest gap between the model and reality: such value would shrink the need to hedge.
- Transaction fees, price impact, market depth and the opportunity cost of capital locked in the hedge.
- Platform failure, counterparty risk and resolution disputes.
- Legality (contribution limits, coordination rules, CFTC and insider rules) and taxes.

These are real constraints, and the knowledgebase files cover them, but they are excluded from the core model.

## What these assumptions imply

With a fair market, no fees, no impact and no carry cost, **a hedge is exactly zero-EV**: it changes only the spread of outcomes, never the mean. So:

- A **risk-neutral** donor is indifferent to hedging.
- Any **risk-averse** donor (`a > 0`) should **fully hedge**, and this is optimal for every `a`. The full hedge is `H* = V * (1 - p(D))`, which locks in `p(D) * V - D` in both outcomes.
- A partial hedge, such as the $25M example, captures part of the variance reduction and is never better than the full hedge.
- The hedge **cannot rescue a bad donation.** Whether donating is worthwhile depends only on `p(D) * V - D` against the no-donation baseline `p0 * V`. With literature-sized effects the donation is negative-EV, and the hedge only removes variance around that loss.

In this frictionless world the hedge is therefore always viable, and only the donation decision is interesting. Any non-trivial viability question needs at least one friction (price impact, fees, carry cost, or a market that does not fully reprice for the donation), all deliberately excluded here.

## Evidence note: functional form of the donation effect

A quick, secondary-source-only search (search summaries, not the primary papers) suggests:

- Diminishing returns to spending are the standard finding in House and Senate studies, and models commonly use log or quadratic terms (Jacobson 1978 and 1990; Green & Krasno 1988; Gerber 1998). A log form is therefore a defensible default.
- Whether challenger or incumbent spending is more productive is disputed; it comes down to endogeneity (money flows to candidates who are already expected to do well). Levitt (1994) finds very small effects.
- For TV advertising, Sides, Vavreck & Warshaw (2021) report only weak diminishing returns except at very high levels of advertising. Per-person effects are small and decay quickly.
- The results are mixed enough that the functional form should be swept rather than fixed.

**Status:** unverified beyond search summaries. Check the primary sources before citing.

## Running the app

Two processes: a FastAPI backend (wraps the Python model) and a Next.js + Tailwind frontend that proxies `/api/*` to it.

```
# terminal 1: API on :8000
cd backend && ../.venv/bin/pip install -r requirements.txt
../.venv/bin/uvicorn app.main:app --port 8000

# terminal 2: UI on :3000
cd frontend && npm install && npm run dev
```

Set `BACKEND_URL` if the API is not on `http://127.0.0.1:8000`. API tests: `cd backend && ../.venv/bin/pytest`.

A row of **scenario presets** sits above the sections: the realistic default ("Literature-sized effect", where the best donation is $0), plus four regimes where donating pays: a billion-dollar policy stake, an open-seat primary, early money, and a true believer. Donating only pays when the first dollar returns more than a dollar, i.e. when V * k / s > 1; at the default effect that needs a payoff of roughly $660M. Switching presets leaves the previous curves as dotted "before" lines. In the big-stake presets the risk-free hedge can be billions of dollars, far beyond what a prediction market could absorb; that friction is deliberately outside the model.

The Explorer page is organised in three sections. Each section has its own sliders beside the charts they drive. Five controls are always visible: payoff, the win-probability boost a $50M donation buys, the donation, the hedge (as a percentage of the risk-free hedge) and risk aversion. Rarely-changed assumptions (base win probability, functional form, effect scale, donor wealth) are in collapsed "Advanced assumptions" groups, with a "changed" badge when any is off its default. The boost is the anchor: `k` is derived from it, so changing the form or scale reshapes the curve without changing the boost at $50M.

- **A. Does the donation pay?** Charts 1 (win probability) and 2 (EV of donating vs not).
- **B. How should the donor hedge?** Charts 3 (payoffs vs hedge size) and 4 (value of hedging).
- **C. Where does it pay?** Heatmaps of the optimal donation (boost x payoff) and of the value of hedging (risk aversion x donation). Charts 5 and 6.

Hover any control (or focus it with the keyboard) for a plain-language explanation of what it is and does. Each slider carries numbered chips for the charts it changes: hovering a chip says whether the control reshapes that chart or only moves your marker, and hovering or focusing the slider outlines those charts. Hover any headline number in the top bar for what it means. When you move a slider, the previous curves stay behind as faint dotted "before" lines (and a dashed ring on the heatmaps) until the next change or "Clear before lines". A sticky bar at the top keeps the headline numbers and the "Apply optimal strategy" button in view.

The **Glossary** page (`/glossary`) presents the `economics-knowledgebase/` files: a searchable list of terms, each topic note, and the sources. The backend serves the markdown from `GET /api/knowledge` and `GET /api/knowledge/{slug}`.

## Setup

```
python3 -m venv .venv
.venv/bin/pip install -e '.[dev]'
.venv/bin/pytest
```

## Model API (`donor_economics`)

- `Scenario(...)`: `payoff_if_win`, `base_win_prob`, `effect_size` (`k`), `effect_scale` (`s`), `effect_form` (`"log"`, `"linear"` or `"saturating"`), `risk_aversion` (`a`).
- `evaluate(s, donation, hedge)`: win/lose P&L, EV, standard deviation and CARA certainty equivalent.
- `full_hedge_size`, `optimal_hedge`: closed-form hedge sizes.
- `donation_ev`, `optimal_donation`: the donation decision, relative to not donating.

Example, with the default `Scenario` (V=$100M, p0=0.50, k=0.015, s=$10M), `D=$50M`, so p(D)=0.527:

| Hedge | Win | Lose | EV | Std dev |
|---|---|---|---|---|
| None | +$50.0M | -$50.0M | +$2.7M | $49.9M |
| $25M | +$25.0M | -$22.1M | +$2.7M | $23.5M |
| $47.3M (full) | +$2.7M | +$2.7M | +$2.7M | $0 |

Here `EV` is the donor's payoff `p(D) * V - D`, which is +$2.7M. Relative to not donating at all it is -$47.3M, because the baseline `p0 * V` is $50M, and the optimal donation is $0. The default `k` is a placeholder chosen to give about +2.7 points at $50M, in line with the literature's "a few points at best" (unverified, see the evidence note).

### Calibrating risk aversion

CARA `a` is in units of 1/$. A billionaire with wealth `W` and CRRA coefficient `γ` has roughly `a ≈ γ / W`. For `γ = 2` and `W = $5B` that is `a ≈ 4e-10`, and the certainty-equivalent gain from fully hedging the $50M donation is then only about $0.5M. An `a` of `1e-8` (the value in some tests) is about 25 times more risk-averse than that and should be read as a stress case.
