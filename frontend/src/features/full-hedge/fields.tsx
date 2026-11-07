"use client";

import { FormField, SliderField, type FieldMeta } from "@/components/Controls";
import { T } from "@/components/Tip";
import { AFFECTS, CHART_TITLES, type ParamId } from "./scenario";

const TIPS: Record<ParamId, React.ReactNode> = {
  payoff: (
    <T title="Payoff if the candidate wins (V)">
      What the donor receives, in dollars, if their candidate wins. They receive nothing if the candidate loses.
      A bigger V makes both donating and hedging matter more.
    </T>
  ),
  baseProb: (
    <T title="Win probability with no donation (p₀)">
      The chance the candidate wins if the donor gives nothing. The donation then adds to this.
      It is also the market price of &ldquo;wins&rdquo; before any money is spent.
    </T>
  ),
  effectForm: (
    <T title="Functional form of the donation effect">
      How donated dollars turn into win probability. <b className="text-ink">Log</b> (default): each extra dollar helps
      less than the last. <b className="text-ink">Saturating</b>: the effect levels off at +k.{" "}
      <b className="text-ink">Linear</b>: every dollar helps equally, so it can reach 100%.
    </T>
  ),
  boost: (
    <T title="Win-probability boost from a $50M donation">
      How many points of win probability a $50M donation buys. Studies of campaign spending find effects of a few
      points at most, so small values are realistic. Smaller donations buy less, and with the default (log) curve each
      extra dollar helps a little less than the last.
    </T>
  ),
  effectScale: (
    <T title="Effect scale (s)">
      The dollar size at which returns start to fade. A small s means the first few million dollars do most of the work;
      a large s means the effect builds slowly. The boost from a $50M donation stays fixed, so this only changes how that
      boost is spread across smaller and larger donations.
    </T>
  ),
  donation: (
    <T title="Donation (D)">
      What the donor gives, in dollars. It is spent whether the candidate wins or loses, and it raises the win
      probability along the donation-effect curve. The market price of &ldquo;wins&rdquo; rises with it.
    </T>
  ),
  hedge: (
    <T title="Hedge (% of the risk-free hedge)">
      How much to bet on &ldquo;NO&rdquo; (candidate loses) on the prediction market, as a share of the amount that
      removes all risk. 0% is no hedge; 100% makes your profit identical whether the candidate wins or loses; above
      100% over-hedges. The price is fair, so the hedge never changes expected profit. It only narrows the gap between
      the win and lose outcomes.
    </T>
  ),
  gamma: (
    <T title="Risk aversion (γ)">
      How much the donor dislikes uncertain outcomes. 0 means they only care about the average, so hedging is
      pointless. Around 2 is a common benchmark. Higher values pay more to avoid risk.
    </T>
  ),
  wealth: (
    <T title="Donor wealth">
      Combined with γ to set risk aversion in dollar terms: a = γ / wealth. A wealthier donor is bothered less by a
      swing of tens of millions, so hedging is worth less to them.
    </T>
  ),
};

const meta = (p: ParamId): FieldMeta => ({ tip: TIPS[p], affects: AFFECTS[p], titles: CHART_TITLES });

/** A slider wired to this page's tooltips and chart chips. */
export function HSlider(props: Omit<Parameters<typeof SliderField>[0], "param" | "tip" | "affects" | "titles"> & { param: ParamId }) {
  return <SliderField {...props} {...meta(props.param)} />;
}

export function HFormField(props: Omit<Parameters<typeof FormField>[0], keyof FieldMeta>) {
  return <FormField {...props} {...meta("effectForm")} />;
}
