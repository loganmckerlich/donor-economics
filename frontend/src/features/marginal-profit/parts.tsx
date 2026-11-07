import { money, pct } from "@/lib/format";
import type { MarginalOutcome, MarketResponse } from "./api";

const pts = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(1)} pts`;

/** Chart 1: the probability going up, as three bars measured from the starting price. */
export function ProbabilitySteps({ start, price, truth }: { start: number; price: number; truth: number }) {
  const rows = [
    { label: "Starting price (you buy here)", value: start, move: 0, color: "" },
    { label: "Price when you sell", value: price, move: price - start, color: "var(--series-1)" },
    { label: "True win chance with the donation", value: truth, move: truth - start, color: "var(--series-3)" },
  ];
  const max = Math.max(...rows.map((r) => Math.abs(r.move)), 0.002);
  return (
    <ul className="space-y-3" aria-label="Starting price, price when you sell, and true win chance">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_6.5rem] items-center gap-3 text-sm sm:grid-cols-[13rem_minmax(0,1fr)_7rem]">
          <span className="text-ink-2">{r.label}</span>
          <span className="relative h-3 rounded bg-grid/60" aria-hidden>
            <span
              className="absolute inset-y-0 left-0 rounded"
              style={{ background: r.color, width: `${(Math.abs(r.move) / max) * 100}%` }}
            />
          </span>
          <span className="text-right font-mono tabular-nums text-ink">
            {pct(r.value, 1)} <span className="text-xs text-ink-3">{r.move === 0 ? "" : pts(r.move)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const Money = ({ v, strong = false }: { v: number; strong?: boolean }) => (
  <td className={`px-2 py-1.5 text-right font-mono tabular-nums ${strong ? "font-semibold text-ink" : "text-ink-2"}`}>{money(v)}</td>
);

/** Chart 2: the payoff in each outcome, with and without the trade. */
export function PayoffTable({ o }: { o: MarginalOutcome }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Payoff if the candidate wins or loses, donating only or donating and trading</caption>
        <thead>
          <tr className="text-xs uppercase tracking-wide text-ink-3">
            <th scope="col" className="px-2 py-1.5 text-left font-medium">Outcome</th>
            <th scope="col" className="px-2 py-1.5 text-right font-medium">Donate only</th>
            <th scope="col" className="px-2 py-1.5 text-right font-medium">Donate and trade</th>
            <th scope="col" className="px-2 py-1.5 text-right font-medium">Added by the trade</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-grid border-t border-grid">
          <tr>
            <th scope="row" className="px-2 py-1.5 text-left font-medium text-ink">Candidate wins</th>
            <Money v={o.payoff_win_no_trade} />
            <Money v={o.payoff_win} strong />
            <Money v={o.trade_profit} />
          </tr>
          <tr>
            <th scope="row" className="px-2 py-1.5 text-left font-medium text-ink">Candidate loses</th>
            <Money v={o.payoff_lose_no_trade} />
            <Money v={o.payoff_lose} strong />
            <Money v={o.trade_profit} />
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-xs text-ink-3">
        The trade adds the same amount to both rows, because the YES is sold before the election. The gap between winning and
        losing stays at the win payoff.
      </p>
    </div>
  );
}

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
