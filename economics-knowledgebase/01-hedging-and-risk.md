# 01 Hedging and Risk

Model scope: this note is mostly **in the model** (payoffs, full hedge, risk aversion). Cost-of-hedging items are **outside the current model's scope** (possible extensions).

## Core ideas [Established]
- A hedge is a position negatively correlated with an existing exposure. Donor exposure: gains `V` (`payoff_if_win`) if A wins, loses the donation `D` regardless.
- For a binary event with NO price `c` and fair probability `p`: buying `H` dollars of NO gives `H/c` shares paying $1 if A loses. EV of the bet at fair price = `(1-p)*H/c - H = H*((1-p)/c - 1)`; zero when `c = 1-p`.
- **Why hedge at zero EV:** variance reduction has value to a risk-averse agent. The model uses CARA utility `u(x) = -exp(-a x)` (`risk_aversion` = `a`, in 1/$; `a = 0` is risk-neutral). For a two-point gamble the certainty equivalent is `CE = -ln(E[exp(-a x)]) / a`, approximately `EV - (a/2) Var` for small `a`. Cutting variance at zero EV cost raises CE. `a` is roughly `gamma / wealth` for a CRRA investor with coefficient `gamma`.
- **Why a billionaire hedges at all:** a risk-neutral agent would not (the model's default `a = 0` is indifferent). Reasons that could justify a positive `a`: concave utility over a *specific* objective (e.g. a company's survival, a concentrated holding), liquidity needs, agency/stakeholder constraints, or the payoff `V` being a lumpy, non-diversifiable policy outcome. For very wealthy individuals, log-wealth risk aversion implies small relative stakes (`V` and `D` are tiny vs. net worth) are near risk-neutral, i.e. a small `a`. This is the central tension for the project. [Established as theory; applicability to the donor is an assumption.]

## Payoffs and the full hedge (in the model)
The market is efficient and reprices for the donation, so the YES price is `m = p(D)` and the hedge buys NO at `1 - m`. With `H` dollars on NO (`H/(1-m)` shares):
- A wins: `V - D - H`
- A loses: `-D + H*m/(1 - m)`

Zero-variance (full) hedge: set `V - H = H*m/(1-m)`, which gives `H* = V*(1 - m)` (`full_hedge_size`). With `m = 0.55` and `V = $100M`, `H* = $45M`. At the default scenario and `D = $50M`, `m = 0.527` and `H* = $47.3M`, a little less than the donation. Both outcomes then pay `m*V - D` (here +$2.7M).
- Std of the hedged payoff falls linearly in the hedge fraction: a partial hedge of fraction `h = H/H*` leaves std `(1-h)` times the unhedged std (default: $49.9M unhedged, $23.5M at `H = $25M`, $0 at full).
- Because the hedge is priced fairly (`1 - m` equals the true chance of A losing) and the model has no frictions, **EV is identical for every `H`**. A risk-neutral donor is indifferent; any risk-averse donor (`a > 0`) maximises CE at `H*` (`optimal_hedge`), for every `a`. How much it is worth depends on `a`: with `a = 4e-10` (about `gamma = 2`, wealth $5B) the CE gain from fully hedging the default $50M donation is only about $0.5M.

## Cost of hedging (outside the current model's scope)
In the real world `cost ~ fee + half-spread + impact + (true p - market p) * shares`. The current model sets the fee, spread and impact terms to zero and assumes the market price equals the true probability given the donation, so the hedge is exactly zero-EV. Earlier versions of the model had fee, slippage and mispricing terms (since removed); they remain a list of possible extensions. If added, each would make the hedge cost positive and make the optimal hedge partial rather than full, and `full_hedge_size` would need to be compared against depth and position limits.

## Hedging an outcome you influence
- Moral-hazard flavor: a perfect hedge removes the donor's payoff-based incentive to give. In the model, however, the donation decision is hedge-independent: `donation_ev(s, D) = (p(D) - p(0))*V - D` does not depend on `H` because the fair hedge is zero-EV, so the optimal `D` does not change with hedge size. (A friction or a market that does not reprice would break this.) [Standard theory; no empirical source cited.]
- The model has the market repricing for the donation (`m = p(D)`), so the donation does not create an edge against the market. If the market did *not* reprice (a possible extension), a donation that raised true `p` above the market's `m` would make the NO bet lose EV of `(p_true - m)` per NO share, and hedging would look costlier.

## Implications for this project
- Risk aversion (`risk_aversion`) is implemented. With it at 0 the hedge is irrelevant; with `a > 0` the answer is always the full hedge `H*`. The informative question is the *size* of the CE gain (via `evaluate(...).certainty_equivalent`), not whether to hedge.
- `H*` is exposed as `full_hedge_size`. In a future model with depth or position limits, compare `H*` to them: if `H*` exceeds what can be filled, a partial hedge is the only real option.
- The interesting decision is the donation (`donation_ev`, `optimal_donation`), which is independent of the hedge in the current model. Frictions are the extension that would make `D` and `H` a joint decision.
