# 03 Market Microstructure and Price Impact

## Components of execution cost [Established]
- **Spread:** best ask minus best bid; a taker pays half the spread.
- **Slippage:** walking the book; avg price above best ask for a large order.
- **Price impact:** how the order moves the price (temporary vs permanent).
- **Fees:** see file 02.

## Impact models
| Model | Form | Notes |
|---|---|---|
| Linear (Kyle 1985) | `Δp = λ * Q` | Equilibrium with informed trader and noise traders; what `model.py` uses. Avg price = `c0 + H/(2*depth)`. |
| Square-root | `Δp ~ σ * sqrt(Q / V_daily)` | Widely reported empirical law in equities/futures (Almgren et al. 2005, Tóth et al. 2011, Bouchaud). Concave: cost grows slower than linear at large sizes. |
| Order-book walk | Sum over actual levels | Best for a single known snapshot; needs data. |

- In prediction markets, price is bounded in [0,1]; impact near extremes is naturally compressed, and in the model a `0.999` cap is used.
- Whether sqrt-law holds in prediction markets is [Unverified]; no empirical study located. Treat linear and sqrt as sensitivity bounds.

## Linear-model intuition for the project
Spend `H`, depth `L`: avg price `c0 + H/(2L)`; final marginal price `c0 + H/L`. With `L = 20M`, `H = 25M`: marginal price rises 1.25, i.e. cap binds; the model's own `0.999` cap kicks in. In practice a hedge this large cannot be done in one clip at one price. [Derived from model.py.]

## Signaling and information leakage
- A large bet on NO against a *known* funded candidate is itself news: others may infer that the donor thinks A is weak, or that the donation will not be enough. Price can move before the order completes (front-running by bots; whale-watching).
- Evidence: Polymarket whale "Theo4" moved odds visibly on large trades in Oct 2024 ([CoinDesk via search results](https://hotfix.coindesk.com/markets/2024/10/23/trump-polymarket-odds-briefly-dip-after-his-no-2-bull-adds-bet-on-harris)). Onchain venues expose wallets; clustering can deanonymize large traders (Chainalysis traced whale accounts).
- Mitigation: slice orders (TWAP), use multiple venues, resting limit orders (maker, lower fee), but anonymity via multiple accounts can breach KYC/terms (see file 05).

## Manipulation concerns
- Large trades could be used to move the market price to influence perceived momentum ("bandwagon" fears). The literature (Hanson & Oprea 2009, "A Manipulator Can Aid Prediction Market Accuracy") argues manipulators can *improve* accuracy by subsidising informed traders; but regulators view it differently. A donor who funds a candidate and also trades the market has an apparent manipulation incentive. [Contested]
- 2024: some argued Polymarket whales skewed odds toward Trump ([DL News](https://dlnews.com/articles/defi/4-crypto-whales-are-skewing-trump-polymarket-election-bet/)); results of whether this affected votes are [Unverified/likely small].

## Implications for this project
- Parameterize impact with `alpha` (linear) or sqrt option; plot cost vs `H` for both.
- Add "signal cost": probability the market reprices *against* the donor's other goals because the hedge is observed (e.g. reduced donation credibility). Quantify as a nuisance parameter.
- Model execution over time: multi-day TWAP reduces temporary impact but lengthens exposure to signaling and news.
- `max_win_prob` effect of the hedge being public (perception of the donor's loyalty) is a real second-order effect and not modelled.
