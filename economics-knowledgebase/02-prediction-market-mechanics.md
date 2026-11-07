# 02 Prediction Market Mechanics

Model scope: only the basic binary contract is **in the model** (a YES share pays $1 if A wins; the hedge buys NO at `1 - m`, where `m = p(D)`). Fees, depth and capital costs are **not in the Full Hedge model** (possible extensions there) but are included in the Marginal Profit model (`src/donor_economics/marginal_profit.py`) as a flat fee per side, a depth that sets linear price impact, and an annual carry rate. Position limits are outside both models.

## Binary contracts [Established]
- A YES share pays $1 if the event occurs, else $0; NO is the complement. Prices are in $0.01-$0.99; YES + NO ~ $1 (arbitrage links them).
- Price ~ market-implied probability, but it is a *risk-neutral, fee- and capital-cost-adjusted* number, not necessarily the true probability (see favorite-longshot bias, file 06). The model assumes an efficient market: `m` equals the true win probability given the donation, `p(D)`.
- Capital is locked until resolution (opportunity cost; matters for a long-dated election market). The model ignores this cost.

## Venues (state as of 2026-11-05; verify before use)

| | Kalshi | Polymarket |
|---|---|---|
| Regulatory status | CFTC-regulated DCM, US | Offshore crypto exchange; US arm "Polymarket US" (QCX LLC, a DCM from the $112M QCEX purchase, July 2025) |
| US access | Yes, KYC | Polymarket US rolled out Dec 2025; main offshore exchange approval for US users sought (application reported April 28, 2026) and status [Unverified] |
| Collateral | USD | USDC (offshore) / USD (US arm) |
| Order book | CLOB | CLOB (hybrid on-chain settlement) |

Sources: [The Block on QCEX](https://www.theblock.co/post/363623/polymarket-plans-to-re-enter-us-with-acquisition-of-derivatives-exchange-qcex), [River Markets fee note](https://www.rivermarkets.com/insights/polymarket-us-fees.html), [Defiant](https://thedefiant.io/news/defi/polymarket-strikes-usd112-million-deal-to-return-to-the-united-states). A headline "Polymarket cleared by CFTC for US return" (June 16, 2026) conflicts with a reported June 2026 CFTC probe: [Unverified].

## Fees (in the Marginal Profit model only)
The Full Hedge model has no fees. The Marginal Profit model charges a flat share of dollars traded on each side (default 1%, covering fees and spread). The facts below are background for choosing that rate.
- **Kalshi taker fee:** `fee = ceil_to_cent(0.07 * C * P * (1-P))`, `C` contracts, `P` price in dollars; max ~1.75c per contract at 50c (~3.5% of cost). Makers mostly free or reduced (0.0175 multiplier on some series). Schedule versions changed in 2026 (Feb 5; a July 2026 revision is mentioned by one source), so check live. Sources: [Kalshi fee PDF](https://kalshi.com/docs/kalshi-fee-schedule.pdf), [Allium](https://allium.so/blog/kalshi-fees-why-the-cost-peaks-near-50-cents/).
- **Polymarket US (per a single third-party source, dated Aug 2026):** makers 0%; taker rate by category (politics 4% effective July 1, 2026). [Unverified]: confirm on Polymarket's own schedule. A flat proportional fee (as an earlier model version used) fits this loosely; Kalshi's fee is price-dependent.
- Fee is often charged per round trip only at entry; held to resolution there is no exit fee (settlement is free). [Established for both venues in general; confirm current rules.]

## Resolution
Per rulebook, based on defined source (e.g. certified results, AP call). Disputes/oracle risk is higher on Polymarket (UMA) historically. [Established in general; specific election dispute cases not researched.] The model assumes clean resolution (no platform failure or disputes).

## Liquidity and depth (in the Marginal Profit model only)
The Full Hedge model fills the whole order at the quoted price whatever its size, so depth is irrelevant to it. The data below show why that is an idealisation. The Marginal Profit model uses a single depth number, the dollars of orders that move the price one point, and assumes impact is linear.
- Volumes: Polymarket's 2024 US presidential winner market had billions in volume (figures vary, $2.3B-$3.7B depending on source and definition). A single "Theo" whale reportedly staked $30M-$45M+ on Trump over several accounts and netted ~$80M profit (Chainalysis est.). Sources: [Fox Business](https://foxbusiness.com/media/election-bettor-whale-made-much-more-trump-win-than-originally-thought-analysis-shows), [The Block](https://www.theblock.co/post/324996/french-polymarket-whale-us-election-profit-france-ban).
- 2026 midterms: Kalshi midterm volume reported above $1.4B by Election Day; Polymarket ~$600M in an earlier tally. [Crypto Briefing](https://cryptobriefing.com/kalshi-midterm-trading-volume-tops-1-billion/). Per-race depth for a House/Senate market is much thinner than the presidential market. Top-of-book depth data: **not found** [Unverified].
- Volume is not depth: volume over weeks does not mean a hedge of tens of millions (the default full hedge is about $52M) is fillable at one price.

## Position limits (see also file 05; outside both models)
Reported Kalshi election-market rule text (2024): $7M per strike per member; $100M for eligible contract participants. [Bonus.com fact check](https://www.bonus.com/news/fact-check-can-kalshi-users-really-wager-up-to-100-million-on-the-election/). Not verified against the current rulebook.

## Implications for this project
- In the model the hedge is bought at exactly `1 - m` with `m = p(D)`, no fee and no cap on size. In the Full Hedge model everything on fees, depth and limits above is a possible extension; the Marginal Profit model includes fees and depth but not limits, so a $1B YES position in that model is far larger than most political markets could take.
- A future fee friction (e.g. Kalshi's price-dependent formula, or a venue-specific taker rate) would make the hedge cost positive: EV would fall with `H`, and the optimal hedge for a risk-averse donor would become partial rather than the full `H*`.
- A future depth or price-impact friction would raise the average NO price above `1 - m`; the real depth of a given race is unknown, so it would be a range for sensitivity.
- A future position limit would cap `H` below `full_hedge_size`. A retail account may hit limits; ECP status or multiple contracts (e.g. a "winner" and a "party control" market) would matter.
- A future time-to-resolution capital cost (e.g. 5% annual opportunity rate) would be another positive hedge cost.
