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
import { fetchMarginal, type MarginalAnalysis, type MarginalParams } from "./api";
import { ASSUMPTIONS_CONTENT } from "./assumptions";
import { MFormField, MSlider } from "./fields";
import { PayoffTable, ProbabilitySteps, ResponseTable } from "./parts";
import { isPreset, presetState, PRESETS } from "./presets";
import { affectedCharts, DEFAULT_UI, type ParamId, type UiState } from "./scenario";

const CAT = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];
const m0 = (v: number) => `$${(v / 1e6).toFixed(0)}M`;
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
      payoff_if_win: ui.payoff,
      base_win_prob: ui.baseProb,
      effect_size: boostToK(ui.boost, ui.effectForm, ui.effectScale),
      effect_scale: ui.effectScale,
      effect_form: ui.effectForm,
      donation: ui.donation,
      capital: ui.capital,
      capture: ui.capture,
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
            Instead of hedging, the donor <em>trades</em> the donation. The idea in five steps:
          </p>
          <ol className="mt-2 max-w-3xl list-decimal space-y-0.5 pl-5 text-sm text-ink-2">
            <li><strong className="font-semibold text-ink">Buy YES</strong> at today&apos;s price.</li>
            <li><strong className="font-semibold text-ink">Donate</strong>, which raises the candidate&apos;s win probability.</li>
            <li>The <strong className="font-semibold text-ink">probability goes up</strong>, and the YES price follows.</li>
            <li><strong className="font-semibold text-ink">Sell the YES at a profit</strong>, before the election.</li>
            <li>Optionally, <strong className="font-semibold text-ink">also win the payoff</strong> if the candidate wins.</li>
          </ol>
          <p className="mt-2 max-w-3xl text-sm text-ink-2">
            The profit in step 4 is the same whether or not the candidate wins, because the YES is sold first. What it does not
            remove is the election risk on the payoff, and it adds a new one: how far the market actually follows the donation.
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
              <li>The price captures a <strong className="font-semibold text-ink">set share of the boost</strong> by the time you sell, and nothing else moves it. That share is illustrative, not measured from real markets.</li>
              <li><strong className="font-semibold text-ink">No frictions</strong>: any order fills at the quoted price, with no fees, price impact or cost of cash. So the trade profit grows in a straight line with position size.</li>
              <li>One buy and one sell, <strong className="font-semibold text-ink">before the election</strong>, so the trade profit is the same if the candidate wins or loses.</li>
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
  const canApply = !!st && Math.abs(st.optimal_donation - donation) > 0.5e6;
  return (
    <div className="z-20 border-b border-grid bg-surface/95 sm:sticky sm:top-0 sm:backdrop-blur">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 items-start gap-x-6 gap-y-3 px-4 py-2.5 sm:px-6 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <Mini
          label="Trade profit"
          value={o ? money(o.trade_profit) : "…"}
          sub="Earned whether or not the candidate wins"
          tip={
            <T title="Trade profit">
              What the YES contracts earn: the number of contracts times the rise in their price, before the donation. Because
              you sell before the election, it is the same whether the candidate wins or loses.
            </T>
          }
        />
        <Mini
          label="If the candidate loses"
          align="right"
          value={o ? money(o.payoff_lose) : "…"}
          sub={o ? `Trade profit minus the ${money(o.donation)} donation` : undefined}
          tip={
            <T title="If the candidate loses">
              The donor&apos;s result if the candidate loses: the trade profit minus the donation. Without the trade it would be
              the donation lost. Positive means the donor comes out ahead even though the candidate lost.
            </T>
          }
        />
        <Mini
          label="If the candidate wins"
          value={o ? money(o.payoff_win) : "…"}
          sub={o && d ? `${money(d.scenario.payoff_if_win)} payoff plus the trade, minus the donation` : undefined}
          tip={
            <T title="If the candidate wins">
              The donor&apos;s result if the candidate wins: the win payoff, plus the trade profit, minus the donation. The gap
              between this and the losing case is always the win payoff, so the trade does not remove the election risk.
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
                ? `Adds ${money(st.optimal_donation_ev)} of expected gain`
                : "No donation size pays at these settings"
              : undefined
          }
          tip={
            <T title="Best donation">
              The donation with the highest expected gain, counting both the trade and the higher chance of winning, with the
              other sliders where you have set them. $0 means every donated dollar returns less than a dollar, so the best move
              is to give nothing.
            </T>
          }
        />
        <div className="col-span-2 flex items-center gap-3 lg:col-span-1">
          <Tip
            align="right" width="w-72" side="bottom"
            content={<T title="Apply best donation">Sets the donation to the best amount for your other settings. Your previous charts stay behind as dotted lines.</T>}
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

const standing = (v: number) => (v >= 0 ? <strong>{money(v)} ahead</strong> : <strong>{money(-v)} behind</strong>);

function Sections({
  d, ghost, ui, active, set,
}: { d: MarginalAnalysis; ghost: MarginalAnalysis | null; ui: UiState; active: ParamId | null; set: (p: Partial<UiState>) => void }) {
  const o = d.outcome;
  const st = d.strategy;
  const cc = d.curves.capital;
  const dc = d.curves.donation;
  const pc = d.curves.capture;
  const ringed = (n: number) => active !== null && affectedCharts(active).includes(n);
  const dflt = DEFAULT_UI;
  const advancedA = ui.baseProb !== dflt.baseProb || ui.effectForm !== dflt.effectForm || ui.effectScale !== dflt.effectScale;
  const beQ = st.break_even_capital;
  const beC = st.break_even_capture;
  const expectedAbs = (win: number[], lose: number[]) => win.map((w, i) => o.true_prob * w + (1 - o.true_prob) * lose[i]);

  const verdict = (
    <>
      If the candidate loses, the donor is {standing(o.payoff_lose)}: the trade earns <strong>{money(o.trade_profit)}</strong> and the
      donation costs {money(o.donation)}. If the candidate wins, the donor is {standing(o.payoff_win)}. The trade adds the same{" "}
      {money(o.trade_profit)} to both outcomes.{" "}
      {beQ !== null ? (
        <>
          Each dollar in YES earns {pct(st.return_per_dollar)}, so the trade alone covers the donation at{" "}
          <strong>{moneyShort(beQ)}</strong> of YES (you have {moneyShort(ui.capital)}).
        </>
      ) : (
        <>The price has not risen, so the trade earns nothing at any size and the worst case is the donation itself.</>
      )}{" "}
      {st.optimal_donation === 0 ? (
        <>
          <strong>Don&apos;t donate at these settings.</strong> The first donated dollar returns only{" "}
          <strong>${st.first_dollar_return.toFixed(2)}</strong>, and returns fall from there.
        </>
      ) : (
        <>
          <strong>The best donation is {moneyShort(st.optimal_donation)}</strong>, adding {money(st.optimal_donation_ev)} of expected
          gain (the first dollar returns ${st.first_dollar_return.toFixed(2)}).
        </>
      )}{" "}
      Expected gain from your plan: <strong>{money(o.ev)}</strong> ({money(o.profit)} from the trade net of the donation, plus{" "}
      {money(o.win_value)} from the higher win chance). There are no fees or price impact in this model, so the trade grows
      without limit as the position grows.
    </>
  );

  const g = ghost;
  const ghostCap: Series[] = g ? [{ key: "g-cap", label: "before", color: "", ghost: true, x: g.curves.capital.capital, y: g.curves.capital.payoff_lose }] : [];
  const ghostDon: Series[] = g ? [{ key: "g-don", label: "before", color: "", ghost: true, x: g.curves.donation.donation, y: g.curves.donation.ev }] : [];
  const ghostCapture: Series[] = g ? [{ key: "g-cpt", label: "before", color: "", ghost: true, x: g.curves.capture.capture, y: g.curves.capture.ev }] : [];

  const capitalLines = [
    { x: ui.capital, label: "Your trade" },
    ...(beQ !== null && beQ > 0 && Math.abs(beQ - ui.capital) > 20e6 ? [{ x: beQ, label: "Loses break even" }] : []),
  ];
  const donationLines = [
    { x: ui.donation, label: "Your donation" },
    ...(st.optimal_donation > 0 && Math.abs(st.optimal_donation - ui.donation) > 2e6 ? [{ x: st.optimal_donation, label: "Best" }] : []),
  ];
  const captureLines = [
    { x: ui.capture, label: "Your setting" },
    ...(beC !== null && beC > 0 && Math.abs(beC - ui.capture) > 0.05 ? [{ x: beC, label: "Break even" }] : []),
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
  const captureSlider = (
    <MSlider param="capture" label="Share of the boost the price captures" value={ui.capture} min={0} max={2} step={0.05}
      display={`${Math.round(ui.capture * 100)}%`} readout={`price ${pct(d.scenario.base_win_prob, 1)} → ${pct(o.price_after, 1)}`}
      onChange={(v) => set({ capture: v })} />
  );
  const noPay = "The lightest shade means the plan loses money in expectation; stronger shades earn more. If the whole grid is the lightest shade, nothing here pays: try a scenario preset.";

  return (
    <>
      <div className="rounded-xl border border-grid bg-surface p-4 text-sm leading-relaxed text-ink">{verdict}</div>

      <Section letter="A" title="How does the trade work?"
        question="The donation lifts the true win chance; the price follows. What does the donor end up with if the candidate wins, and if they lose?"
        controls={
          <>
            <MSlider param="boost" label="Boost from a $50M donation" value={ui.boost} min={0} max={0.2} step={0.001}
              display={`+${(ui.boost * 100).toFixed(1)} pts`} onChange={(v) => set({ boost: v })} />
            {donationSlider}
            {capitalSlider}
            {captureSlider}
            <MSlider param="payoff" label="Payoff if the candidate wins (V)" value={ui.payoff} min={0} max={2e9} step={10e6}
              display={ui.payoff === 0 ? "none (pure trade)" : moneyShort(ui.payoff)} onChange={(v) => set({ payoff: v })} />
            <AdvancedGroup modified={advancedA}>
              <MSlider param="baseProb" label="Win probability, no donation (p₀)" value={ui.baseProb} min={0.05} max={0.95} step={0.01}
                display={`${(ui.baseProb * 100).toFixed(0)}%`} onChange={(v) => set({ baseProb: v })} />
              <MFormField value={ui.effectForm} onChange={(v) => set({ effectForm: v })} />
              <MSlider param="effectScale" label="Effect scale (s)" value={ui.effectScale} min={1e6} max={100e6} step={1e6}
                display={m0(ui.effectScale)} onChange={(v) => set({ effectScale: v })} />
            </AdvancedGroup>
          </>
        }>
        <ChartCard n={1} ringed={ringed(1)} title="How the probability moves"
          takeaway={<>The donation lifts the true win chance by <strong>{pts(st.true_move)}</strong>. The price captures {pct(ui.capture, 0)} of that, so it moves <strong>{pts(st.price_move)}</strong>, and that is what the trade earns on.</>}>
          <ProbabilitySteps start={d.scenario.base_win_prob} price={o.price_after} truth={o.true_prob} />
        </ChartCard>

        <ChartCard n={2} ringed={ringed(2)} title="Payoff by outcome"
          takeaway={<>The trade earns <strong>{money(o.trade_profit)}</strong> whichever way the election goes, so the losing case improves from {money(o.payoff_lose_no_trade)} to <strong>{money(o.payoff_lose)}</strong>.</>}>
          <PayoffTable o={o} />
        </ChartCard>
      </Section>

      <Section letter="B" title="How big should it be?"
        question="A bigger position earns more on each point of price move; a bigger donation moves the price more. With no fees or price impact, the trade grows in a straight line with the position."
        controls={
          <>
            {donationSlider}
            {capitalSlider}
          </>
        }>
        <ChartCard n={3} ringed={ringed(3)} title="Payoff by trade size"
          takeaway={<>Buying more YES lifts both outcomes by the same amount, so the gap between winning and losing stays at <strong>{moneyShort(d.scenario.payoff_if_win)}</strong>.{beQ !== null && <> If the candidate loses, the donor breaks even at <strong>{moneyShort(beQ)}</strong> of YES.</>}</>}>
          <LineChart
            ariaLabel="Payoff if the candidate wins, if they lose, and expected, by money spent on YES"
            x={cc.capital}
            series={[
              { key: "win", label: "If wins", color: CAT[0], y: cc.payoff_win },
              { key: "lose", label: "If loses", color: CAT[1], y: cc.payoff_lose },
              { key: "exp", label: "Expected", color: CAT[2], y: expectedAbs(cc.payoff_win, cc.payoff_lose), dashed: true },
              ...ghostCap,
            ]}
            xFormat={moneyShort} yFormat={moneyShort} xTitle="Money spent on YES" yTitle="Payoff, after the donation"
            zeroLine vlines={capitalLines} />
        </ChartCard>

        <ChartCard n={4} ringed={ringed(4)} title="Profit by donation size"
          takeaway={
            st.optimal_donation > 0
              ? <>The best donation is <strong>{moneyShort(st.optimal_donation)}</strong> ({money(st.optimal_donation_ev)} of expected gain). The peak is where one more donated dollar stops returning a dollar.</>
              : <>At these settings no donation size pays: every donated dollar returns less than a dollar.</>
          }>
          <LineChart
            ariaLabel="Expected gain and the trade net of the donation, by donation size"
            x={dc.donation}
            series={[
              { key: "ev", label: "Expected gain", color: CAT[0], y: dc.ev },
              { key: "lose", label: "If loses", color: CAT[1], y: dc.profit, dashed: true },
              ...ghostDon,
            ]}
            xFormat={moneyShort} yFormat={moneyShort} xTitle="Donation" yTitle="Gain vs doing nothing"
            zeroLine vlines={donationLines} />
        </ChartCard>
      </Section>

      <Section letter="C" title="What if the market responds differently?"
        question="The election result does not change the trade profit, but the market's reaction does. This is where the risk in the trade sits."
        controls={
          <>
            {captureSlider}
            {capitalSlider}
          </>
        }>
        <ChartCard n={5} ringed={ringed(5)} title="Profit by market response"
          takeaway={<>The trade earns back the donation once the price captures <strong>{beC === null ? "—" : pct(beC, 0)}</strong> of the boost. If the market ignores the donation, the worst case is {money(d.responses[0].payoff_lose)}: just the donation.</>}>
          <LineChart
            ariaLabel="Expected gain and the result if the candidate loses, by share of the boost the price captures"
            x={pc.capture}
            series={[
              { key: "ev", label: "Expected gain", color: CAT[0], y: pc.ev },
              { key: "lose", label: "If loses", color: CAT[1], y: pc.profit, dashed: true },
              ...ghostCapture,
            ]}
            xFormat={(v) => pct(v, 0)} yFormat={moneyShort} xTitle="Share of the boost the price captures" yTitle="Gain vs doing nothing"
            zeroLine vlines={captureLines} />
          <ResponseTable responses={d.responses} />
        </ChartCard>

        <ChartCard n={6} ringed={ringed(6)} title="When does size pay?"
          takeaway={<>Expected gain by donation and by money spent on YES. The donation is a fixed price of entry; the position size decides whether the price move covers it. {noPay}</>}>
          <Heatmap
            ariaLabel="Expected gain by donation and money spent on YES"
            xs={d.sweeps.size.donation} ys={d.sweeps.size.capital} z={d.sweeps.size.ev}
            xFormat={moneyShort} yFormat={moneyShort} valueFormat={money}
            xTitle="Donation" yTitle="Money spent on YES"
            marker={{ x: ui.donation, y: ui.capital, label: "your scenario" }}
            ghost={g ? { x: g.scenario.donation, y: g.scenario.capital } : null} />
        </ChartCard>
      </Section>
    </>
  );
}
