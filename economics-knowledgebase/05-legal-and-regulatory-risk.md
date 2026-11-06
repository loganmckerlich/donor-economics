# 05 Legal and Regulatory Risk

**Not legal advice.** **Outside the current model's scope:** the model assumes the donation and hedge are legal and feasible, with no platform risk, taxes or reputation cost. This note is background for possible extensions. The area is moving quickly. Items marked [Unverified] come from a single or secondary source. A real project would need securities/commodities and election-law counsel.

## Federal framework
- Event contracts on US venues are regulated by the CFTC under the Commodity Exchange Act. Kalshi is a registered DCM; Polymarket US (QCX LLC) is a DCM since Dec 2025 rollout. [Established, see file 02.]
- **Kalshi v. CFTC (election contracts):** In Sept 2024 Judge Jia Cobb (D.D.C.) held the CFTC could not block Kalshi's congressional election contracts; the D.C. Circuit refused a stay in Oct 2024; the CFTC later moved to drop its appeal. Sources: [The Block](https://www.theblock.co/post/319206/federal-court-clears-kalshi-to-list-election-betting-contracts-denies-cftcs-motion), [iGaming Business](https://igamingbusiness.com/gaming/online-casino/kalshi-cftc-election-betting-stay-lifted/). Exact dismissal date [Unverified].
- **Rulemaking (2026):** CFTC ANPRM on prediction markets (Mar 12, 2026; comments closed Apr 30); proposed rule on reviewing certain event contracts (June 10, 2026; comments due Jul 27); proposed shift of fully collateralized event contracts to a futures-style reporting regime (June 25, 2026). Sources: [WilmerHale](https://www.wilmerhale.com/en/insights/client-alerts/20260618-10-takeaways-from-the-cftc-event-contracts-proposed-rulemaking), [CFTC release](https://www.cftc.gov/PressRoom/PressReleases/9249-26). No final rule found. Political contracts are a CEA 5c(c)(5)(C) "public interest" issue in principle, so reversal risk is not zero.

## State preemption litigation (mostly sports contracts)
- Third Circuit (NJ), April 2026: 2-1 for Kalshi on preemption; dissent by Judge Roth; NJ sought Supreme Court review. Ninth Circuit (Nevada) reportedly ruled against Kalshi Aug 28, 2026 [single-source, Unverified]; Fourth, Sixth, Second Circuits pending. Source: litigation trackers ([defirate](https://defirate.com/prediction-markets/legal/?case=kalshi-v-assad), [JD Supra](https://www.jdsupra.com/legalnews/prediction-markets-v-state-gaming-laws-3592242/)). A circuit split makes Supreme Court review plausible. Relevance to election contracts is indirect but access risk is real (state-by-state geofencing).

## Insider trading and manipulation
- CFTC Enforcement Division advisory (Feb 2026) and Director David Miller's March 31, 2026 remarks: insider-trading law applies on prediction markets ("myth" that it does not); misuse of material non-public information is a priority. Sources: [Skadden](https://www.skadden.com/insights/publications/2026/04/cftc-enforcement-director-discusses-top-priorities), [Clifford Chance](https://www.cliffordchance.com/briefings/2026/04/cftc-enforcement-director-outlines-enforcement-priorities-addresses-prediction-market-insider-trading-and-previews-a-forthcoming-cooperation-advisory.html). Bipartisan bill on officials' trading proposed 2026.
- **Candidates:** Kalshi's rulebook bans trading by candidates and affiliated staff on their own races; it fined/suspended several candidates in April 2026 (reports say 3 to 6; [PBS](https://www.pbs.org/newshour/politics/kalshi-fines-and-suspends-3-congressional-candidates-for-betting-on-their-own-elections)). A *donor* is not a candidate, but if a donor has non-public info about A's campaign (internal polls, strategy, coordination) a bet on that info is a MNPI risk. Whether a major donor counts as an "insider" under venue rules: [Unverified]/ambiguous. Anti-manipulation (CEA 6(c)(1), CFTC Rule 180.1) covers trading intended to move a price.
- **Election law interplay:** betting profits as a payoff tied to a candidate's loss are not "contributions"; but if the hedge were arranged with the campaign or used to fund it, treat with extreme caution. [Unverified: no authority located.]

## Position limits and disclosure
- Kalshi election-market rule text reported at $7M per strike per member; $100M for ECPs ([Bonus.com](https://www.bonus.com/news/fact-check-can-kalshi-users-really-wager-up-to-100-million-on-the-election/), 2024). Current value [Unverified]. CFTC large trader reporting applies to DCM positions above thresholds.
- Donations to super PACs are publicly disclosed; hedge positions on a DCM are not public, but onchain Polymarket wallets are public (offshore).
- Tax: prediction-market gains/losses treatment (gambling vs Section 1256 vs capital) is unsettled. [Unverified]. A hedge could make the political donation non-deductible regardless (donations are not deductible).

## Reputational risk
Public disclosure of "donor funded A and bet against A" could damage credibility with the candidate, voters, and donor peers; it also invites press framing as manipulation. Not quantifiable from sources; treat as a scenario cost.

## Implications for this project
Legality, platform risk, taxes and reputation are all assumed away in the current model (static, one binary contract, `D` and `H` always allowed). The hedge's economics (zero-EV, full hedge optimal for any risk-averse donor) are therefore conditional on legal clearance.
- A future feasibility layer (venue available, KYC, jurisdiction) would be a binary switch on whether any hedge `H > 0` is allowed.
- A future position-limit cap `H_max` would make the hedge `min(H, H_max)`; if `H_max < full_hedge_size` (the default full hedge is about $52M) only a partial hedge is possible and variance cannot be fully removed.
- A "legal/reputation cost" scalar and a probability-of-regulatory-action scenario would enter as a positive hedge cost (lower EV and CE), so a risk-averse donor would hedge less than fully.
- Output should state hedge viability is conditional on legal clearance; do not model evasion (multi-account splitting to avoid limits is likely a terms violation).
