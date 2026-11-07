"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ApiError from "@/components/ApiError";
import AssumptionsPanel from "@/components/AssumptionsPanel";
import { Mini, Section } from "@/components/Blocks";
import ChartCard from "@/components/ChartCard";
import { AdvancedGroup, ControlCtx } from "@/components/Controls";
import Heatmap from "@/components/Heatmap";
import LineChart, { type Series } from "@/components/LineChart";
import PresetBar from "@/components/PresetBar";
import Tip, { T } from "@/components/Tip";
import useDebounced from "@/components/useDebounced";
import { boostToK } from "@/lib/effect";
import { money, moneyShort, pct } from "@/lib/format";
import { fetchMarginal, type MarginalAnalysis, type MarginalOutcome, type MarginalParams } from "./api";
import { ASSUMPTIONS_CONTENT } from "./assumptions";
import { MFormField, MSlider } from "./fields";
import { isPreset, presetState, PRESETS } from "./presets";
import { affectedCharts, DEFAULT_UI, type ParamId, type UiState } from "./scenario";

const CAT = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];
const m0 = (v: number) => `$${(v / 1e6).toFixed(0)}M`;
const months = (v: number) => `${+v.toFixed(1)} mo`;
const pts = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(1)} pts`;
const sig = (a: MarginalAnalysis) => JSON.stringify([a.outcome, a.strategy.optimal_donation]);

export default function MarginalProfitPage() {
  const [ui, setUi] = useState<UiState>(DEFAULT_UI);
  const [data, setData] = useState<MarginalAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<ParamId | null>(null);
  const [ghost, setGhost] = useState<MarginalAnalysis | null>(null);

  const dataRef = useRef<MarginalAnalysis | null>(null);
  useEffect(() => { dataRef.current = data; }, [data]);

  const set = useCallback((patch: Partial<UiState>) => setUi((u) => ({ ...u, ...patch })), []);
  const ctx = useMemo(
    () => ({
      setActive: (id: string | null) => setActive(id as ParamId | null),
      snapshot: () => setGhost(dataRef.current),
    }),
    [],
  );

  const params = useMemo<MarginalParams>(
    () => ({
      base_win_prob: ui.baseProb,
      effect_size: boostToK(ui.boost, ui.effectForm, ui.effectScale),
      effect_scale: ui.effectScale,
      effect_form: ui.effectForm,
      donation: ui.donation,
      capital: ui.capital,
      hold_months: ui.hold,
      half_life_months: ui.halfLife,
      belief: ui.belief,
    }),
    [ui],
  );
  const dParams = useDebounced(params);

  useEffect(() => {
    const ac = new AbortController();
    fetchMarginal(dParams, ac.signal)
      .then((d) => { setData(d); setError(null); })
      .catch((e) => { if (e.name !== "AbortError") setError(String(e.message ?? e)); });
    return () => ac.abort();
  }, [dParams]);

  const visibleGhost = ghost && data && sig(ghost) !== sig(data) ? ghost : null;
  const pickPreset = (i: number) => {
    setGhost(dataRef.current);
    setUi(presetState(PRESETS[i]));
  };
  const applyBestDonation = () => {
    if (!data) return;
    setGhost(data);
    set({ donation: data.strategy.optimal_donation });
  };

  return (
    <ControlCtx.Provider value={ctx}>
      <SummaryBar d={data} donation={ui.donation} onApply={applyBestDonation} hasGhost={!!visibleGhost} onClearGhost={() => setGhost(null)} />
      <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-6 sm:px-6">
        <header>
          <h1 className="text-2xl font-semibold text-ink">Marginal profit strategy</h1>
          <p className="mt-1 max-w-3xl text-sm text-ink-2">
            Instead of hedging, the donor <em>trades</em> the donation. They buy YES contracts, donate to raise the candidate&apos;s
            odds, and sell after a few months once the market has noticed. The profit is the price move on the YES contracts;
            the donation is a cost it has to earn back. There is no bet on the election itself. Time matters because the
            market catches up gradually. The market is otherwise frictionless: orders fill at the quoted price, with no fees.
            Each section has its own sliders beside the charts they drive.
          </p>
          <div role="note" className="mt-3 max-w-3xl rounded-lg border border-series-2 bg-surface px-4 py-3 text-sm text-ink-2">
            <strong className="font-semibold text-ink">Legal caution.</strong> Buying YES, then making a donation expected to raise
            the YES price, then selling is close to profiting from a price move you cause and know about in advance. Regulators may
            treat that as market manipulation or trading on non-public information, and this model has no legal cost. It is a
            theory exercise, not a recommendation or legal advice.
          </div>
          <div className="mt-3 max-w-3xl rounded-lg border border-grid bg-surface px-4 py-3 text-sm text-ink-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-ink-3">The results rest on these assumptions</div>
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              <li>The donor buys <strong className="font-semibold text-ink">before anyone reacts</strong>: nobody else trades on the donation, or anticipates it. The donor knows first because the donor is the cause.</li>
              <li>The price moves <strong className="font-semibold text-ink">only because of the donation</strong>, closing half the gap every half-life. No other news or noise.</li>
              <li><strong className="font-semibold text-ink">No frictions</strong>: any order fills at the quoted price, with no fees, price impact or cost of cash. So profit grows in a straight line with position size, and there is no cost to waiting. One buy and one sell.</li>
              <li>The half-life and market-belief defaults are <strong className="font-semibold text-ink">illustrative, not measured</strong> from real markets.</li>
            </ul>
            <p className="mt-2 text-xs text-ink-3">The full list, with examples and what is left out, is in Model assumptions below.</p>
          </div>
        </header>

        <AssumptionsPanel content={ASSUMPTIONS_CONTENT} />
        <PresetBar presets={PRESETS} isActive={(p) => isPreset(ui, p)} onPick={pickPreset} />

        {error && <ApiError message={error} />}
        {!data && !error && <div className="text-sm text-ink-3">Loading…</div>}
        {data && <Sections d={data} ghost={visibleGhost} ui={ui} active={active} set={set} />}
      </div>
    </ControlCtx.Provider>
  );
}

function SummaryBar({
  d, donation, onApply, hasGhost, onClearGhost,
}: { d: MarginalAnalysis | null; donation: number; onApply: () => void; hasGhost: boolean; onClearGhost: () => void }) {
  const o = d?.outcome;
  const st = d?.strategy;
  const be = st?.break_even_months;
  const canApply = !!st && Math.abs(st.optimal_donation - donation) > 0.5e6;
  return (
    <div className="z-20 border-b border-grid bg-surface/95 sm:sticky sm:top-0 sm:backdrop-blur">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 items-start gap-x-6 gap-y-3 px-4 py-2.5 sm:px-6 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <Mini
          label="Net profit"
          value={o ? money(o.profit) : "…"}
          sub={o ? `${(o.roi * 100).toFixed(1)}% on ${moneyShort(o.donation + (d?.scenario.capital ?? 0))} deployed` : undefined}
          tip={
            <T title="Net profit">
              What the plan earns compared with doing nothing: the price gain on the YES contracts minus the donation.
              Negative means the price move does not earn back what the donation cost. It equals
              shares × (sale price − purchase price) − D.
            </T>
          }
        />
        <Mini
          label="Price move"
          align="right"
          value={st ? pts(st.price_move) : "…"}
          sub={st ? (st.needed_move === null ? "Nothing spent on YES" : `Needs ${pts(st.needed_move)} to break even`) : undefined}
          tip={
            <T title="Price move">
              How far the YES price has risen by the time you sell, against the rise needed to earn back the donation
              (the donation divided by the number of contracts you hold). Profit needs the first number to beat the second.
            </T>
          }
        />
        <Mini
          label="Time to break even"
          value={st ? (be === null || be === undefined ? "Never" : months(be)) : "…"}
          sub={
            st
              ? be === null || be === undefined
                ? "The market never closes enough of the gap"
                : be === 0
                  ? "Nothing to earn back"
                  : "Hold at least this long to earn back the donation"
              : undefined
          }
          tip={
            <T title="Time to break even">
              The hold time at which profit reaches $0. Waiting costs nothing here, so selling later only helps, but the
              market only closes part of the gap with time. &ldquo;Never&rdquo; means that even if the market closed the whole
              gap, the gain would still be smaller than the donation.
            </T>
          }
        />
        <Mini
          label="Best donation"
          align="right"
          value={st ? (st.optimal_donation > 0 ? moneyShort(st.optimal_donation) : "Don't donate") : "…"}
          sub={
            st
              ? st.optimal_donation > 0
                ? `Adds ${money(st.optimal_donation_profit)} at your trade size and sell time`
                : "No donation size pays at your trade size and sell time"
              : undefined
          }
          tip={
            <T title="Best donation">
              The donation that earns the most, with the trade size and sell time where you have set them. $0 means that
              every donated dollar returns less than a dollar through the price move, so the best move is to give nothing.
              A bigger position or a faster market raises it.
            </T>
          }
        />
        <div className="col-span-2 flex items-center gap-3 lg:col-span-1">
          <Tip
            align="right" width="w-72" side="bottom"
            content={<T title="Apply best donation">Sets the donation to the best amount for your trade size and sell time. Your previous charts stay behind as dotted lines.</T>}
          >
            <button onClick={onApply} disabled={!canApply}
              className="rounded-lg bg-series-1 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              Apply best donation
            </button>
          </Tip>
          {hasGhost && (
            <button onClick={onClearGhost} className="text-xs text-ink-3 underline underline-offset-2 hover:text-ink">
              Clear &ldquo;before&rdquo; lines
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Where the money goes: each item is signed, so the bars and the +/− text never rely on colour alone. */
function Breakdown({ o }: { o: MarginalOutcome }) {
  const rows = [
    { label: "Price gain on YES", v: o.price_gain },
    { label: "Donation", v: -o.donation },
  ];
  const total = { label: "Net profit", v: o.profit };
  const max = Math.max(...rows.map((r) => Math.abs(r.v)), Math.abs(total.v), 1);
  const row = (r: { label: string; v: number }, strong = false) => (
    <li key={r.label} className={`grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_5rem] items-center gap-3 text-sm sm:grid-cols-[11rem_minmax(0,1fr)_5.5rem] ${strong ? "border-t border-grid pt-2 font-semibold text-ink" : "text-ink-2"}`}>
      <span className="truncate">{r.label}</span>
      <span className="relative h-3 rounded bg-grid/60" aria-hidden>
        <span className="absolute inset-y-0 left-1/2 w-px bg-axis" />
        <span
          className="absolute inset-y-0 rounded"
          style={{
            background: r.v >= 0 ? "var(--series-3)" : "var(--series-2)",
            width: `${(Math.abs(r.v) / max) * 50}%`,
            [r.v >= 0 ? "left" : "right"]: "50%",
          }}
        />
      </span>
      <span className="text-right font-mono tabular-nums text-ink">{money(r.v)}</span>
    </li>
  );
  return (
    <div className="rounded-xl border border-grid bg-surface p-4">
      <h3 className="text-base font-semibold text-ink">Where the money goes</h3>
      <p className="mb-3 mt-1 text-sm text-ink-2">
        The price gain has to earn back the donation. Bars to the right earn money; bars to the left cost it.
      </p>
      <ul className="space-y-2">
        {rows.map((r) => row(r))}
        {row(total, true)}
      </ul>
    </div>
  );
}

function Sections({
  d, ghost, ui, active, set,
}: { d: MarginalAnalysis; ghost: MarginalAnalysis | null; ui: UiState; active: ParamId | null; set: (p: Partial<UiState>) => void }) {
  const o = d.outcome;
  const st = d.strategy;
  const tc = d.curves.time;
  const dc = d.curves.donation;
  const cc = d.curves.capital;
  const ringed = (n: number) => active !== null && affectedCharts(active).includes(n);
  const caught = ui.halfLife <= 0 ? 1 : 1 - 0.5 ** (ui.hold / ui.halfLife);
  const dflt = DEFAULT_UI;
  const advancedA = ui.baseProb !== dflt.baseProb || ui.effectForm !== dflt.effectForm || ui.effectScale !== dflt.effectScale;
  const be = st.break_even_months;
  const beQ = st.break_even_capital;

  const verdict = (
    <>
      {o.profit > 0 ? (
        <>
          <strong>This plan earns {money(o.profit)}</strong> ({(o.roi * 100).toFixed(1)}% on the money deployed). By month{" "}
          {+ui.hold.toFixed(1)} the market has closed {pct(caught, 0)} of the gap, lifting the price {pts(st.price_move)}.
        </>
      ) : (
        <>
          <strong>This plan loses {money(-o.profit)}.</strong> By month {+ui.hold.toFixed(1)} the market has closed {pct(caught, 0)} of
          the gap and the price is up {pts(st.price_move)}
          {st.needed_move === null ? "." : <>, but the position needs {pts(st.needed_move)} to earn back the donation.</>}
        </>
      )}{" "}
      {beQ !== null ? (
        <>
          Each dollar in YES earns {pct(st.return_per_dollar)}, so the donation is earned back at{" "}
          <strong>{moneyShort(beQ)}</strong> of YES (you have {moneyShort(ui.capital)}).
        </>
      ) : (
        <>The price has not risen, so no position size would earn back the donation.</>
      )}{" "}
      {st.optimal_donation === 0 ? (
        <>
          <strong>Don&apos;t donate at this size.</strong> The first donated dollar returns only{" "}
          <strong>${st.first_dollar_return.toFixed(2)}</strong>, and returns fall from there.
        </>
      ) : (
        <>
          <strong>The best donation is {moneyShort(st.optimal_donation)}</strong>, adding {money(st.optimal_donation_profit)} (the first
          dollar returns ${st.first_dollar_return.toFixed(2)}).
        </>
      )}{" "}
      There are no fees or price impact in this model, so profit grows without limit as the position grows.
    </>
  );

  const g = ghost;
  const ghostPrice: Series[] = g ? [{ key: "g-price", label: "before", color: "", ghost: true, x: g.curves.time.months, y: g.curves.time.market_price }] : [];
  const ghostHold: Series[] = g ? [{ key: "g-hold", label: "before", color: "", ghost: true, x: g.curves.time.months, y: g.curves.time.profit }] : [];
  const ghostDon: Series[] = g ? [{ key: "g-don", label: "before", color: "", ghost: true, x: g.curves.donation.donation, y: g.curves.donation.profit }] : [];
  const ghostCap: Series[] = g ? [{ key: "g-cap", label: "before", color: "", ghost: true, x: g.curves.capital.capital, y: g.curves.capital.profit }] : [];

  const holdLines = [
    { x: ui.hold, label: "Your sale" },
    ...(be !== null && be > 0 && Math.abs(be - ui.hold) > 0.3 ? [{ x: be, label: "Break even" }] : []),
  ];
  const donationLines = [
    { x: ui.donation, label: "Your donation" },
    ...(st.optimal_donation > 0 && Math.abs(st.optimal_donation - ui.donation) > 2e6 ? [{ x: st.optimal_donation, label: "Best" }] : []),
  ];
  const capitalLines = [
    { x: ui.capital, label: "Your trade" },
    ...(beQ !== null && beQ > 0 && Math.abs(beQ - ui.capital) > 20e6 ? [{ x: beQ, label: "Break even" }] : []),
  ];

  const donationSlider = (
    <MSlider param="donation" label="Donation (D)" value={ui.donation} min={0} max={200e6} step={1e6}
      display={m0(ui.donation)} onChange={(v) => set({ donation: v })} />
  );
  const capitalSlider = (
    <MSlider param="capital" label="Money spent on YES" value={ui.capital} min={0} max={1e9} step={10e6}
      display={moneyShort(ui.capital)} readout={`≈ ${(o.shares / 1e6).toFixed(0)}M contracts`}
      onChange={(v) => set({ capital: v })} />
  );
  const holdSlider = (
    <MSlider param="hold" label="Hold time" value={ui.hold} min={0} max={12} step={0.25}
      display={months(ui.hold)} onChange={(v) => set({ hold: v })} />
  );
  const noPay = "The lightest shade means the plan loses money; stronger shades earn more. If the whole grid is the lightest shade, nothing here pays: try a scenario preset.";

  return (
    <>
      <div className="rounded-xl border border-grid bg-surface p-4 text-sm leading-relaxed text-ink">{verdict}</div>
      <Breakdown o={o} />

      <Section letter="A" title="How does the price move over time?"
        question="The donation lifts the true win chance; the market takes time to follow. How long until the donation is earned back?"
        controls={
          <>
            <MSlider param="boost" label="Boost from a $50M donation" value={ui.boost} min={0} max={0.2} step={0.001}
              display={`+${(ui.boost * 100).toFixed(1)} pts`} onChange={(v) => set({ boost: v })} />
            {donationSlider}
            <MSlider param="belief" label="Market belief" value={ui.belief} min={0} max={2} step={0.05}
              display={`${Math.round(ui.belief * 100)}%`} readout="share of the true boost the market prices"
              onChange={(v) => set({ belief: v })} />
            <MSlider param="halfLife" label="Market catch-up half-life" value={ui.halfLife} min={0} max={6} step={0.25}
              display={ui.halfLife === 0 ? "instant" : months(ui.halfLife)} onChange={(v) => set({ halfLife: v })} />
            {holdSlider}
            <AdvancedGroup modified={advancedA}>
              <MSlider param="baseProb" label="Win probability, no donation (p₀)" value={ui.baseProb} min={0.05} max={0.95} step={0.01}
                display={`${(ui.baseProb * 100).toFixed(0)}%`} onChange={(v) => set({ baseProb: v })} />
              <MFormField value={ui.effectForm} onChange={(v) => set({ effectForm: v })} />
              <MSlider param="effectScale" label="Effect scale (s)" value={ui.effectScale} min={1e6} max={100e6} step={1e6}
                display={m0(ui.effectScale)} onChange={(v) => set({ effectScale: v })} />
            </AdvancedGroup>
          </>
        }>
        <ChartCard n={1} ringed={ringed(1)} title="Price over time"
          takeaway={<>The market price starts at <strong>{pct(ui.baseProb, 1)}</strong> and drifts toward <strong>{pct(o.target_price, 1)}</strong>. The true win chance with the donation is {pct(o.true_prob, 1)}.</>}>
          <LineChart
            ariaLabel="Market price of YES over time, with its starting and eventual levels"
            x={tc.months}
            series={[
              { key: "price", label: "Market price", color: CAT[0], y: tc.market_price },
              { key: "target", label: "Eventual price", color: CAT[1], y: tc.target_price, dashed: true },
              { key: "start", label: "Starting price", color: CAT[2], y: tc.start_price, dashed: true },
              ...ghostPrice,
            ]}
            xFormat={months} yFormat={(v) => pct(v, 1)} xTitle="Months after buying and donating" yTitle="YES price"
            vlines={[{ x: ui.hold, label: "Your sale" }]} />
        </ChartCard>

        <ChartCard n={2} ringed={ringed(2)} title="Profit by when you sell"
          takeaway={
            be === null
              ? <>Profit never reaches zero: even if the market closed the whole gap, the gain would be smaller than the donation.</>
              : be === 0
                ? <>There is no donation to earn back, so every sale time is profitable.</>
                : <>Profit rises as the market catches up and breaks even after <strong>{months(be)}</strong>. Waiting costs nothing here, so a longer hold only helps; the curve flattens once the market has caught up.</>
          }>
          <LineChart
            ariaLabel="Net profit by hold time"
            x={tc.months}
            series={[{ key: "net", label: "Net profit", color: CAT[0], y: tc.profit }, ...ghostHold]}
            xFormat={months} yFormat={moneyShort} xTitle="Hold time" yTitle="Profit vs doing nothing"
            zeroLine vlines={holdLines} />
        </ChartCard>
      </Section>

      <Section letter="B" title="How big should the trade be?"
        question="A bigger donation moves the price more; a bigger position earns more from each point. With no fees or price impact, profit grows in a straight line with the position."
        controls={
          <>
            {donationSlider}
            {capitalSlider}
            {holdSlider}
          </>
        }>
        <ChartCard n={3} ringed={ringed(3)} title="Profit by donation size"
          takeaway={
            st.optimal_donation > 0
              ? <>With your trade size and sell time, the best donation is <strong>{moneyShort(st.optimal_donation)}</strong> ({money(st.optimal_donation_profit)}). The peak is where one more donated dollar stops returning a dollar.</>
              : <>At your trade size and sell time, no donation size makes the trade pay.</>
          }>
          <LineChart
            ariaLabel="Net profit by donation size"
            x={dc.donation}
            series={[{ key: "net", label: "Net profit", color: CAT[0], y: dc.profit }, ...ghostDon]}
            xFormat={moneyShort} yFormat={moneyShort} xTitle="Donation" yTitle="Profit vs doing nothing"
            zeroLine vlines={donationLines} />
        </ChartCard>

        <ChartCard n={4} ringed={ringed(4)} title="Profit by trade size"
          takeaway={
            beQ !== null
              ? <>Each dollar in YES earns <strong>{pct(st.return_per_dollar)}</strong>, so profit rises in a straight line. The donation is earned back at <strong>{moneyShort(beQ)}</strong> of YES.</>
              : <>The price has not risen, so no trade size earns back the donation.</>
          }>
          <LineChart
            ariaLabel="Net profit by money spent on YES"
            x={cc.capital}
            series={[{ key: "net", label: "Net profit", color: CAT[0], y: cc.profit }, ...ghostCap]}
            xFormat={moneyShort} yFormat={moneyShort} xTitle="Money spent on YES" yTitle="Profit vs doing nothing"
            zeroLine vlines={capitalLines} />
        </ChartCard>
      </Section>

      <Section letter="C" title="Where does it pay?"
        question="How the answer changes across the time assumptions, and across the two dollar levers.">
        <ChartCard n={5} ringed={ringed(5)} title="When does timing pay?"
          takeaway={<>Profit by hold time and by how slowly the market reacts. A slow market needs a long hold. {noPay}</>}>
          <Heatmap
            ariaLabel="Net profit by hold time and market catch-up half-life"
            xs={d.sweeps.time.hold_months} ys={d.sweeps.time.half_life_months} z={d.sweeps.time.profit} yScale="log"
            xFormat={months} yFormat={(v) => `${v.toFixed(1)} mo`} valueFormat={money}
            xTitle="Hold time" yTitle="Market half-life"
            marker={{ x: ui.hold, y: Math.max(ui.halfLife, 0.1), label: "your scenario" }}
            ghost={g ? { x: g.scenario.hold_months, y: Math.max(g.scenario.half_life_months, 0.1) } : null} />
        </ChartCard>

        <ChartCard n={6} ringed={ringed(6)} title="When does size pay?"
          takeaway={<>Profit by donation and by money spent on YES. The donation is a fixed price of entry; the position size decides whether the price move covers it. {noPay}</>}>
          <Heatmap
            ariaLabel="Net profit by donation and money spent on YES"
            xs={d.sweeps.size.donation} ys={d.sweeps.size.capital} z={d.sweeps.size.profit}
            xFormat={moneyShort} yFormat={moneyShort} valueFormat={money}
            xTitle="Donation" yTitle="Money spent on YES"
            marker={{ x: ui.donation, y: ui.capital, label: "your scenario" }}
            ghost={g ? { x: g.scenario.donation, y: g.scenario.capital } : null} />
        </ChartCard>
      </Section>
    </>
  );
}
