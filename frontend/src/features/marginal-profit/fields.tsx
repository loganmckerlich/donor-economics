"use client";

import { FormField, SliderField, type FieldMeta } from "@/components/Controls";
import { T } from "@/components/Tip";
import { AFFECTS, CHART_TITLES, type ParamId } from "./scenario";

/** Tooltip copy, as [title, body]. Rendered by the page. */
export const TIPS: Record<ParamId, [string, string]> = {
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

const meta = (p: ParamId): FieldMeta => ({
  tip: <T title={TIPS[p][0]}>{TIPS[p][1]}</T>,
  affects: AFFECTS[p],
  titles: CHART_TITLES,
});

/** A slider wired to this page's tooltips and chart chips. */
export function MSlider(props: Omit<Parameters<typeof SliderField>[0], "param" | "tip" | "affects" | "titles"> & { param: ParamId }) {
  return <SliderField {...props} {...meta(props.param)} />;
}

export function MFormField(props: Omit<Parameters<typeof FormField>[0], keyof FieldMeta>) {
  return <FormField {...props} {...meta("effectForm")} />;
}
