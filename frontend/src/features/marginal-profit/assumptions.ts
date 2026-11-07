import type { AssumptionsContent } from "@/components/AssumptionsPanel";

/**
 * Plain-language statements of what the Marginal Profit model assumes, each with a worked example.
 * Examples use the default scenario and were computed with the Python model. Keep in sync with the
 * README and `src/donor_economics/marginal_profit.py`.
 */
export const ASSUMPTIONS_CONTENT: AssumptionsContent = {
  note:
    "Examples use the default scenario: a $10M donation, $100M of YES bought at 50%, a 2.7-point boost from $50M (about 1 point from $10M), sold after 3 months. The market's half-life and belief are illustrative placeholders, not measured from real markets: treat the results as showing how the pieces interact, not as a forecast.",
  assumptions: [
    {
      title: "One buy, one sell",
      statement: "The donor buys YES once, donates, and sells once. There is no scaling in, trimming or re-entering.",
      example:
        "$100M of YES is bought up front and all sold after 3 months. The model cannot sell half early because the price jumped, or add more after a poll.",
    },
    {
      title: "The donation moves the price, slowly",
      statement:
        "The price heads toward a new level set by the donation. Each half-life, half of the remaining gap closes (exponential catch-up).",
      example:
        "A $10M donation lifts the true win chance from 50% to about 51%. With a 1-month half-life, 87.5% of that has shown up after 3 months, so the price is up about 0.9 points.",
    },
    {
      title: "The donor buys before anyone reacts",
      statement:
        "YES is bought at the pre-donation price. Nobody else trades on the donation, and nobody anticipates it, before the donor's order fills.",
      example:
        "The donor pays 50¢ per share. If traders had already seen the donation coming, the price would start higher and most of the profit would be gone. The donor can only be first because they control the donation, which is the pattern that market-manipulation rules look for.",
    },
    {
      title: "The market ends up pricing a share of the true effect",
      statement:
        "The market's eventual price is the starting price plus a fixed share (belief) of the donation's true boost. 100% means it agrees with the model.",
      example:
        "At 100% belief the price heads to 51.0%. At 40% it heads to 50.4%, and the position cannot earn back the donation however long it is held.",
    },
    {
      title: "Nothing else moves the price",
      statement: "No other news, drift, volatility or mean reversion. The price path is a smooth curve driven only by the donation.",
      example:
        "In real markets the price can swing several points over 3 months for reasons unrelated to the donation. The model has no such noise, so it shows one expected result, not a spread.",
    },
    {
      title: "No frictions",
      statement:
        "Orders fill at the quoted price at any size. There are no fees, no spread, no price impact and no cost of tying up cash. So profit is a straight line in the size of the position.",
      example:
        "$100M of YES buys 200M contracts at exactly 50¢ and sells at the quote. $1B just buys ten times as many and earns ten times as much, however large that is for the market.",
    },
    {
      title: "The donation is sunk and acts at once",
      statement: "The donation is spent in full whatever happens, and starts working the moment it is made.",
      example:
        "The $10M is gone either way. The trade must clear it: the price needs to rise 5 points to earn it back on $100M of YES, and it only moves about 0.9.",
    },
    {
      title: "Expected profit only",
      statement:
        "The donor judges the plan by its profit compared with doing nothing, ignoring risk. The contract stays open throughout, so there is no election result to worry about.",
      example:
        "Doing nothing earns $0. The default plan earns about −$8.2M: +$1.8M of price gain (200M contracts times 0.9 points) and −$10M for the donation.",
    },
  ],
  leftOut: [
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
        "A 1% cost on each side of a $100M round trip is about $2M, and 5% a year on $100M for 3 months is about $1.25M. Together they would cut the default's price gain of $1.8M to below zero.",
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
        "The default shows a loss of about $8.2M, but the Fast market preset shows about +$32M. In real life that profit would be exposed to enforcement, voided trades, venue bans and a press story of a donor who bought YES and then funded the candidate. Whether a donation counts as manipulation is untested, so none of this is advice.",
    },
    {
      title: "Position and liquidity limits",
      statement:
        "Real venues cap position sizes, and depth is not a single number: it varies with the price, the time of day and the news.",
      example: "A $1B YES position is far larger than most political prediction markets can take.",
    },
    {
      title: "The election itself",
      statement: "The position is sold before the election. Holding to the vote, and hedging, is the other page.",
      example: "If the market takes longer than the election to react, the model cannot represent it.",
    },
  ],
  depends: [
    {
      result: "Any profit shown is conditional on the strategy being legal",
      rests: "Nothing in the model: it has no legal cost, no venue rules and no enforcement risk.",
      breaks: "If the donor-then-trade pattern counts as manipulation or use of non-public information, the profit is a liability, not an income.",
    },
    {
      result: "The whole strategy needs the market to lag",
      rests: "Assumptions 2 and 3: the price moves after the donor has bought, and slowly.",
      breaks: "If traders anticipate the donation, the entry price already includes it and the profit vanishes.",
    },
    {
      result: "Any trade size pays if one does, and waiting never hurts",
      rests: "Assumption 6: no price impact, fees or cost of cash.",
      breaks:
        "With price impact, a big enough trade loses on the way in and out. With a cost of cash, a long hold costs money, so there would be a best time to sell.",
    },
    {
      result: "The donation must earn itself back",
      rests: "Assumption 7: the donation is sunk, and the gain is the price move times the shares you hold.",
      breaks: "A stronger effect, a bigger position or a market that over-reacts all raise the gain against a fixed donation.",
    },
    {
      result: "There is a best donation",
      rests: "The donation effect curve flattens as the donation grows, while the cost is one-for-one.",
      breaks:
        "A donation only pays if its first dollar returns more than $1: the position size, belief and the share of the move captured all raise that, and a stronger effect curve does too.",
    },
  ],
};
