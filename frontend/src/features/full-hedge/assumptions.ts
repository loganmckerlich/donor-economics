/**
 * Plain-language statements of what the model assumes, each with a worked example.
 * Examples use the default scenario (V = $100M, D = $50M, 50% starting win chance, a 2.7-point
 * boost from $50M, gamma = 2 on $5B) and were computed with the Python model. Keep in sync with
 * the "Modeling assumptions" section of the README.
 */
import type { Assumption, AssumptionsContent, Dependency } from "@/components/AssumptionsPanel";

const DEFAULT_SCENARIO_NOTE =
  "Examples use the default scenario: a $100M payoff, a $50M donation, a 50% starting win chance and a 2.7-point boost from a $50M donation.";

const ASSUMPTIONS: Assumption[] = [
  {
    title: "One shot, no timing",
    statement: "The donor makes one donation and one hedge, then the election resolves. Nothing changes in between.",
    example:
      "The donor gives $50M and buys NO once. The model cannot represent giving $20M now and $30M after a poll moves, or trimming the hedge as the odds shift.",
  },
  {
    title: "One yes/no market",
    statement: "There is a single binary contract: the candidate wins or loses.",
    example:
      "“Candidate A wins” pays $1 or nothing. A primary followed by a general election, a bet on the margin of victory, or a market on which party controls the Senate would each need a different model.",
  },
  {
    title: "The payoff comes only from winning",
    statement: "The donor receives V if the candidate wins and nothing if they lose. The donation is spent either way.",
    example:
      "With V = $100M and D = $50M, the donor nets +$50M if the candidate wins and −$50M if they lose. A donor who also gets a favourable meeting or ruling whatever the result would be better off in both cases, but the model has no such benefit.",
  },
  {
    title: "Unlimited capital, only money matters",
    statement: "The donor can always afford the donation and the hedge, and cares only about making money (adjusted for risk).",
    example:
      "Funding $50M plus a $47M hedge needs no borrowing or asset sales. A donor who also wants the candidate to win for its own sake would value a win at more than the $100M payoff.",
  },
  {
    title: "Risk aversion is adjustable",
    statement:
      "How much the donor dislikes uncertainty is the γ slider. The app starts at γ = 2 on $5B of wealth; the Advanced group sets wealth.",
    example:
      "Fully hedging the default $50M donation is worth about $0.5M in sure dollars at γ = 2, about $2.5M at γ = 10, and nothing to a donor who only cares about averages (γ = 0).",
  },
  {
    title: "No private information",
    statement: "The donor knows no more than the market does.",
    example:
      "After the donation, the market and the donor both put the candidate's chance at 52.7%. If the donor secretly believed 40%, a $25M NO bet would be expected to gain about $6.7M. That is a bet on an edge, not a hedge, and the model does not allow it.",
  },
  {
    title: "Money helps, with diminishing returns",
    statement:
      "The donation raises the win probability, but each extra dollar helps less than the last (a logarithmic curve by default). The “Boost from a $50M donation” slider sets how much.",
    example:
      "At the default, the first $10M adds about 1.0 point of win probability, $50M adds 2.7 points, and doubling to $100M adds only 0.9 more. Studies of campaign spending find effects of a few points at most.",
  },
  {
    title: "The market already knows about the donation",
    statement: "The market is efficient and moves to the new win probability as soon as the donation is made.",
    example:
      "Before the donation the market prices “wins” at 50¢. After a $50M gift it moves to 52.7¢, so NO costs 47.3¢ and the hedge is fairly priced. Had the market missed the donation and stayed at 50¢, a $25M NO bet would lose about $1.35M of expected value.",
  },
  {
    title: "Orders fill at the quoted price",
    statement:
      "The donor's whole order fills at the market price, however large. There is no slippage, and nobody reads anything into who is buying.",
    example:
      "The full hedge buys 100 million NO shares at 47.3¢ each ($47.3M). In a real order book a bet that size would push the price up as it fills, so the average price paid would be higher.",
  },
];

const LEFT_OUT: Assumption[] = [
  {
    title: "Access or goodwill from donating",
    statement: "Any value the donation buys regardless of who wins.",
    example:
      "If a $50M donation also bought a regulatory concession worth $10M whichever candidate won, donating would look $10M better and hedging would matter less. This is probably the largest gap between the model and reality.",
  },
  {
    title: "Trading fees",
    statement: "Real prediction markets charge fees.",
    example:
      "A hypothetical fee of 2¢ per contract on the 100 million contracts above would cost $2M, enough to turn a free hedge into a costly one.",
  },
  {
    title: "Price impact and market depth",
    statement: "Large orders move the price, and real order books have limited depth.",
    example:
      "A $47M bet may be more than a real order book can absorb at one price, so the full hedge might not be possible in a single trade.",
  },
  {
    title: "The cost of tying up money",
    statement: "Money locked in the hedge until the election could have earned a return elsewhere.",
    example: "At an assumed 5% a year, $47M held for a year costs about $2.4M in forgone returns.",
  },
  {
    title: "Platform and resolution risk",
    statement: "The exchange could fail or halt trading, or the market's resolution could be disputed.",
    example: "If the exchange freezes or a result is contested, the hedge might not pay out when it is needed.",
  },
  {
    title: "Law and regulation",
    statement: "Contribution limits, coordination rules and trading rules are not modelled.",
    example:
      "Direct gifts to a candidate committee are capped at $3,500 per election in the 2025–26 cycle, so a $50M donation would have to go through an uncapped channel such as a super PAC. Whether a major donor betting against their own candidate would face insider-trading or venue rules is unsettled.",
  },
  {
    title: "Taxes",
    statement: "All results are before tax.",
    example:
      "Political contributions are not tax-deductible, and winnings on the bet may be taxed, so after-tax results would differ from these numbers.",
  },
];

const DEPENDS: Dependency[] = [
  {
    result: "A hedge costs nothing in expected profit",
    rests: "Assumptions 8 and 9, and no fees or cost of tying up money.",
    breaks:
      "Add a fee, price impact, or a market that misprices the donation, and hedging costs (or earns) expected value.",
  },
  {
    result: "Any risk-averse donor should fully hedge",
    rests: "The same assumptions as above, plus 5.",
    breaks: "With frictions, the best hedge becomes partial and depends on how risk-averse the donor is.",
  },
  {
    result: "Donating usually does not pay",
    rests: "Assumptions 3 and 7: the payoff comes only from winning, and the effect of money is small and fading.",
    breaks:
      "A bigger stake or a stronger effect flips it. The scenario presets show best donations of roughly $10M to $65M.",
  },
  {
    result: "The hedge cannot rescue a bad donation",
    rests: "Assumption 8: the hedge is fairly priced.",
    breaks: "It only narrows the spread of outcomes around the same average, so it cannot turn a losing donation into a winning one.",
  },
];

export const ASSUMPTIONS_CONTENT: AssumptionsContent = {
  note: DEFAULT_SCENARIO_NOTE,
  assumptions: ASSUMPTIONS,
  leftOut: LEFT_OUT,
  depends: DEPENDS,
};
