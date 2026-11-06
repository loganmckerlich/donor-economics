# 03 Market Microstructure and Price Impact

Model scope: **everything in this note is outside the current model's scope.** The model assumes no price impact and unlimited depth: the whole hedge fills at the quoted price `1 - m` (with `m = p(D)`), however large. This note is background for a possible price-impact extension.

## Components of execution cost [Established]
- **Spread:** best ask minus best bid; a taker pays half the spread.
- **Slippage:** walking the book; avg price above best ask for a large order.
- **Price impact:** how the order moves the price (temporary vs permanent).
- **Fees:** see file 02.

## Impact models

| Model | Form | Notes |
|---|---|---|
| Linear (Kyle 1985) | `Δp = λ * Q` | Equilibrium with informed trader and noise traders; the simplest candidate for a future extension (an earlier model version used it). Avg price = `c0 + H/(2*depth)`. |
| Square-root | `Δp ~ σ * sqrt(Q / V_daily)` | Widely reported empirical law in equities/futures (Almgren et al. 2005, Tóth et al. 2011, Bouchaud). Concave: cost grows slower than linear at large sizes. |
| Order-book walk | Sum over actual levels | Best for a single known snapshot; needs data. |

- In prediction markets, price is bounded in [0,1]; impact near extremes is naturally compressed. The current model also keeps prices strictly inside (0,1) with a `0.999` cap on `p(D)`.
- Whether sqrt-law holds in prediction markets is [Unverified]; no empirical study located. Treat linear and sqrt as sensitivity bounds.

## Linear-impact intuition (hypothetical extension)
Spend `H`, depth `L`: avg price `c0 + H/(2L)`; final marginal price `c0 + H/L`. With `L = 20M`, `H = 25M`: marginal price rises 1.25, i.e. the price cap binds. In practice a hedge this large cannot be done in one clip at one price. [Derived from the earlier linear-depth version of the model; the current model has no depth parameter.]

## Signaling and information leakage
- A large bet on NO against a *known* funded candidate is itself news: others may infer that the donor thinks A is weak, or that the donation will not be enough. Price can move before the order completes (front-running by bots; whale-watching).
- Evidence: Polymarket whale "Theo4" moved odds visibly on large trades in Oct 2024 ([CoinDesk via search results](https://hotfix.coindesk.com/markets/2024/10/23/trump-polymarket-odds-briefly-dip-after-his-no-2-bull-adds-bet-on-harris)). Onchain venues expose wallets; clustering can deanonymize large traders (Chainalysis traced whale accounts).
- Mitigation: slice orders (TWAP), use multiple venues, resting limit orders (maker, lower fee), but anonymity via multiple accounts can breach KYC/terms (see file 05).

## Manipulation concerns
- Large trades could be used to move the market price to influence perceived momentum ("bandwagon" fears). The literature (Hanson & Oprea 2009, "A Manipulator Can Aid Prediction Market Accuracy") argues manipulators can *improve* accuracy by subsidising informed traders; but regulators view it differently. A donor who funds a candidate and also trades the market has an apparent manipulation incentive. [Contested]
- 2024: some argued Polymarket whales skewed odds toward Trump ([DL News](https://dlnews.com/articles/defi/4-crypto-whales-are-skewing-trump-polymarket-election-bet/)); results of whether this affected votes are [Unverified/likely small].

## Implications for this project
- Price impact is assumed away in the current model, which is a key reason the hedge is exactly zero-EV and a risk-averse donor fully hedges.
- A future price-impact friction (linear `alpha`/`lambda`, or a sqrt option) would raise the average NO price above `1 - m`, making the hedge cost positive and growing with `H`. The optimal hedge for a risk-averse donor would then be partial, with the full hedge `H* = V*(1 - m)` rarely worthwhile at large `V`. Cost vs `H` could be plotted for both forms.
- A future "signal cost" (the market reprices against the donor because the hedge is observed) would be a nuisance parameter that also lowers effective `effect_size` or credibility. This is a second-order effect that is not modelled.
- Execution over time (multi-day TWAP) would reduce temporary impact but lengthen exposure to signaling and news; the current model is static and one-shot.
