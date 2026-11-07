import type { AssumptionsContent } from "@/components/AssumptionsPanel";

export const ASSUMPTIONS_CONTENT: AssumptionsContent = {
  note:
    "Examples use the default scenario: a $10M donation, $100M of YES bought at about 50%, a 2.7-point boost from $50M (about 1 point from $10M), sold after 3 months. The default market depth, fees, carry and half-life are illustrative placeholders, not measured from real markets: treat the results as showing how the pieces interact, not as a forecast.",
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
        "The donor pays about 50.25¢ per share. If traders had already seen the donation coming, the price would start higher and most of the profit would be gone. The donor can only be first because they control the donation, which is the pattern that market-manipulation rules look for.",
    },
    {
      title: "The market ends up pricing a share of the true effect",
      statement:
        "The market's eventual price is the starting price plus a fixed share (belief) of the donation's true boost. 100% means it agrees with the model.",
      example:
        "At 100% belief the price heads to 51.0%. At 40% it heads to 50.4%, and the position loses money however long it is held.",
    },
    {
      title: "Nothing else moves the price",
      statement: "No other news, drift, volatility or mean reversion. The price path is a smooth curve driven only by the donation.",
      example:
        "In real markets the price can swing several points over 3 months for reasons unrelated to the donation. The model has no such noise, so it shows one expected result, not a spread.",
    },
    {
      title: "Price impact is linear and the depth is fixed",
      statement:
        "Every dollar of orders moves the price by the same amount, in both directions. Each fill gets the average price over the move it causes.",
      example:
        "With $200M of depth per point, a $100M buy pushes the price up half a point and fills at an average of 50.25¢. Impact grows with order size, so cost grows with its square.",
    },
    {
      title: "Costs are flat rates",
      statement:
        "A fixed share of dollars traded is paid on each side, and the money in YES carries an annual opportunity cost for as long as it is held.",
      example:
        "At 1% per side, fees on the $100M round trip are about $2.0M. Carrying $100M for 3 months at 5% a year costs $1.25M.",
    },
    {
      title: "The donation is sunk and acts at once",
      statement: "The donation is spent in full whatever happens, and starts working the moment it is made.",
      example:
        "The $10M is gone either way. The trade must clear it: the price needs to rise about 7 points to cover the donation, fees, carry and slippage, and it only moves about 0.9.",
    },
    {
      title: "Expected profit only",
      statement:
        "The donor judges the plan by its profit compared with doing nothing, ignoring risk. The contract stays open throughout, so there is no election result to worry about.",
      example:
        "Doing nothing earns $0. The default plan earns about −$12.4M: −$10M donation, −$1.0M slippage, −$2.0M fees, −$1.25M carry, and +$1.8M price gain.",
    },
  ],
  leftOut: [
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
        "The default shows a −$12.4M loss, but the Deep market preset shows about +$31M. In real life that profit would be exposed to enforcement, voided trades, venue bans and a press story of a donor who bought YES and then funded the candidate. Whether a donation counts as manipulation is untested, so none of this is advice.",
    },
    {
      title: "Position and liquidity limits",
      statement:
        "Real venues cap position sizes, and depth is not a single number: it varies with the price, the time of day and the news.",
      example: "A $1B YES position is far larger than most political prediction markets can take.",
    },
    {
      title: "The election itself",
      statement: "The position is sold before the election. Holding to the vote, and hedging, is the other tab.",
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
      result: "There is a best time to sell",
      rests: "Assumptions 2 and 7: the price catches up with diminishing steps while carry accrues at a steady rate.",
      breaks: "With no carry, waiting never hurts. With a very fast market, selling right away is best.",
    },
    {
      result: "Bigger trades eventually lose",
      rests: "Assumption 6: price impact grows with order size.",
      breaks: "In a deeper market the best trade size grows. With unlimited depth it is only limited by the slider.",
    },
    {
      result: "The donation must earn itself back",
      rests: "Assumption 8: the donation is sunk, and the gain is the price move times the shares you hold.",
      breaks: "A stronger effect, a bigger position or a market that over-reacts all raise the gain against a fixed donation.",
    },
  ],
};
