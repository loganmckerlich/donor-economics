# 06 Quantitative Methods

## Kelly criterion [Established]
For a binary bet buying YES at price `c` with true probability `p`: optimal fraction of wealth `f* = (p - c)/(1 - c)`. For NO: `f* = ((1-p) - c_no)/(1 - c_no)`. Kelly maximises expected log wealth; fractional Kelly (0.25-0.5) is common given estimation error.
- For the donor, Kelly applies to *speculative* edge only. The hedge motive is variance reduction, not edge: use expected utility (below). With no edge, Kelly says bet 0 on the market.
- Insight: if the donor believes the donation raises p above the market, Kelly says *buy YES* (do not hedge). Hedging while believing the market underprices A is self-contradictory unless risk aversion dominates.

## Expected utility
`maximize E[U(W0 + pnl)]` over `H` (and `D`). With CRRA utility `U(w) = w^(1-γ)/(1-γ)` and `W0` = net worth; for `V, D, H` << `W0`, risk aversion has negligible impact (second-order: `γ/(2*W0) * Var`). With W0 = $5B, γ=2, std ~ $50M: variance penalty ~ `0.5*2/5000 * 50^2 = $0.5M` vs hedge cost of several $M, so the hedge is *not* worth it for a diversified billionaire. [Illustrative arithmetic, own calc.] Hedging is more plausible if wealth is concentrated and the outcome affects the business itself, or if γ is very high / utility is objective-specific.

## Mean-variance
`U = EV - (λ/2) * Var`. Closed-form optimum for a constant-price hedge: minimise over `H`; EV reduction is `H*(1 - (1-p)/c) + fees` (zero at fair price), variance falls as `(1 - H/(cV))^2`. Use as the first extension of `model.py`: pick `λ`, find argmax over `H`.

## Monte Carlo ideas
- Draw uncertainty over: donation effect (`max_win_prob`), true vs market probability (bias term), depth, fee schedule, legal-event probability, `V`.
- Output distribution of utility-equivalent gain from hedging; report P(hedge improves certainty-equivalent).
- Simulate discrete outcome (A wins/loses) given `p(D)`; use common random numbers for hedge/no-hedge comparisons.
- Sample true `p` from Beta centered on market price to represent model uncertainty.

## Calibration of prediction markets
- Prediction-market prices are generally good forecasts (Wolfers and Zitzewitz 2004 is the standard review [not retrieved; Unverified details]).
- Kalshi data: Bürgi, Deng, Whelan, "Makers and Takers" (CEPR DP20631 2025; GWU WP 2026-001): low-price contracts win less often than priced (longshot bias), high-price contracts have small positive returns; more pronounced for takers; accuracy improves near expiry; fees plus slight overstatement of small probabilities reproduce the pattern. Working paper, full text not verified. [GWU PDF](https://www2.gwu.edu/~forcpgm/2026-001.pdf), [ifo](https://www.ifo.de/en/cesifo/publications/2025/working-paper/makers-and-takers-economics-kalshi-prediction-market).
- Earlier: Berg and Rietz (2019) reported no favorite-longshot bias on IEM. [As summarized; not verified.]
- Implication for a NO hedge: if A is the underdog (YES price low), NO is the *favorite* side, which historically earns small positive returns; if A is the favorite, NO is the longshot and is overpriced, so hedging is costlier. [Direction per Kalshi finding; magnitude not quantified here.]

## Suggested next modelling steps for this repo
1. Add `risk_aversion` (CARA/CRRA) and utility/certainty-equivalent outputs; optimise `H` (and `D`).
2. Replace flat fee with Kalshi/Polymarket schedules; add spread and per-venue taker/maker choice.
3. Impact: add sqrt model option and an order-book walk; plot cost vs `H`.
4. Add position limits and a feasibility flag.
5. Add `true_prob_bias` (market mispricing, incl. favorite-longshot) separate from donation effect; note `market_tracks_donation` currently flips the whole market price to `win_prob()`, which also equates market and true probability.
6. Time value: financing cost until resolution.
7. Monte Carlo over parameter uncertainty; sensitivity tornado.
8. Calibrate donation effect to literature (file 04); consider logit-scale effect rather than exponential saturation.
9. Observed quirk in `model.py` worth a unit test: `_avg_no_price` cap 0.999 makes `full_hedge_size` return None when hedge cannot be absorbed; and `evaluate` charges fee on notional, not on contracts.

## Implications for this project
Without risk aversion and a wealth scale, the model can only say "hedge costs EV." Adding utility will show hedging is only attractive for a high-γ, concentrated-wealth donor, which is the project's most informative result.
