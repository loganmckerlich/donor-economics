# Donor Hedging Economics Knowledgebase

Background notes for `src/donor_economics/model.py`. Research date: 2026-11-05 (two days after the 2026 US midterms). Background research, partly unverified; not legal or financial advice.

## Question
Can a billionaire donor who gains `V` if candidate A wins, and donates `D` to A, economically justify buying the NO side of A's market (size `H`) as a hedge?

## The current model in brief
Static, one binary contract. The donor receives `V` iff A wins; the donation `D` is a sunk cost. Win probability is `p(D) = min(p0 + k*ln(1 + D/s), 0.999)` by default. The market is efficient and reprices for the donation, so the YES price is `m = p(D)`, and the hedge buys NO at `1 - m`. Payoffs: win `V - D - H`; lose `-D + H*m/(1 - m)`. The donor has CARA utility (`a = 0` is risk-neutral).

## How the model maps to the topics

| Model parameter / variable | Meaning | Main notes |
|---|---|---|
| `payoff_if_win` (V) | Payoff if A wins | [01 hedging](01-hedging-and-risk.md), [04 donations](04-political-donations.md) |
| `base_win_prob` (p0) | P(A wins) with no donation | [04 donations](04-political-donations.md), [06 quant](06-quantitative-methods.md) |
| `effect_size` (k; in the app derived from the "boost from a $50M donation"), `effect_scale` (s), `effect_form` | Donation effect curve p(D): log, linear or saturating | [04 donations](04-political-donations.md) |
| `risk_aversion` (a) | CARA coefficient in 1/$, roughly gamma / wealth; 0 = risk-neutral | [01 hedging](01-hedging-and-risk.md), [06 quant](06-quantitative-methods.md) |
| `donation` (D) decision | Sunk cost; judged by `donation_ev` | [04 donations](04-political-donations.md) |
| `hedge` (H) decision | Dollars on NO at `1 - m`; full hedge `H* = V*(1 - m)` | [01 hedging](01-hedging-and-risk.md) |
| Market price `m = p(D)` | Efficient market reprices for the donation | [02 mechanics](02-prediction-market-mechanics.md), [06 quant](06-quantitative-methods.md) |

**In the model:** hedging and risk aversion (01), the binary contract and efficient repricing (02), the donation effect (04), and expected utility (06). **Extensions (outside the current model's scope):** fees and depth (02), price impact and signaling (03), legal, tax and platform risk (05), and the calibration and Monte Carlo ideas (06). Notes 02, 03 and 05 are kept as background, and each has an "Implications" section mapping them onto the model if added later.

## Files
1. [01-hedging-and-risk.md](01-hedging-and-risk.md): variance, utility, full vs partial hedges, why hedge at zero EV.
2. [02-prediction-market-mechanics.md](02-prediction-market-mechanics.md): contracts, order books, fees, Polymarket vs Kalshi, liquidity.
3. [03-microstructure-and-price-impact.md](03-microstructure-and-price-impact.md): slippage, impact models, signaling, manipulation.
4. [04-political-donations.md](04-political-donations.md): limits, Super PACs, coordination, evidence on money and votes, donation EV.
5. [05-legal-and-regulatory-risk.md](05-legal-and-regulatory-risk.md): CFTC, litigation, insider rules, position limits, reputation.
6. [06-quantitative-methods.md](06-quantitative-methods.md): Kelly, expected utility, mean-variance, Monte Carlo, calibration, next steps.
7. [07-glossary-and-sources.md](07-glossary-and-sources.md): glossary and reading list.

## Conventions
- **[Established]** = well-documented fact. **[Contested]** = disputed in literature. **[Unverified]** = could not confirm from a primary source; check before use.
- Time-sensitive facts carry a date.

## Top findings (summary)
1. With a fair-priced hedge and no frictions, the hedge is exactly zero-EV: it changes only the spread of outcomes. A risk-neutral donor is indifferent; any risk-averse donor (`a > 0`) maximises certainty equivalent by fully hedging, `H* = V*(1 - m)`, for every `a`. The size of the gain is small for a diversified billionaire (about $0.5M at `a = 4e-10` for the default $50M donation).
2. The donation decision is the interesting one, and the donation effect size is the crux. Evidence that marginal campaign dollars move outcomes is weak-to-modest (Levitt, Gerber), so `effect_size` should give only a few points of win probability at $50M. With the defaults (V=$100M, p0=0.45, k=0.015, s=$10M), p($50M) = 0.4769 and the donation is about -$47.3M EV against not donating; the hedge cannot rescue it. Large lifts are an assumption, not a finding.
3. Frictions are real-world extensions, not in the model. Kalshi's taker fee is `0.07*C*P*(1-P)` (peaks ~1.75c/contract at 50c); Polymarket US charges makers 0 and takers a category rate (sources conflict, see 02). Each fee would make the hedge cost positive and the optimal hedge partial.
4. Depth and price impact are also extensions: a $50M-scale NO purchase is feasible in headline markets only with real slippage; 2024 presidential market volume was in the billions but top-of-book depth is [Unverified]. Kalshi position limits were reported at $7M/strike for non-ECPs and $100M for ECPs (2024 rule text, check current), which would cap `H` below `H*`.
5. Legal risk is real but outside the model: the CFTC treats insider/manipulation conduct in prediction markets as an enforcement priority (2026), Kalshi bars candidates and staff from trading their own races, and the federal/state preemption fight is unresolved. Hedge viability is conditional on legal clearance.
