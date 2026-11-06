# 06 Quantitative Methods

## Kelly criterion [Established]
For a binary bet buying YES at price `c` with true probability `p`: optimal fraction of wealth `f* = (p - c)/(1 - c)`. For NO: `f* = ((1-p) - c_no)/(1 - c_no)`. Kelly maximises expected log wealth; fractional Kelly (0.25-0.5) is common given estimation error.
- For the donor, Kelly applies to *speculative* edge only. The hedge motive is variance reduction, not edge: use expected utility (below). With no edge, Kelly says bet 0 on the market.
- Insight: if the donor believes the donation raises p above the market, Kelly says *buy YES* (do not hedge). Hedging while believing the market underprices A is self-contradictory unless risk aversion dominates. (The current model avoids this: the efficient market already reprices for the donation, so there is no edge and Kelly gives 0.)

## Expected utility (in the model: CARA)
`maximize E[u(pnl)]` over `H` (and `D`). The model uses CARA utility `u(x) = -exp(-a x)`, with `a = risk_aversion` in 1/$ and `a = 0` risk-neutral, so no wealth level is needed. It is linked to CRRA by `a ≈ γ / W0` (`W0` = net worth): for CRRA `U(w) = w^(1-γ)/(1-γ)` and `V, D, H` << `W0`, the variance penalty is second-order, `(a/2) * Var = γ/(2*W0) * Var`. With W0 = $5B, γ=2 (`a ≈ 4e-10`), std ~ $50M: variance penalty ~ `0.5*2/5000 * 50^2 = $0.5M`; this matches the model's CE gain of about $0.5M from fully hedging the default $50M donation. [Illustrative arithmetic, own calc, checked against `evaluate`.]
- Because the hedge is fairly priced and frictionless in the model, it costs nothing in EV, so even a $0.5M gain makes the full hedge optimal: any `a > 0` fully hedges. The earlier conclusion that a diversified billionaire would *not* hedge came from comparing that gain with a hedge cost of several $M; that cost (fees, impact) is outside the current model's scope and would be needed to reproduce it. With frictions, hedging is more plausible if wealth is concentrated and the outcome affects the business itself, or if γ is very high / utility is objective-specific (i.e. a large `a`).

## Mean-variance
`U = EV - (λ/2) * Var`, which is the small-`a` approximation of the CARA certainty equivalent with `λ = a`. For a constant-price hedge the EV reduction is `H*(1 - (1-p)/c) + fees`, which is zero at a fair price and without fees (the current model), while variance falls as `(1 - H/H*)^2` with `H* = V*(1 - m)`. So the argmax is the full hedge `H*` whenever `λ > 0`. With a positive EV cost (fees, impact) the optimum becomes interior: an extension.

## Monte Carlo ideas
- Draw uncertainty over: donation effect (`effect_size`, `effect_scale`, `effect_form`), `V`, `base_win_prob`, `risk_aversion`; and, as extensions, true vs market probability (bias term), depth, fee schedule, legal-event probability.
- Output distribution of the certainty-equivalent gain from hedging and of `donation_ev`; report P(donation beats not donating).
- Simulate discrete outcome (A wins/loses) given `p(D)`; use common random numbers for hedge/no-hedge comparisons.
- Sample true `p` from Beta centered on market price to represent model uncertainty.

## Calibration of prediction markets
- Prediction-market prices are generally good forecasts (Wolfers and Zitzewitz 2004 is the standard review [not retrieved; Unverified details]).
- Kalshi data: Bürgi, Deng, Whelan, "Makers and Takers" (CEPR DP20631 2025; GWU WP 2026-001): low-price contracts win less often than priced (longshot bias), high-price contracts have small positive returns; more pronounced for takers; accuracy improves near expiry; fees plus slight overstatement of small probabilities reproduce the pattern. Working paper, full text not verified. [GWU PDF](https://www2.gwu.edu/~forcpgm/2026-001.pdf), [ifo](https://www.ifo.de/en/cesifo/publications/2025/working-paper/makers-and-takers-economics-kalshi-prediction-market).
- Earlier: Berg and Rietz (2019) reported no favorite-longshot bias on IEM. [As summarized; not verified.]
- Implication for a NO hedge: if A is the underdog (YES price low), NO is the *favorite* side, which historically earns small positive returns; if A is the favorite, NO is the longshot and is overpriced, so hedging is costlier. [Direction per Kalshi finding; magnitude not quantified here.]

## Possible next modelling steps (extensions)
Already done in the current model: risk aversion (CARA) with certainty-equivalent output, `optimal_hedge`, `optimal_donation`, a donation effect curve with log/linear/saturating forms, and an efficient market that reprices (`m = p(D)`). Remaining ideas:
1. Replace the zero fee with Kalshi/Polymarket schedules; add spread and per-venue taker/maker choice. A fee makes the hedge cost positive.
2. Impact: add linear and sqrt options and an order-book walk; plot cost vs `H`.
3. Add position limits and a feasibility flag (cap on `H`).
4. Add a `true_prob_bias` (market mispricing, incl. favorite-longshot) separate from the donation effect. The current model sets the market price equal to the true probability `p(D)`.
5. Time value: financing cost until resolution.
6. Monte Carlo over parameter uncertainty; sensitivity tornado (especially `effect_size`).
7. Calibrate the donation effect to the literature (file 04); consider a logit-scale effect.
8. Joint optimisation of `D` and `H` once a friction couples them (in the current model `donation_ev` does not depend on `H`).

## Implications for this project
In the current model (fair market, no frictions) the hedge is exactly zero-EV, so hedging is trivially optimal for any `a > 0` and the answer to "should the donor hedge" is yes; the informative results are the size of the CE gain (small for a diversified billionaire, about $0.5M at `a = 4e-10`) and the donation decision, which is negative-EV for literature-sized effects. Extensions 1-3 and 5 would each add a positive hedge cost and so turn the hedge size into an interior optimum; that is where a non-trivial hedging-viability answer would come from.
