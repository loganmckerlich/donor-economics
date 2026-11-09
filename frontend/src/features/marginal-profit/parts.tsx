import { useState } from "react";
import { money, moneyShort, pct } from "@/lib/format";
import type { MarginalOutcome, MarketResponse } from "./api";

const pts = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(1)} pts`;

/** Chart 1: where the price starts, where it is when you sell, and where the true win chance ends up, on one zoomed axis. */
export function ProbabilitySteps({ start, price, truth }: { start: number; price: number; truth: number }) {
  const vals = [start, price, truth];
  const lo0 = Math.min(...vals);
  const hi0 = Math.max(...vals);
  const pad = Math.max((hi0 - lo0) * 0.3, 0.004);
  const lo = lo0 - pad;
  const hi = hi0 + pad;
  const at = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  const rows = [
    { label: "Starting price (you buy here)", value: start, color: "var(--ink-3)" },
    { label: "Price when you sell", value: price, color: "var(--series-3)" },
    { label: "True win chance with the donation", value: truth, color: "var(--series-1)" },
  ];
  return (
    <div>
      <ul className="space-y-3" aria-label="Starting price, price when you sell, and true win chance">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_6.5rem] items-center gap-3 text-sm sm:grid-cols-[13rem_minmax(0,1fr)_7rem]">
            <span className="text-ink-2">{r.label}</span>
            <span className="relative h-4" aria-hidden>
              <span className="absolute inset-x-0 top-1/2 h-px bg-grid" />
              <span className="absolute inset-y-0 w-px border-l border-dashed border-ink-3/60" style={{ left: at(start) }} />
              {r.value !== start && (
                <span className="absolute top-1/2 h-1 -translate-y-1/2 rounded" style={{ left: at(Math.min(start, r.value)), width: `${(Math.abs(r.value - start) / (hi - lo)) * 100}%`, background: r.color, opacity: 0.45 }} />
              )}
              <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: at(r.value), background: r.color }} />
            </span>
            <span className="text-right font-mono tabular-nums text-ink">
              {pct(r.value, 1)} <span className="text-xs text-ink-3">{r.value === start ? "" : pts(r.value - start)}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-3">Zoomed in: the axis runs from {pct(lo, 1)} to {pct(hi, 1)}. The dashed line is where you bought.</p>
    </div>
  );
}

interface Seg { from: number; to: number; color: string; faded?: boolean }

/** One horizontal bar made of coloured segments on a shared axis, with zero marked. */
function BarRow({ label, segs, net, lo, hi, strong }: { label: string; segs: Seg[]; net: number; lo: number; hi: number; strong?: boolean }) {
  const at = (v: number) => ((v - lo) / (hi - lo)) * 100;
  return (
    <li className="grid grid-cols-[6.5rem_minmax(0,1fr)_6rem] items-center gap-3 text-sm sm:grid-cols-[9rem_minmax(0,1fr)_6.5rem]">
      <span className={strong ? "font-medium text-ink" : "text-ink-2"}>{label}</span>
      <span className="relative h-5 rounded bg-grid/30" aria-hidden>
        {segs.filter((g) => g.to !== g.from).map((g, i) => (
          <span key={i} className="absolute inset-y-0.5 rounded-sm"
            style={{
              left: `${at(Math.min(g.from, g.to))}%`, width: `${(Math.abs(g.to - g.from) / (hi - lo)) * 100}%`,
              background: g.faded ? "transparent" : g.color, border: g.faded ? `1.5px dashed ${g.color}` : undefined,
            }} />
        ))}
        <span className="absolute inset-y-0 w-px bg-ink-3" style={{ left: `${at(0)}%` }} />
      </span>
      <span className={`text-right font-mono tabular-nums ${strong ? "font-semibold text-ink" : "text-ink-2"}`}>{money(net)}</span>
    </li>
  );
}

const domain = (vals: number[]): [number, number] => {
  const lo = Math.min(0, ...vals);
  const hi = Math.max(0, ...vals);
  const pad = (hi - lo) * 0.04 || 1;
  return [lo - (lo < 0 ? pad : 0), hi + (hi > 0 ? pad : 0)];
};

const LOSS = "var(--series-2)";
const WIN = "var(--series-1)";
const TRADE = "var(--series-3)";

/** Chart 2: what the donor ends up with in each outcome, with and without the trade, as bars from zero. */
export function PayoffBars({ o, payoff }: { o: MarginalOutcome; payoff: number }) {
  const D = o.donation;
  const T = o.trade_profit;
  const recovered = Math.min(Math.max(T, 0), D);

  const loseOnly: Seg[] = [{ from: -D, to: 0, color: LOSS }];
  const loseTrade: Seg[] =
    T >= 0
      ? [
          { from: -D, to: -D + recovered, color: TRADE, faded: true },
          { from: -D + recovered, to: 0, color: LOSS },
          { from: 0, to: Math.max(T - D, 0), color: TRADE },
        ]
      : [{ from: -D + T, to: 0, color: LOSS }];
  const winOnly: Seg[] = [{ from: 0, to: payoff - D, color: WIN }];
  const winTrade: Seg[] =
    T >= 0
      ? [{ from: 0, to: payoff - D, color: WIN }, { from: payoff - D, to: payoff - D + T, color: TRADE }]
      : [{ from: 0, to: payoff - D + T, color: WIN }, { from: payoff - D + T, to: payoff - D, color: LOSS, faded: true }];

  const [llo, lhi] = domain([o.payoff_lose_no_trade, o.payoff_lose]);
  const [wlo, whi] = domain([o.payoff_win_no_trade, o.payoff_win]);

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <h4 className="text-sm font-semibold text-ink">If the candidate loses</h4>
          <span className="text-xs text-ink-3">
            {T >= 0 ? <>Floor raised by <strong className="text-ink">{money(T)}</strong></> : <>Floor lowered by <strong className="text-ink">{money(-T)}</strong></>}
          </span>
        </div>
        <ul className="space-y-1.5" aria-label="Result if the candidate loses, donating only and donating with the trade">
          <BarRow label="Donate only" segs={loseOnly} net={o.payoff_lose_no_trade} lo={llo} hi={lhi} />
          <BarRow label="Donate + trade" segs={loseTrade} net={o.payoff_lose} lo={llo} hi={lhi} strong />
        </ul>
      </div>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <h4 className="text-sm font-semibold text-ink">If the candidate wins</h4>
          <span className="text-xs text-ink-3">Gap to the losing case: <strong className="text-ink">{moneyShort(payoff)}</strong>, unchanged</span>
        </div>
        <ul className="space-y-1.5" aria-label="Result if the candidate wins, donating only and donating with the trade">
          <BarRow label="Donate only" segs={winOnly} net={o.payoff_win_no_trade} lo={wlo} hi={whi} />
          <BarRow label="Donate + trade" segs={winTrade} net={o.payoff_win} lo={wlo} hi={whi} strong />
        </ul>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3" aria-hidden>
        <span><i className="mr-1 inline-block size-2.5 rounded-sm align-middle" style={{ background: WIN }} />Win payoff, net of donation</span>
        <span><i className="mr-1 inline-block size-2.5 rounded-sm align-middle" style={{ background: LOSS }} />Donation still lost</span>
        <span><i className="mr-1 inline-block size-2.5 rounded-sm align-middle" style={{ background: TRADE }} />Trade profit</span>
        <span><i className="mr-1 inline-block size-2.5 rounded-sm border border-dashed align-middle" style={{ borderColor: TRADE }} />Donation won back by the trade</span>
      </div>
      <p className="text-xs text-ink-3">
        The two groups use different scales. The trade moves both outcomes up by the same amount, because the YES is sold before
        the election: it raises the floor without narrowing the gap, so it does not shrink the election risk the way the hedge on
        the Full Hedge page does.
      </p>
    </div>
  );
}

const Money = ({ v, strong = false }: { v: number; strong?: boolean }) => (
  <td className={`px-2 py-1.5 text-right font-mono tabular-nums ${strong ? "font-semibold text-ink" : "text-ink-2"}`}>{money(v)}</td>
);

/** Chart 5 companion: the same plan under three fixed market responses. */
export function ResponseTable({ responses }: { responses: MarketResponse[] }) {
  return (
    <div className="mt-3 overflow-x-auto border-t border-grid pt-3">
      <table className="w-full text-sm">
        <caption className="sr-only">Trade profit and payoffs if the market ignores, half-prices or fully prices the donation</caption>
        <thead>
          <tr className="text-xs uppercase tracking-wide text-ink-3">
            <th scope="col" className="px-2 py-1.5 text-left font-medium">The market…</th>
            <th scope="col" className="px-2 py-1.5 text-right font-medium">Trade profit</th>
            <th scope="col" className="px-2 py-1.5 text-right font-medium">If it loses</th>
            <th scope="col" className="px-2 py-1.5 text-right font-medium">If it wins</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-grid border-t border-grid">
          {responses.map((r) => (
            <tr key={r.capture}>
              <th scope="row" className="px-2 py-1.5 text-left font-medium text-ink">{r.label}</th>
              <Money v={r.trade_profit} />
              <Money v={r.payoff_lose} strong />
              <Money v={r.payoff_win} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Work backwards from a goal: how much YES covers a chosen share of the donation? */
export function CoverTarget({
  donation, capital, returnPerDollar, onApply, maxCapital,
}: { donation: number; capital: number; returnPerDollar: number; onApply: (q: number) => void; maxCapital: number }) {
  const [share, setShare] = useState(1);
  const needed = returnPerDollar > 0 ? (share * donation) / returnPerDollar : null;
  const reachable = needed !== null && needed <= maxCapital;
  return (
    <div className="rounded-lg border border-grid p-3">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <label htmlFor="cover-target" className="font-medium text-ink">Trade should cover</label>
        <span className="font-mono tabular-nums text-ink">{Math.round(share * 100)}% of the donation</span>
      </div>
      <input id="cover-target" type="range" min={0} max={1.5} step={0.05} value={share}
        onChange={(e) => setShare(Number(e.target.value))}
        className="mt-1 h-1.5 w-full cursor-pointer accent-[var(--series-1)]" />
      <p className="mt-2 text-xs leading-snug text-ink-3">
        {donation === 0 ? (
          "There is no donation to cover."
        ) : needed === null ? (
          "The price has not risen, so no amount of YES covers anything."
        ) : (
          <>
            Needs <strong className="text-ink">{moneyShort(needed)}</strong> of YES (you have {moneyShort(capital)}), with the
            price moving as set. The model has no price impact, so any size fills; a real market would not fill this much.
          </>
        )}
      </p>
      {needed !== null && donation > 0 && (
        <button type="button" onClick={() => onApply(Math.min(Math.round(needed / 1e6) * 1e6, maxCapital))}
          className="mt-2 rounded-md border border-axis px-2.5 py-1 text-xs text-ink-2 hover:text-ink">
          {reachable ? "Set money spent on YES to this" : `Set to the ${moneyShort(maxCapital)} maximum`}
        </button>
      )}
    </div>
  );
}
