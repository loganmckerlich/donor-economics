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
| Price impact | Move in price caused by your order |
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
| Certainty equivalent | Sure amount with the same utility as a gamble |
| Full hedge | Position making payoff identical in both states |
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
Keep a `sources.md`-style link per parameter default in code comments; mark defaults `unverified` until checked.
