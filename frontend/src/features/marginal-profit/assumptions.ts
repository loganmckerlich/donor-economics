import type { AssumptionsContent } from "@/components/AssumptionsPanel";

/**
 * Plain-language statements of what the Marginal Profit model assumes, each with a worked example.
 * Examples use the default scenario and were computed with the Python model. Keep in sync with the
 * README and `src/donor_economics/marginal_profit.py`.
 */
export const ASSUMPTIONS_CONTENT: AssumptionsContent = {
  note:
    "Examples use the Literature-sized effect scenario (a preset; the page opens on a friendlier one): a $10M donation, $100M of YES bought at 50%, a $100M payoff if the candidate wins, a 2.7-point boost from $50M (about 1 point from $10M), and a price that captures all of that boost. The capture share is an illustrative placeholder, not measured from real markets: treat the results as showing how the pieces interact, not as a forecast.",
  assumptions: [
    {
      title: "One buy, one sell, before the election",
      statement:
        "The donor buys YES once, donates, and sells once, before the election resolves. There is no scaling in, trimming or re-entering.",
      example:
        "$100M of YES is bought at 50¢ (200M contracts) and all sold at the new price. The model cannot sell half early because the price jumped, or hold some to the vote.",
    },
    {
      title: "The donation raises the true win probability",
      statement:
        "Donated dollars raise the candidate's win probability along a curve that flattens as the donation grows. Log by default.",
      example: "A $10M donation lifts the true win chance from 50% to about 51.0% (1.04 points).",
    },
    {
      title: "The donor buys before anyone reacts",
      statement:
        "YES is bought at the pre-donation price. Nobody else trades on the donation, and nobody anticipates it, before the donor's order fills.",
      example:
        "The donor pays 50¢ per share. If traders had already seen the donation coming, the price would start higher and most of the profit would be gone. The donor can only be first because they control the donation, which is the pattern that market-manipulation rules look for.",
    },
    {
      title: "The price captures a set share of the boost",
      statement:
        "By the time the donor sells, the price has moved a fixed share of the way to the true win probability. 100% means it has fully caught up, 50% half, 0% means the market ignored the donation, above 100% means it over-reacted, and below 0% means the price fell back. This one number stands in for both how much the market believes the donation and how long the donor waits.",
      example:
        "At 100% the price goes from 50% to 51.0%. At 50% it goes to 50.5%. At 0% it stays at 50%, and the trade earns nothing. At −50% it falls to 49.5% and the trade loses money.",
    },
    {
      title: "Nothing else moves the price",
      statement: "No other news, drift, volatility or mean reversion. The price moves only because of the donation.",
      example:
        "In real markets the price can swing several points for reasons unrelated to the donation. The model has no such noise, so it shows one result for each capture share, not a spread.",
    },
    {
      title: "No frictions",
      statement:
        "Orders fill at the quoted price at any size. There are no fees, no spread, no price impact and no cost of tying up cash. So the trade profit is a straight line in the size of the position.",
      example:
        "$100M of YES buys 200M contracts at exactly 50¢ and sells at the new price. $1B just buys ten times as many and earns ten times as much, however large that is for the market.",
    },
    {
      title: "The trade profit is the same whether the candidate wins or loses",
      statement:
        "Because the YES is sold before the election, the trade profit does not depend on the result. It is added to both outcomes. The payoff if the candidate wins, V, is a separate bet the donor already had.",
      example:
        "The trade earns $2.1M either way. If the candidate loses the donor ends at −$10M + $2.1M = −$7.9M; if they win, $100M − $10M + $2.1M = +$92.1M. The gap between the two is still V = $100M.",
    },
    {
      title: "The donation is sunk and acts at once",
      statement: "The donation is spent in full whatever happens, and starts working the moment it is made.",
      example:
        "The $10M is gone either way. The trade has to earn it back: the price would need to rise 5 points on $100M of YES to cover it, and it only moves about 1.",
    },
    {
      title: "Expected value uses the true probability",
      statement:
        "The expected gain from winning is V times the rise in the true win probability, as on the Full Hedge page. The donor judges the plan by its expected gain compared with doing nothing, ignoring risk.",
      example:
        "Doing nothing earns $0. The default plan's expected gain is about −$6.9M: −$7.9M from the trade net of the donation, plus $1.0M from the higher win chance ($100M × 1.04 points).",
    },
  ],
  leftOut: [
    {
      title: "How certain the market's reaction is",
      statement:
        "The model takes the share of the boost the price captures as known. In reality that is where all the risk in this trade sits: the election result does not change the trade profit, but the market's reaction does. The page shows three fixed responses side by side, with no probabilities.",
      example:
        "If the market ignores the donation, the trade earns $0 and the donor is out the $10M donation. If it over-reacts, the trade earns more. The model cannot say how likely each is.",
    },
    {
      title: "Price impact and market depth",
      statement:
        "Buying moves the price against you and selling does too, so big orders fill at worse prices. The model fills any order at the quote.",
      example:
        "A $1B buy in a market that moves a point per $100M would push the price up several points before it filled. The model ignores that, which is why the profit grows without limit as the position grows.",
    },
    {
      title: "Fees, spread and the cost of tied-up cash",
      statement:
        "Real trades pay fees and the bid-ask spread on both the buy and the sell, and the money in YES could have earned something elsewhere while it was held.",
      example:
        "A 1% cost on each side of a $100M round trip is about $2M, which is as large as the default's $2.1M trade profit.",
    },
    {
      title: "Other traders",
      statement:
        "Other traders may front-run the donor's visible buying, or move the price before the donation is disclosed. The model has a single trader.",
      example:
        "If a $100M YES order lifts the price before the donation lands, the later move is smaller. A market that watches large wallets may react to the buying, not the donation.",
    },
    {
      title: "A market that already expects it",
      statement:
        "An efficient market prices in a donation as soon as it is likely. The strategy only works if the market is slow, which is the very thing assumed.",
      example:
        "A donation announced weeks in advance would already be in the price, leaving nothing to profit from.",
    },
    {
      title: "Legal and regulatory risk, possibly disqualifying",
      statement:
        "Building a position and then taking an action you control that is expected to move its price is the textbook pattern behind market-manipulation and non-public-information rules. The profit here comes only from that move. The model has no legal cost and no chance of being stopped.",
      example:
        "The Strong effect preset shows the donor $31.9M ahead even if the candidate loses. In real life that profit would be exposed to enforcement, voided trades, venue bans and a press story of a donor who bought YES and then funded the candidate. Whether a donation counts as manipulation is untested, so none of this is advice.",
    },
    {
      title: "Position and liquidity limits",
      statement:
        "Real venues cap position sizes, and depth is not a single number: it varies with the price, the time of day and the news.",
      example: "A $1B YES position is far larger than most political prediction markets can take.",
    },
    {
      title: "Holding to the election, and hedging",
      statement: "The position is sold before the election. Holding to the vote, and hedging, is the other page.",
      example: "Holding the YES instead would turn the trade into a bet on the candidate winning, which raises the election risk rather than removing it.",
    },
  ],
  depends: [
    {
      result: "Any profit shown is conditional on the strategy being legal",
      rests: "Nothing in the model: it has no legal cost, no venue rules and no enforcement risk.",
      breaks: "If the donor-then-trade pattern counts as manipulation or use of non-public information, the profit is a liability, not an income.",
    },
    {
      result: "The trade only profits if the price follows the donation",
      rests: "Assumptions 3 and 4: the donor buys first, and the price captures a share of the boost.",
      breaks:
        "If traders anticipate the donation, or the market ignores it (capture 0%), the trade earns nothing and the result is the donation alone. If the price falls back instead, the trade loses money too.",
    },
    {
      result: "The trade profit is the same if the candidate wins or loses",
      rests: "Assumptions 1 and 7: the YES is sold before the election, so its result does not depend on the vote.",
      breaks:
        "If the donor held the YES to the election, the position would pay $1 or $0, which is a bet on the candidate winning.",
    },
    {
      result: "Any trade size pays if one does",
      rests: "Assumption 6: no price impact, fees or cost of cash.",
      breaks: "With price impact, a big enough trade loses on the way in and out, so there would be a best trade size.",
    },
    {
      result: "There is a best donation",
      rests: "The donation effect curve flattens as the donation grows, while the cost is one-for-one.",
      breaks:
        "A donation only pays if its first dollar returns more than $1. The win payoff, the position size and the share of the boost the price captures all raise that.",
    },
  ],
};
