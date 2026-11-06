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

## Uncapped channels (outside the current model's scope)
The current model treats the donation `D` as any dollar amount that moves `p(D)`; it does not model the legal channel or its loss of control.
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
The donation effect is the crux of the current model: whether donating pays is `donation_ev(s, D) = (p(D) - p(0))*V - D`, independent of any hedge.
- `effect_size` (`k`), `effect_scale` (`s`) and `effect_form` (`"log"`, `"linear"`, `"saturating"`) need calibration to the literature. The log form `p(D) = min(p0 + k*ln(1 + D/s), 0.999)` is consistent with the diminishing-returns findings above; the other forms are for sensitivity. Realistic marginal effects are likely a few points of win probability at best, even for $50M in a competitive race (an assumption; see Gerber's +6 vote-share points for a full-cycle spending *advantage*, which is not the same as a win-probability change). The default `k = 0.015`, `s = $10M` gives about +2.7 points at $50M and is an unverified placeholder.
- Check the marginal effect near `D = $50M` with defaults (`V = $100M`, `p0 = 0.45`): `dp/dD = k/(s + D) = 0.015/60M`, about 0.025 percentage points per $1M donated. The marginal benefit is `V*dp/dD` = $25k per $1M donated, a marginal return of about 2.5% of the dollar spent (a loss of about 97.5% per marginal dollar).
- On average: `p(50M) = 0.4769`, so the donation adds `(0.4769 - 0.45)*$100M` = $2.69M of expected payoff for $50M spent (about 5.4% average return). `donation_ev` at $50M is about -$47.3M, and `optimal_donation` is $0. This replaces an earlier "~9% ROI" estimate that depended on removed parameters (`max_win_prob`, `donation_scale`) and is no longer valid.
- Hence with literature-sized effects the donation is negative-EV against not donating, and the hedge (zero-EV, see file 01) can only remove variance around that loss. A donation only pays if the effect is much larger than the literature suggests; `effect_size` is the parameter to sweep.
- `V` should be a probability-weighted, discounted policy value; `V` uncertainty is a sensitivity dimension. The model has no outcome-independent benefit from donating (access, goodwill; extension): such a benefit would raise `donation_ev` and reduce the need to hedge.
- Legal channel (extension): a donation must go via a super PAC or c4 (no caps), which reduces control and effectiveness (no coordination). A future model could lower `effect_size` to reflect this.
