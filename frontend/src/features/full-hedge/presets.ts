import { DEFAULT_UI, type UiState } from "./scenario";

export interface Preset {
  id: string;
  label: string;
  blurb: string;
  ui: Partial<UiState>;
}

/** One-click scenarios. Anything not listed resets to the defaults. */
export const PRESETS: Preset[] = [
  {
    id: "literature",
    label: "Literature-sized effect",
    blurb:
      "The default. A $50M donation buys under 3 points of win probability and the stake is $100M, so donating loses money and the best donation is $0.",
    ui: {},
  },
  {
    id: "policy",
    label: "Billion-dollar policy stake",
    blurb:
      "A $5B payoff (for example a rule change worth billions to the donor's firm) with the same weak effect. Now a donation near $65M pays, and the risk is so concentrated that hedging is worth hundreds of millions. The risk-free hedge here is far larger than any prediction market could absorb: that friction is outside this model.",
    ui: { payoff: 5e9, wealthB: 10, donation: 65e6, hedgeFrac: 1 },
  },
  {
    id: "primary",
    label: "Open-seat primary",
    blurb:
      "A $1B stake and a stronger effect (8 points from $50M), as in open-seat or low-information races where money buys more. The best donation is about $35M.",
    ui: { payoff: 1e9, boost: 0.08, wealthB: 10, donation: 35e6, hedgeFrac: 1 },
  },
  {
    id: "early",
    label: "Early money",
    blurb:
      "A $1B stake where the first few million dollars do almost all the work (effect scale s = $2M) and returns fade fast. The best donation is small, around $10M.",
    ui: { payoff: 1e9, boost: 0.04, effectScale: 2e6, wealthB: 10, donation: 10e6, hedgeFrac: 1 },
  },
  {
    id: "believer",
    label: "True believer",
    blurb:
      "An optimistic view of money in politics: $50M buys 15 points of win probability on a $500M stake. The best donation is about $32M. Treat it as an upper bound, not a forecast.",
    ui: { payoff: 500e6, boost: 0.15, donation: 32e6, hedgeFrac: 1 },
  },
];

export const presetState = (p: Preset): UiState => ({ ...DEFAULT_UI, ...p.ui });

export const isPreset = (ui: UiState, p: Preset): boolean => {
  const target = presetState(p);
  return (Object.keys(target) as (keyof UiState)[]).every((k) => ui[k] === target[k]);
};
