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
    "Dollars used to buy YES contracts before the donation. Each dollar earns the same return, so profit grows in a straight line with this (the model has no fees and no price impact). The donation is a fixed cost, so a bigger position is what earns it back.",
  ],
  hold: [
    "Hold time",
    "Months between buying YES and selling it. Waiting costs nothing in this model, so a longer hold only helps: it just takes time for the market to catch up. Sell too early and you leave part of the move behind.",
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
