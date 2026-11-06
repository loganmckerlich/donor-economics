import type { EffectForm } from "./api";

/** The donation at which the "boost" slider is defined. */
export const BOOST_REF = 50e6;

/** Shape of the donation-effect curve at a donation of x·s (matches the Python model). */
function shape(form: EffectForm, x: number): number {
  if (form === "log") return Math.log1p(x);
  if (form === "linear") return x;
  return 1 - Math.exp(-x);
}

/** Effect size k that makes a BOOST_REF donation buy `boost` of win probability. */
export function boostToK(boost: number, form: EffectForm, scale: number): number {
  const sh = shape(form, BOOST_REF / scale);
  return sh > 0 ? boost / sh : 0;
}

/** Win-probability boost a BOOST_REF donation buys for effect size k. */
export function kToBoost(k: number, form: EffectForm, scale: number): number {
  return k * shape(form, BOOST_REF / scale);
}
