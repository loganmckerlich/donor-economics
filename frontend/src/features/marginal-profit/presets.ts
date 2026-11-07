import { DEFAULT_UI, type UiState } from "./scenario";

export interface Preset {
  id: string;
  label: string;
  blurb: string;
  ui: Partial<UiState>;
}

const DEEP = { depth: 500e6, fee: 0.005 }; // a deep, cheap-to-trade market

/** One-click scenarios. Anything not listed resets to the defaults. Profits quoted in the blurbs come from the Python model. */
export const PRESETS: Preset[] = [
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

export const presetState = (p: Preset): UiState => ({ ...DEFAULT_UI, ...p.ui });
export const isPreset = (ui: UiState, p: Preset): boolean => {
  const t = presetState(p);
  return (Object.keys(t) as (keyof UiState)[]).every((k) => ui[k] === t[k]);
};

