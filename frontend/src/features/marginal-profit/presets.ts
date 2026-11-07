import { DEFAULT_UI, type UiState } from "./scenario";

export interface Preset {
  id: string;
  label: string;
  blurb: string;
  ui: Partial<UiState>;
}

/** One-click scenarios. Anything not listed resets to the defaults. Figures quoted in the blurbs come from the Python model. */
export const PRESETS: Preset[] = [
  {
    id: "cushion",
    label: "Small win cushions the loss",
    blurb:
      "The starting scenario. A $10M donation lifts the true win chance about 1.9 points (a 5-point effect from $50M), and the price follows. $300M of YES bought first earns $11.6M when sold, which more than covers the donation: the donor is $1.6M ahead even if the candidate loses, and $101.6M ahead if they win a $100M payoff. It assumes the market follows the donation.",
    ui: { boost: 0.05, donation: 10e6, capital: 300e6 },
  },
  {
    id: "literature",
    label: "Literature-sized effect",
    blurb:
      "The baseline. A $10M donation lifts the price about 1 point, so $100M of YES earns only $2.1M, less than the donation costs. The donor is $7.9M behind if the candidate loses and $92M ahead if they win. At this position size no donation pays.",
    ui: {},
  },
  {
    id: "huge",
    label: "Literature effect, huge position",
    blurb:
      "The same weak effect, but $1B of YES. With no fees and no price impact in the model, the trade scales with the position, so it earns $20.9M and the donor is $10.9M ahead even if the candidate loses. Real markets could not absorb this: that friction is outside the model.",
    ui: { capital: 1e9 },
  },
  {
    id: "strong",
    label: "Strong effect",
    blurb:
      "An 8-point boost from $50M. A $40M donation with $500M of YES earns $71.9M on the trade, so the donor is $31.9M ahead even if the candidate loses, and $131.9M ahead if they win (with a $100M win payoff).",
    ui: { boost: 0.08, donation: 40e6, capital: 500e6 },
  },
  {
    id: "stakes",
    label: "High-stakes race",
    blurb:
      "The same trade with a $1B win payoff. The trade still earns $71.9M either way. If the candidate loses the donor is $31.9M ahead; if they win, $1,031.9M ahead. The trade does not remove the election risk (the gap between the two is the $1B payoff). It adds the same amount to both outcomes.",
    ui: { boost: 0.08, donation: 40e6, capital: 500e6, payoff: 1e9 },
  },
  {
    id: "ignores",
    label: "Market ignores it",
    blurb:
      "The price never moves (capture 0%). The trade earns nothing, and with no fees it also loses nothing, so the worst case is the donation itself: $40M behind if the candidate loses, $960M ahead if they win.",
    ui: { boost: 0.08, donation: 40e6, capital: 500e6, payoff: 1e9, capture: 0 },
  },
  {
    id: "half",
    label: "Market prices half",
    blurb:
      "The price captures half of the boost by the time you sell. The trade earns $35.9M, which almost covers the $40M donation: the donor is $4.1M behind if the candidate loses and $995.9M ahead if they win.",
    ui: { boost: 0.08, donation: 40e6, capital: 500e6, payoff: 1e9, capture: 0.5 },
  },
  {
    id: "fades",
    label: "Market fades back",
    blurb:
      "The cushion backfires. The same 1.9-point donation as the first scenario, but the price falls back to half of its starting move by the time you sell (capture −50%). The $300M of YES loses $5.8M, so the donor is $15.8M behind if the candidate loses, worse than donating alone ($10M behind), and $84.2M ahead if they win.",
    ui: { boost: 0.05, donation: 10e6, capital: 300e6, capture: -0.5 },
  },
  {
    id: "overreact",
    label: "Market over-reacts",
    blurb:
      "A modest 5-point effect, but the price captures twice the true boost. That is a gift to a buyer who is early: the trade earns $77.4M on a $30M donation, so the donor is $47.4M ahead even if the candidate loses.",
    ui: { boost: 0.05, donation: 30e6, capital: 500e6, payoff: 1e9, capture: 2 },
  },
];

/** The scenario the page opens on: the small trade profit visibly covers the donation. */
export const START_PRESET = PRESETS[0];

export const presetState = (p: Preset): UiState => ({ ...DEFAULT_UI, ...p.ui });
export const isPreset = (ui: UiState, p: Preset): boolean => {
  const t = presetState(p);
  return (Object.keys(t) as (keyof UiState)[]).every((k) => ui[k] === t[k]);
};
