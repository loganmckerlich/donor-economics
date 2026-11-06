# 04 Political Donation Economics and Law

## US federal contribution limits (2025-2026 cycle) [Established]
Source: FEC limits summarized by [Perkins Coie](https://perkinscoie.com/insights/update/federal-election-contribution-limits-increase-2025-2026) and [Brownstein](https://www.bhfs.com/insight/fec-releases-2025-2026-election-cycle-contribution-limits/).
| Recipient | Individual limit |
|---|---|
| Candidate committee | $3,500 per election (primary and general separate), up from $3,300 |
| National party committee | $44,300 per year (plus $132,900 per year for each special account) |
| Other PACs (non-super) | $5,000 per year |
| Super PAC / independent-expenditure-only | No limit |
Limits are indexed every two years; the 2027-28 cycle limits will differ. Limit table retrieved 2026-11-05.

Implication: a $50M donation to A's candidate committee is impossible; it must flow through uncapped vehicles.

## Uncapped channels
- **Super PACs** (after *SpeechNow v. FEC*, 2010 and *Citizens United*, 2010): unlimited contributions from individuals and corporations; must disclose donors to FEC; may spend unlimited independent expenditures. [Established]
- **501(c)(4) "dark money"** social-welfare groups: donors generally not publicly disclosed; politics must not be the "primary purpose" (IRS test, loosely applied). Can fund issue ads and sometimes transfer to super PACs. [Established; details of enforcement contested.]
- **Coordination rules:** independent expenditures may not be coordinated with the candidate/campaign (FEC 11 CFR 109.20-109.21); coordination turns spending into an in-kind contribution subject to limits. In 2024 the FEC and courts debated "soft" coordination via shared vendors/ads. [Established as rule; boundary cases contested.]
- State and local limits vary. Not researched.

## Does money move votes? Evidence
| Study | Finding | Caveat |
|---|---|---|
| Levitt 1994, JPE: repeat challengers, House | Spending has very small effect on vote share | House only, fixed-pair design; [JPE record](https://econpapers.repec.org/RePEc:ucp:jpolec:v:102:y:1994:i:4:p:777-98) |
| Gerber 1998, APSR: IV for Senate | Marginal effects of incumbent and challenger spend about equal; average incumbent spending advantage about +6 points of vote share | IV strength and instrument validity argued |
| Sides & Vavreck on 2012 presidential ads | Doubling ads shifts polls ~1 point, short-lived | Secondary summary; paper not checked |
| Ansolabehere, de Figueiredo, Snyder 2003, JEP | Contributions are mostly consumption/participation, not policy purchase; little link between money and roll-call votes after controls | [NBER](https://www.nber.org/papers/w9409) |
| Bonica (various) | Donor networks and ideology scaling (DIME database) | [Unverified]: not retrieved in this research; check bonica.stanford.edu |
| Stratmann | Contributions and legislator votes, event-study evidence of some effect | [Unverified]: not retrieved |
Consensus read: marginal dollars have diminishing, small average effects, most are well-spent only when they change *information* (ads in low-information races). Effects are larger in primaries, open seats, and low-salience contests. [Contested; literature strongly depends on identification.]

## Return on political investment, rent-seeking
- Tullock-style "rent-seeking" says the payoff of special favors can be large relative to cost; empirical estimates of returns on lobbying/donations are wide-ranging. Famous example: Alexander, Mazza, Scholz 2009 on the 2004 American Jobs Creation Act, a repatriation tax holiday, found about $220 returns per $1 of lobbying (not donations). [Unverified: recalled, not retrieved; check before citing.]
- Ansolabehere et al. puzzle: returns look enormous relative to the (small) spending, which suggests the market for favors is *inefficient or not really for sale*. [Contested]
- A donor's `V` ($100M in the example) should be a *probability-weighted, discounted* policy value, not a point estimate.

## Implications for this project
- `donation_scale` and `max_win_prob - base_win_prob` need calibration to the literature: realistic marginal effects are likely a few points of win probability at best, even for $50M in a competitive race (an assumption; see Gerber's +6 vote-share points for a full-cycle spending *advantage*, which is not the same as a win-probability change).
- Check marginal effect near `D=50M`: derivative `dp/dD = (max-base)/scale * exp(-D/scale)` = 0.15/100M * 0.61 ~ 0.09 pp per $1M. Compare with `V*dp/dD` = $0.09M benefit per $1M donated: the model implies donation ROI of ~9% in EV terms (before hedging).
- Include `V` uncertainty, and the fact that some donation benefit comes with prob. regardless of win/loss (access, goodwill).
- Model legal channel: donation must be via super PAC or c4 (no caps), which reduces control and effectiveness (no coordination).
