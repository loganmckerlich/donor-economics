import { DEFAULT_UI, type UiState } from "./scenario";

export interface Preset {
  id: string;
  label: string;
  blurb: string;
  ui: Partial<UiState>;
}

/** One-click scenarios. Anything not listed resets to the defaults. Profits quoted in the blurbs come from the Python model. */
export const PRESETS: Preset[] = [
  {
    id: "literature",
    label: "Literature-sized effect",
    blurb:
      "The default. A $10M donation moves the price about 1 point by month 3, but the position needs 5 points to earn the donation back, so it loses about $8M. Even if the market caught up fully it would not pay at this size.",
    ui: {},
  },
  {
    id: "huge",
    label: "Literature effect, huge position",
    blurb:
      "The same weak effect, but $1B of YES instead of $100M. With no fees and no price impact in the model, profit scales with the size of the position, so the same 1-point move now earns about $8M. Real markets could not absorb this: that friction is outside the model.",
    ui: { capital: 1e9 },
  },
  {
    id: "strong",
    label: "Strong effect",
    blurb:
      "An 8-point boost from $50M. A $40M donation with $500M of YES, sold after 3 months, earns about $23M. It breaks even after about 1.2 months.",
    ui: { boost: 0.08, donation: 40e6, capital: 500e6 },
  },
  {
    id: "fast",
    label: "Fast market",
    blurb:
      "The same trade, but the market catches up in days (half-life 0.25 months). Selling after 2 months captures nearly all of the move and earns about $32M.",
    ui: { boost: 0.08, donation: 40e6, capital: 500e6, hold: 2, halfLife: 0.25 },
  },
  {
    id: "slow",
    label: "Slow market",
    blurb:
      "The same trade, but the market takes months to react (half-life 4 months). After 2 months only about 30% of the move has happened and the position loses about $19M. It would break even if held about 4.7 months, so waiting rescues it.",
    ui: { boost: 0.08, donation: 40e6, capital: 500e6, hold: 2, halfLife: 4 },
  },
  {
    id: "skeptic",
    label: "Skeptical market",
    blurb:
      "Traders only believe 40% of the donation's real effect, so the price settles well short of the true win chance. The position loses about $15M, and no amount of waiting fixes it: the price never rises far enough.",
    ui: { boost: 0.08, belief: 0.4, donation: 40e6, capital: 500e6 },
  },
  {
    id: "overreact",
    label: "Over-reacting market",
    blurb:
      "A modest 5-point effect, but traders over-react and price in twice the true boost. That is a gift to a buyer who is early: about $38M on a $30M donation and $500M of YES.",
    ui: { boost: 0.05, belief: 2, donation: 30e6, capital: 500e6 },
  },
];

export const presetState = (p: Preset): UiState => ({ ...DEFAULT_UI, ...p.ui });
export const isPreset = (ui: UiState, p: Preset): boolean => {
  const t = presetState(p);
  return (Object.keys(t) as (keyof UiState)[]).every((k) => ui[k] === t[k]);
};
