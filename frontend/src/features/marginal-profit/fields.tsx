"use client";

import { FormField, SliderField, type FieldMeta } from "@/components/Controls";
import { T } from "@/components/Tip";
import { AFFECTS, CHART_TITLES, type ParamId } from "./scenario";

/** Tooltip copy, as [title, body]. Rendered by the page. */
export const TIPS: Record<ParamId, [string, string]> = {
  boost: [
    "Win-probability boost from a $50M donation",
    "How many points of true win probability a $50M donation buys. The price only follows as much of this as the capture slider says. Studies of campaign spending find a few points at most.",
  ],
  donation: [
    "Donation (D)",
    "What the donor gives. It is spent whether the candidate wins or loses, and it raises the true win probability along the donation-effect curve. That rise is what the price is expected to follow.",
  ],
  capital: [
    "Money spent on YES",
    "Dollars used to buy YES contracts before the donation, at the starting price. Each dollar earns the same return, so the trade profit grows in a straight line with this (the model has no fees and no price impact). It is the same whether the candidate wins or loses, because you sell before the election.",
  ],
  capture: [
    "Share of the boost the price captures",
    "How far the price has moved toward the new win probability by the time you sell. 100% means it has fully caught up; 50% means half; 0% means the market ignored the donation; above 100% means it over-reacted; below 0% means the price fell back, so the trade loses money. It folds in both how much the market believes the donation and how long you wait.",
  ],
  payoff: [
    "Payoff if the candidate wins (V)",
    "What the donor receives if the candidate wins, in dollars, and nothing otherwise. Set it to $0 to see the trade on its own. It does not change the trade profit, which is earned either way. It only adds the expected value of the higher win probability, and sets the gap between the win and lose outcomes.",
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
