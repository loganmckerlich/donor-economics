const MINUS = "−";

/** $12.3M, -$0.5M, $1.20B */
export function money(v: number, digits = 1): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? MINUS : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6 || abs === 0) return `${sign}$${(abs / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export const moneyShort = (v: number) => {
  const abs = Math.abs(v);
  const sign = v < 0 ? MINUS : "";
  if (abs >= 1e9) return `${sign}$${+(abs / 1e9).toFixed(2)}B`;
  return `${sign}$${+(abs / 1e6).toFixed(1)}M`;
};

export const pct = (p: number, digits = 1) => `${(p * 100).toFixed(digits)}%`;

export function sci(v: number): string {
  if (v === 0) return "0";
  const [m, e] = v.toExponential(1).split("e");
  return `${m.replace(/\.0$/, "")}e${Number(e)}`;
}

/** Round "nice" tick values spanning [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  const span = max - min || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) {
    out.push(+v.toFixed(12));
  }
  return out;
}
