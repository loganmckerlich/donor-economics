# 07 Glossary and Sources

## Glossary

| Term | Meaning |
|---|---|
| Binary contract | Pays $1 if event occurs, else $0 |
| YES/NO | The two sides of a binary market |
| CLOB | Central limit order book |
| Maker / taker | Provider of resting liquidity / order that crosses the spread |
| Spread | Best ask minus best bid |
| Slippage | Difference between expected and executed price |
| Price impact | Move in price caused by your order (assumed zero in the current model) |
| Kyle's lambda | Linear impact coefficient |
| DCM | Designated Contract Market (CFTC-registered exchange) |
| ECP | Eligible Contract Participant |
| MNPI | Material non-public information |
| Super PAC | Independent-expenditure-only committee; unlimited receipts |
| 501(c)(4) | Social-welfare nonprofit; donors generally undisclosed |
| Independent expenditure | Political spending not coordinated with a candidate |
| Favorite-longshot bias | Longshots overpriced, favorites underpriced relative to realised frequencies |
| Kelly criterion | Bet size maximising expected log wealth |
| CRRA / CARA | Constant relative / absolute risk aversion utility |
| Risk aversion γ (gamma) | How much the donor dislikes uncertain outcomes, on the CRRA-style scale the app exposes: 0 is risk-neutral (only the average matters, so hedging is pointless) and about 2 is a common benchmark. The model converts it to the CARA coefficient `a = γ / wealth` |
| Donor wealth | The donor's wealth, used only to turn γ into the dollar-based risk aversion `a = γ / wealth`; fixed at $5B by default. A wealthier donor is bothered less by a swing of tens of millions, so hedging is worth less to them |
| CARA coefficient `a` (`risk_aversion`) | Absolute risk aversion in 1/$ in `u(x) = -exp(-a x)`; `a = 0` is risk-neutral; roughly `gamma / wealth` for a CRRA investor |
| Certainty equivalent | Sure amount with the same utility as a gamble; for CARA, `-ln(E[exp(-a x)]) / a`, equal to EV when `a = 0` and lower than EV for risky payoffs when `a > 0` |
| Risk-free hedge (full hedge) | The amount bet on NO (candidate loses) that makes your profit identical whether the candidate wins or loses, so the outcome is certain |
| Risk-free hedge size `H*` (full hedge size) | `V*(1 - m)` dollars of NO, the spend that makes profit identical whether the candidate wins or loses; `full_hedge_size` in the model |
| Hedge (% of risk-free hedge) | The app's hedge slider: how much NO to buy as a share of the risk-free hedge. 0% is no hedge, 100% is the risk-free hedge, and above 100% over-hedges (you then do better if the candidate loses) |
| Value of hedging | The certainty-equivalent gain from the risk-free hedge, in sure dollars: how much a hedged donor would pay to avoid the risk. It is zero for a risk-neutral donor and grows with risk aversion |
| Zero-EV hedge | A hedge bought at a fair price with no frictions: it changes variance but not expected value, so any risk-averse donor fully hedges |
| Donation effect curve `p(D)` | Win probability as a function of donation; default `min(p0 + k*ln(1 + D/s), 0.999)`, with linear and saturating alternatives (`effect_form`) |
| Effect size `k` (`effect_size`) | Win-probability gain per unit of the curve (per `ln(1 + D/s)` for the log form); default 0.015, unverified. In the app k is not set directly but derived from the boost from a $50M donation |
| Boost from a $50M donation | How many points of win probability a $50M donation buys; the app's main effect input. The effect size k is derived from it: `k = boost / curve shape at $50M`, e.g. `boost / ln(1 + 50M/s)` for the log form. Default about 2.7 points |
| Effect scale `s` (`effect_scale`) | Dollar scale of the donation curve; default $10M |
| Base win probability `p0` (`base_win_prob`) | Probability A wins with no donation |
| Payoff if win `V` (`payoff_if_win`) | Amount the donor receives if and only if A wins |
| Efficient market repricing | The market is assumed to price in the donation, so the YES price is `m = p(D)` and the NO hedge costs `1 - m` per share; the donor has no edge |
| Donation EV (Expected gain from your donation) | `(p(D) - p(0))*V - D`: expected gain from donating relative to not donating (`donation_ev`), independent of the hedge in the model. "Expected gain from your donation" is the app's name for this same quantity |
| Best donation (optimal donation) | The donation that maximises expected profit compared with not donating (`optimal_donation`). $0 means donating does not pay at those assumptions |
| First-dollar return | Expected winnings from the first dollar donated, `V*k/s`, the same for every curve form. Donating only pays when it exceeds $1 |
| Break-even payoff | The payoff at which the first-dollar return reaches $1, `V = s/k`. With the default boost of 2.7 points and s = $10M (k about 0.0151) it is roughly $660M |
| Price impact (out of scope) | Move in price caused by your order; the model assumes the whole order fills at the quoted price, so impact, depth, fees and carry cost are possible extensions |
| Basis risk | Hedge instrument imperfectly matching exposure (e.g. a market resolving on a different event than the policy payoff) |

## Sources (retrieved 2026-11-05; headline claims only, see individual files)
Contribution limits
- https://perkinscoie.com/insights/update/federal-election-contribution-limits-increase-2025-2026
- https://www.bhfs.com/insight/fec-releases-2025-2026-election-cycle-contribution-limits/

Money and elections
- Levitt 1994, JPE: https://econpapers.repec.org/RePEc:ucp:jpolec:v:102:y:1994:i:4:p:777-98
- Gerber 1998, APSR (via search result only): https://next.sciencegate.app/document/10.2307/2585672
- Ansolabehere, de Figueiredo, Snyder 2003: https://www.nber.org/papers/w9409

Prediction markets
- Kalshi fee schedule: https://kalshi.com/docs/kalshi-fee-schedule.pdf
- Bürgi, Deng, Whelan, Makers and Takers: https://www2.gwu.edu/~forcpgm/2026-001.pdf
- Polymarket QCEX: https://www.theblock.co/post/363623/polymarket-plans-to-re-enter-us-with-acquisition-of-derivatives-exchange-qcex
- Polymarket US fees (third party): https://www.rivermarkets.com/insights/polymarket-us-fees.html
- 2024 whale: https://foxbusiness.com/media/election-bettor-whale-made-much-more-trump-win-than-originally-thought-analysis-shows
- 2026 midterm volume: https://cryptobriefing.com/kalshi-midterm-trading-volume-tops-1-billion/

Legal/regulatory
- https://www.theblock.co/post/319206/federal-court-clears-kalshi-to-list-election-betting-contracts-denies-cftcs-motion
- https://www.wilmerhale.com/en/insights/client-alerts/20260618-10-takeaways-from-the-cftc-event-contracts-proposed-rulemaking
- https://www.skadden.com/insights/publications/2026/04/cftc-enforcement-director-discusses-top-priorities
- https://www.pbs.org/newshour/politics/kalshi-fines-and-suspends-3-congressional-candidates-for-betting-on-their-own-elections
- https://www.bonus.com/news/fact-check-can-kalshi-users-really-wager-up-to-100-million-on-the-election/

## Reading list (not retrieved; from memory, verify citations)
- Wolfers and Zitzewitz (2004), "Prediction Markets", J. Economic Perspectives.
- Kyle (1985), "Continuous Auctions and Insider Trading", Econometrica.
- Almgren, Thum, Hauptmann, Li (2005), "Direct Estimation of Equity Market Impact", Risk.
- Hanson and Oprea (2009), "A Manipulator Can Aid Prediction Market Accuracy", Economica.
- Kelly (1956), "A New Interpretation of Information Rate".
- Thaler and Ziemba (1988), "Parimutuel betting markets", J. Economic Perspectives (favorite-longshot).
- Stratmann, Bonica (DIME database), Alexander-Mazza-Scholz (2009) on lobbying returns: confirm titles/years before citing.

## Open questions
- Real order book depth in a competitive race for NO side.
- Current Kalshi and Polymarket position limits and fee schedules.
- Whether a major donor is an "insider" under CFTC/venue rules.
- Status of Polymarket US main-exchange approval and the Ninth Circuit ruling.
- Tax treatment of prediction market gains.

## Implications for this project
Keep a `sources.md`-style link per parameter default in code comments; mark defaults `unverified` until checked. In particular, `effect_size = 0.015` and `effect_scale = $10M` are placeholders, and their calibration (file 04) drives the donation result. Open questions on depth, fees, position limits, insider status and taxes concern frictions that are outside the current model's scope; they would matter only if those frictions are added as extensions.
