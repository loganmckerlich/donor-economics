# Donor Hedging Economics Knowledgebase

Background notes for `src/donor_economics/model.py`. Research date: 2026-11-05 (two days after the 2026 US midterms).
Not legal or financial advice.

## Question
Can a billionaire donor who gains `V` if candidate A wins, and donates `D` to A, economically justify buying the NO side of A's market (size `H`) as a partial hedge?

## How the model maps to the topics
| Model parameter | Meaning | Main notes |
|---|---|---|
| `payoff_if_win` (V), `donation` (D) | Stakes | [01 hedging](01-hedging-and-risk.md) |
| `base_win_prob`, `max_win_prob`, `donation_scale` | Donation effect on P(win) | [04 donations](04-political-donations.md) |
| `market_yes_price`, `market_tracks_donation` | Market-implied probability, repricing | [02 mechanics](02-prediction-market-mechanics.md), [06 quant](06-quantitative-methods.md) |
| `market_depth` | Linear price impact | [03 microstructure](03-microstructure-and-price-impact.md) |
| `fee_rate` | Proportional fee | [02 mechanics](02-prediction-market-mechanics.md) |
| (not modelled) legal feasibility | | [05 legal](05-legal-and-regulatory-risk.md) |

## Files
1. [01-hedging-and-risk.md](01-hedging-and-risk.md): variance, utility, full vs partial hedges, why hedge at zero EV.
2. [02-prediction-market-mechanics.md](02-prediction-market-mechanics.md): contracts, order books, fees, Polymarket vs Kalshi, liquidity.
3. [03-microstructure-and-price-impact.md](03-microstructure-and-price-impact.md): slippage, impact models, signaling, manipulation.
4. [04-political-donations.md](04-political-donations.md): limits, Super PACs, coordination, evidence on money and votes.
5. [05-legal-and-regulatory-risk.md](05-legal-and-regulatory-risk.md): CFTC, litigation, insider rules, position limits, reputation.
6. [06-quantitative-methods.md](06-quantitative-methods.md): Kelly, EU, mean-variance, Monte Carlo, calibration, next steps.
7. [07-glossary-and-sources.md](07-glossary-and-sources.md): glossary and reading list.

## Conventions
- **[Established]** = well-documented fact. **[Contested]** = disputed in literature. **[Unverified]** = could not confirm from a primary source; check before use.
- Time-sensitive facts carry a date.

## Top findings (summary)
1. Fair-priced hedge has zero EV and only cuts variance; cost = fees + spread + impact (+ the donor's information edge if any). Hedging the donor's own-influenced outcome is subtle: the donation changes true P(win), but the market price may not reflect it.
2. Evidence that marginal campaign dollars move outcomes is weak-to-modest (Levitt, Gerber), so `max_win_prob - base_win_prob` should be small; large lifts are an assumption, not a finding.
3. Real fees are not proportional to spend: Kalshi's taker fee is `0.07*C*P*(1-P)` (peaks ~1.75c/contract at 50c); Polymarket US charges makers 0 and takers a category rate (sources conflict, see 02).
4. Depth: a $25M NO purchase is feasible in headline markets only with real slippage; 2024 presidential market volume was in the billions but top-of-book depth is [Unverified]. Kalshi position limits were reported at $7M/strike for non-ECPs and $100M for ECPs (2024 rule text, check current).
5. Legal risk is the binding constraint, not economics: the CFTC treats insider/manipulation conduct in prediction markets as an enforcement priority (2026), Kalshi bars candidates and staff from trading their own races, and the federal/state preemption fight is unresolved.
