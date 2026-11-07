import type { AssumptionsContent } from "@/components/AssumptionsPanel";
import type { EffectForm } from "./api";

/** Slider state for the Marginal Profit Strategy page. */
export interface MState {
  boost: number; // win-probability boost from a $50M donation (0.027 = 2.7 points)
  donation: number; // $
  capital: number; // $ spent buying YES
  hold: number; // months between buying and selling
  halfLife: number; // months for the market to close half of the remaining gap (0 = instant)
  belief: number; // share of the true boost the market ends up pricing
  // advanced
  baseProb: number;
  effectForm: EffectForm;
  effectScale: number; // $
  depth: number; // $ of orders that move the price one point
  fee: number; // per side, share of dollars traded
  carry: number; // annual cost of the cash tied up
}

export const DEFAULT_M: MState = {
  boost: 0.027,
  donation: 10e6,
  capital: 100e6,
  hold: 3,
  halfLife: 1,
  belief: 1,
  baseProb: 0.5,
  effectForm: "log",
  effectScale: 10e6,
  depth: 200e6,
  fee: 0.01,
  carry: 0.05,
};

export interface MPreset {
  id: string;
  label: string;
  blurb: string;
  ui: Partial<MState>;
}

const DEEP = { depth: 500e6, fee: 0.005 }; // a deep, cheap-to-trade market

/** One-click scenarios. Anything not listed resets to the defaults. Profits quoted in the blurbs come from the Python model. */
export const M_PRESETS: MPreset[] = [
  {
    id: "literature",
    label: "Literature-sized effect",
    blurb:
      "The default. A $10M donation moves the price about 1 point, but the position needs about 7 points to cover the donation, fees and carry. It loses roughly $12M, and no donation or trade size pays at these assumptions.",
    ui: {},
  },
  {
    id: "deep",
    label: "Deep market, strong effect",
    blurb:
      "An 8-point boost from $50M in a deep, cheap market ($500M moves the price a point, 0.5% fees). A $60M donation with $1B of YES, sold after 4.5 months, earns about $31M, a 3% return on the money deployed. The edge is thin even here.",
    ui: { ...DEEP, boost: 0.08, donation: 60e6, capital: 1e9, hold: 4.5 },
  },
  {
    id: "fast",
    label: "Fast market",
    blurb:
      "Same effect, but the market catches up in days (half-life 0.25 months). Selling after 2 months captures nearly all of the move and earns about $31M.",
    ui: { ...DEEP, boost: 0.08, donation: 40e6, capital: 800e6, hold: 2, halfLife: 0.25 },
  },
  {
    id: "slow",
    label: "Slow market",
    blurb:
      "The same trade as the fast market, but the market takes months to react (half-life 4 months). After 2 months under a third of the move has happened, and the position loses about $47M. Holding longer helps (the best sell time is about 10 months) but carry piles up, and even then it loses about $15M.",
    ui: { ...DEEP, boost: 0.08, donation: 40e6, capital: 800e6, hold: 2, halfLife: 4 },
  },
  {
    id: "skeptic",
    label: "Skeptical market",
    blurb:
      "Traders only believe 40% of the donation's real effect, so the price settles well short of the true win chance. The position loses about $44M however long it is held.",
    ui: { ...DEEP, boost: 0.08, belief: 0.4, donation: 40e6, capital: 800e6, hold: 3 },
  },
  {
    id: "overreact",
    label: "Over-reacting market",
    blurb:
      "A modest 5-point effect, but traders over-react and price in twice the true boost. That is a gift to a buyer who is early: about $31M on a $30M donation and $800M of YES.",
    ui: { ...DEEP, boost: 0.05, belief: 2, donation: 30e6, capital: 800e6, hold: 3 },
  },
];

export const mPresetState = (p: MPreset): MState => ({ ...DEFAULT_M, ...p.ui });
export const isMPreset = (ui: MState, p: MPreset): boolean => {
  const t = mPresetState(p);
  return (Object.keys(t) as (keyof MState)[]).every((k) => ui[k] === t[k]);
};

export type MParam =
  | "boost" | "donation" | "capital" | "hold" | "halfLife" | "belief"
  | "baseProb" | "effectForm" | "effectScale" | "depth" | "fee" | "carry";

export const M_CHART_TITLES: Record<number, string> = {
  1: "Price over time",
  2: "Profit by when you sell",
  3: "Profit by donation size",
  4: "Profit by trade size",
  5: "When does timing pay?",
  6: "When does size pay?",
};

type Kind = "curve" | "marker";
const all = (k: Kind): Record<number, Kind> => ({ 1: k, 2: k, 3: k, 4: k, 5: k, 6: k });

/** Charts each parameter changes: "curve" reshapes the chart, "marker" only moves your scenario's marker or line. */
export const M_AFFECTS: Record<MParam, Record<number, Kind>> = {
  boost: all("curve"),
  baseProb: all("curve"),
  effectForm: all("curve"),
  effectScale: all("curve"),
  belief: all("curve"),
  donation: { 1: "curve", 2: "curve", 3: "marker", 4: "curve", 5: "curve", 6: "marker" },
  halfLife: { 1: "curve", 2: "curve", 3: "curve", 4: "curve", 5: "marker", 6: "curve" },
  hold: { 1: "marker", 2: "marker", 3: "curve", 4: "curve", 5: "marker", 6: "curve" },
  capital: { 2: "curve", 3: "curve", 4: "marker", 5: "curve", 6: "marker" },
  depth: { 2: "curve", 3: "curve", 4: "curve", 5: "curve", 6: "curve" },
  fee: { 2: "curve", 3: "curve", 4: "curve", 5: "curve", 6: "curve" },
  carry: { 2: "curve", 3: "curve", 4: "curve", 5: "curve", 6: "curve" },
};
export const mAffectedCharts = (p: MParam) => Object.keys(M_AFFECTS[p]).map(Number);

/** Tooltip copy, as [title, body]. Rendered by the page. */
export const M_TIPS: Record<MParam, [string, string]> = {
  boost: [
    "Win-probability boost from a $50M donation",
    "How many points of true win probability a $50M donation buys. The market only sees as much of this as the belief slider says. Studies of campaign spending find a few points at most.",
  ],
  donation: [
    "Donation (D)",
    "What the donor gives. It is a sunk cost: the trade has to earn it back. It raises the true win probability along the donation-effect curve, and that is the move the market is expected to price in.",
  ],
  capital: [
    "Money spent on YES",
    "Dollars used to buy YES contracts before the donation. Profit grows with this, but buying more moves the price against you (and selling does too), so returns fade and then turn negative.",
  ],
  hold: [
    "Hold time",
    "Months between buying YES and selling it. Too early and the market has not caught up; too late and you are paying carry on money that has already made its gain.",
  ],
  halfLife: [
    "Market catch-up half-life",
    "How slowly the market notices. Every half-life, half of the remaining gap between today's price and its eventual level closes. 0 means the price jumps immediately after you buy; larger means it drifts.",
  ],
  belief: [
    "Market belief",
    "The share of the true boost that the market ends up pricing. 100% means it eventually agrees with the model. Below that, traders discount the donation's effect; above it, they over-react. This sets where the price is heading, not how fast.",
  ],
  baseProb: [
    "Win probability, no donation (p₀)",
    "The market price of YES when you buy, before the donation. Each YES share costs about this much and pays $1 if the candidate wins, though here you sell it rather than hold it.",
  ],
  effectForm: [
    "Functional form of the donation effect",
    "How donated dollars turn into win probability. Log (default): each extra dollar helps less than the last. Saturating: the effect levels off. Linear: every dollar helps equally.",
  ],
  effectScale: [
    "Effect scale (s)",
    "The dollar size at which returns start to fade. A small s means the first few million do most of the work. The boost from $50M stays fixed; this only changes how it is spread across smaller and larger donations.",
  ],
  depth: [
    "Market depth",
    "Dollars of orders needed to move the price one point. A deep market (large number) lets you build a big position without moving the price against yourself; a thin one eats the profit. Price impact is assumed linear.",
  ],
  fee: [
    "Trading cost per side",
    "Fees plus the bid-ask spread, as a share of the dollars traded. You trade twice (buy and sell), so it is paid twice.",
  ],
  carry: [
    "Cost of tied-up cash",
    "What the money in YES could have earned elsewhere, per year. It is charged on the dollars spent on YES for as long as you hold them.",
  ],
};

export const M_ASSUMPTIONS: AssumptionsContent = {
  note:
    "Examples use the default scenario: a $10M donation, $100M of YES bought at about 50%, a 2.7-point boost from $50M (about 1 point from $10M), sold after 3 months.",
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
        "The donor pays about 50.25¢ per share. If traders had already seen the donation coming, the price would start higher and most of the profit would be gone.",
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
      title: "Legal and regulatory risk",
      statement:
        "Donating while holding a position that gains from it raises campaign-finance and market-manipulation questions that could cost far more than the trade makes.",
      example: "A regulator that treated the donation as manipulation could void the trade or add penalties. The model has none.",
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
