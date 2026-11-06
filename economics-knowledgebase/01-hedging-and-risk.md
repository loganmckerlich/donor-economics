# 01 Hedging and Risk

## Core ideas [Established]
- A hedge is a position negatively correlated with an existing exposure. Donor exposure: gains `V` if A wins, loses `D` regardless.
- For a binary event with contract price `c` for the NO side and fair probability `p`: buying `H` dollars of NO gives `H/c` shares paying $1 if A loses. EV of the bet at fair price = `(1-p)*H/c - H = H*((1-p)/c - 1)`; zero when `c = 1-p`.
- **Why hedge at zero EV:** variance reduction has value to a risk-averse agent. Expected utility `E[U(W)] ~ E[W] - (lambda/2) Var(W)` (second-order approx.), so cutting variance at zero EV cost raises utility.
- **Why a billionaire hedges at all:** a risk-neutral agent would not. Reasons that could justify: concave utility over a *specific* objective (e.g. a company's survival, a concentrated holding), liquidity needs, agency/stakeholder constraints, or the payoff `V` being a lumpy, non-diversifiable policy outcome. For very wealthy individuals, log-wealth risk aversion implies small relative stakes (`V` and `D` are tiny vs. net worth) are near risk-neutral. This is the central tension for the project. [Established as theory; applicability to the donor is an assumption.]

## Full vs partial hedge
Payoffs in the model (fee-free, constant price `c`): win `V - D - H`; lose `-D + H/c - H`.
- Zero-variance hedge: `V - H = H/c - H` so `H* = c*V`. Pay `c*V` for NO shares worth `V` if A loses. With `c = 0.55`, `V = 100M`: `H* = 55M`, risking more than the donation.
- Variance of hedged payoff is `p(1-p)*(V - H/c)^2` (price constant), linear in the *unhedged residual*, so partial hedge of fraction `h` leaves std `(1-h)*std_unhedged`.
- Full hedge locks in `V*(1 - c) - D` (less costs) in both states: cost of certainty is the market's implied "edge" plus frictions.

## Cost of hedging
`cost ~ fee + half-spread + impact + (true p - market p) * shares` (the last term is a real EV loss/gain if the donor believes market mispricing). In the model, `hedge_cost_in_ev` captures fee, slippage and mispricing.

## Hedging an outcome you influence
- Moral-hazard flavor: a perfect hedge removes the donor's payoff-based incentive to give. A partial hedge keeps skin in the game. Optimal donation falls as hedge size rises (the hedge pays in the states where the donation failed). [Standard theory; no empirical source cited.]
- If donation raises `p` and the market does not reprice (model `market_tracks_donation=False`), the NO bet loses EV by `(p_true - p_mkt)` per share of NO. Hedging looks costlier.

## Implications for this project
- Add a risk-aversion parameter; without it, "optimal" hedge is trivially zero (EV only falls with costs).
- Report utility-equivalent (certainty-equivalent) cost, not just EV and std.
- Expose `H*` (full-hedge size, already `full_hedge_size`) and compare to depth: if `H*` exceeds depth, partial hedge is the only real option.
- Model donation and hedge as joint decisions (optimise `D` given `H`).
