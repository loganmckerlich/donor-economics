"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ChartCard from "@/components/ChartCard";
import {
  affectedCharts, ControlCtx, ControlPanel, DEFAULT_UI, FormField, FullHedgeToggle, SliderField,
  type ParamId, type UiState,
} from "@/components/Controls";
import Heatmap from "@/components/Heatmap";
import LineChart, { type Series } from "@/components/LineChart";
import Tip, { T } from "@/components/Tip";
import {
  fetchAnalysis, fetchDonationHeatmap, fetchHedgeValue,
  type Analysis, type DonationHeatmap, type HedgeValueHeatmap, type ScenarioParams,
} from "@/lib/api";
import { money, moneyShort, pct, sci } from "@/lib/format";

const FORM_LABEL = { log: "Log", linear: "Linear", saturating: "Saturating" } as const;
const CAT = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];
const m0 = (v: number) => `$${(v / 1e6).toFixed(0)}M`;

/** debounce a value so sliders don't hammer the API */
function useDebounced<T>(value: T, ms = 150): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const sig = (a: Analysis) => JSON.stringify([a.scenario, a.donation, a.hedge]);

export default function Page() {
  const [ui, setUi] = useState<UiState>(DEFAULT_UI);
  const [data, setData] = useState<Analysis | null>(null);
  const [donationMap, setDonationMap] = useState<DonationHeatmap | null>(null);
  const [hedgeMap, setHedgeMap] = useState<HedgeValueHeatmap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<ParamId | null>(null);
  const [ghost, setGhost] = useState<Analysis | null>(null);

  const dataRef = useRef<Analysis | null>(null);
  useEffect(() => { dataRef.current = data; }, [data]);

  const set = useCallback((patch: Partial<UiState>) => setUi((u) => ({ ...u, ...patch })), []);
  const ctx = useMemo(() => ({ set, setActive, snapshot: () => setGhost(dataRef.current) }), [set]);

  const scenario = useMemo<ScenarioParams>(
    () => ({
      payoff_if_win: ui.payoff,
      base_win_prob: ui.baseProb,
      effect_size: ui.effectSize,
      effect_scale: ui.effectScale,
      effect_form: ui.effectForm,
      risk_aversion: ui.gamma / (ui.wealthB * 1e9),
    }),
    [ui.payoff, ui.baseProb, ui.effectSize, ui.effectScale, ui.effectForm, ui.gamma, ui.wealthB],
  );
  const dScenario = useDebounced(scenario);
  const dDonation = useDebounced(ui.donation);
  const dHedge = useDebounced(ui.fullHedge ? null : ui.hedge);

  useEffect(() => {
    const ac = new AbortController();
    fetchAnalysis(dScenario, dDonation, dHedge, ac.signal)
      .then((d) => { setData(d); setError(null); })
      .catch((e) => { if (e.name !== "AbortError") setError(String(e.message ?? e)); });
    return () => ac.abort();
  }, [dScenario, dDonation, dHedge]);

  useEffect(() => {
    const ac = new AbortController();
    fetchDonationHeatmap(dScenario, ac.signal).then(setDonationMap).catch(() => {});
    fetchHedgeValue(dScenario, ac.signal).then(setHedgeMap).catch(() => {});
    return () => ac.abort();
  }, [dScenario]);

  const visibleGhost = ghost && data && sig(ghost) !== sig(data) ? ghost : null;
  const applyOptimal = () => {
    if (!data) return;
    setGhost(data);
    set({ donation: data.strategy.optimal_donation, fullHedge: true });
  };

  return (
    <ControlCtx.Provider value={ctx}>
      <SummaryBar d={data} onApply={applyOptimal} hasGhost={!!visibleGhost} onClearGhost={() => setGhost(null)} />
      <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-6 sm:px-6">
        <header>
          <h1 className="text-2xl font-semibold text-ink">Donor hedge explorer</h1>
          <p className="mt-1 max-w-3xl text-sm text-ink-2">
            A donor collects <em>V</em> if their candidate wins. They donate <em>D</em> to raise the odds, then buy NO on a
            prediction market to cover a loss. The market is efficient and already prices in the donation, orders fill at the
            quoted price, and there are no fees. Each section has its own sliders beside the charts they drive; the numbered
            chips on a slider say which charts it changes.
          </p>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-series-2 bg-surface p-4 text-sm text-ink">
            Could not reach the API ({error}). Start it with{" "}
            <code className="font-mono">uvicorn app.main:app --port 8000</code> from <code className="font-mono">backend/</code>.
          </div>
        )}
        {!data && !error && <div className="text-sm text-ink-3">Loading…</div>}
        {data && (
          <Sections d={data} ghost={visibleGhost} ui={ui} active={active} donationMap={donationMap} hedgeMap={hedgeMap} set={set} />
        )}
      </div>
    </ControlCtx.Provider>
  );
}

function Mini({
  label, value, sub, tip, align = "left",
}: { label: string; value: string; sub?: string; tip: React.ReactNode; align?: "left" | "right" }) {
  return (
    <Tip content={tip} side="bottom" align={align} width="w-80" focusable className="min-w-0 cursor-help">
      <div className="truncate text-[11px] font-medium uppercase tracking-wide text-ink-3 underline decoration-dotted decoration-ink-3/50 underline-offset-4">
        {label}
      </div>
      <div className="truncate text-lg font-semibold tabular-nums text-ink">{value}</div>
      {sub && <div className="text-xs leading-snug text-ink-3">{sub}</div>}
    </Tip>
  );
}

function SummaryBar({
  d, onApply, hasGhost, onClearGhost,
}: { d: Analysis | null; onApply: () => void; hasGhost: boolean; onClearGhost: () => void }) {
  const st = d?.strategy;
  const a = d?.scenario.risk_aversion ?? 0;
  return (
    <div className="z-20 border-b border-grid bg-surface/95 backdrop-blur sm:sticky sm:top-0">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 items-start gap-x-6 gap-y-3 px-4 py-2.5 sm:px-6 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <Mini
          label="Best donation"
          value={st ? moneyShort(st.optimal_donation) : "…"}
          sub={st ? (st.optimal_donation === 0 ? "Don't donate: it never pays back" : `Adds ${money(st.optimal_donation_ev)} vs not donating`) : undefined}
          tip={
            <T title="Best donation">
              The donation that maximises the donor&apos;s expected profit compared with not donating at all.
              $0 means that, at these assumptions, every donated dollar returns less than a dollar in expected
              winnings, so the best move is to give nothing.
            </T>
          }
        />
        <Mini
          label="Expected gain from your donation"
          value={st ? money(st.donation_ev) : "…"}
          sub={d ? `vs not donating. Win chance ${pct(d.scenario.base_win_prob)} → ${pct(d.outcome.p_win)}` : undefined}
          tip={
            <T title="Expected gain from your donation">
              Average profit from the donation set by the Donation slider, compared with not donating. Negative means
              you expect to lose money by donating: the extra win probability is not worth the dollars. It equals
              (new win chance − old win chance) × V − D.
            </T>
          }
        />
        <Mini
          label="Risk-free hedge size"
          value={st ? moneyShort(st.full_hedge_size) : "…"}
          sub={st ? `Spend on NO to lock in ${money(st.locked_in_pnl)} either way` : undefined}
          tip={
            <T title="Risk-free hedge size">
              The amount to spend on NO so your profit is the same whether the candidate wins or loses. The market
              price is fair, so this costs nothing in expected profit; it just removes the uncertainty. It equals
              V × (1 − market price of &ldquo;wins&rdquo;). The profit it locks in is shown underneath.
            </T>
          }
        />
        <Mini
          label="Value of hedging"
          value={st ? money(st.ce_gain_from_full_hedge) : "…"}
          sub={a === 0 ? "Risk-neutral: hedging adds nothing" : "Sure dollars gained at your risk aversion"}
          align="right"
          tip={
            <T title="Value of hedging">
              How much better off the full hedge makes you, measured in guaranteed dollars (the &ldquo;certainty
              equivalent&rdquo;: the sure amount you would swap for a risky bet). It is $0 for a donor who only cares
              about the average, and small for a very wealthy donor who is hardly bothered by risk.
            </T>
          }
        />
        <div className="col-span-2 flex items-center gap-3 lg:col-span-1">
          <Tip
            align="right" width="w-72" side="bottom"
            content={
              <T title="Apply optimal strategy">
                Sets the donation to the best amount from the model and switches on the full hedge. Your previous
                charts stay behind as dotted lines so you can compare.
              </T>
            }
          >
            <button onClick={onApply} disabled={!d}
              className="rounded-lg bg-series-1 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              Apply optimal strategy
            </button>
          </Tip>
          {hasGhost && (
            <Tip
              align="right" width="w-64" side="bottom"
              content={<T title="Clear &ldquo;before&rdquo; lines">Removes the dotted lines showing how the charts looked before your last change.</T>}
            >
              <button onClick={onClearGhost} className="text-xs text-ink-3 underline underline-offset-2 hover:text-ink">
                Clear &ldquo;before&rdquo; lines
              </button>
            </Tip>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  letter, title, question, controls, children,
}: { letter: string; title: string; question: string; controls: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`sec-${letter}`}>
      <div className="mb-3">
        <h2 id={`sec-${letter}`} className="text-lg font-semibold text-ink">
          <span className="mr-2 text-ink-3">{letter}</span>{title}
        </h2>
        <p className="text-sm text-ink-2">{question}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <ControlPanel>{controls}</ControlPanel>
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">{children}</div>
      </div>
    </section>
  );
}

function Sections({
  d, ghost, ui, active, donationMap, hedgeMap, set,
}: {
  d: Analysis; ghost: Analysis | null; ui: UiState; active: ParamId | null;
  donationMap: DonationHeatmap | null; hedgeMap: HedgeValueHeatmap | null; set: (p: Partial<UiState>) => void;
}) {
  const st = d.strategy;
  const s = d.scenario;
  const a = s.risk_aversion;
  const firstDollar = (s.payoff_if_win * s.effect_size) / s.effect_scale; // dEV/dD at D = 0, all forms
  const ringed = (n: number) => active !== null && affectedCharts(active).includes(n);

  const verdict = (
    <>
      {st.optimal_donation === 0 ? (
        <>
          <strong>Don&apos;t donate.</strong> The first donated dollar returns only{" "}
          <strong>${firstDollar.toFixed(2)}</strong> in expected winnings (V·k/s), and returns fall from there.
        </>
      ) : (
        <>
          <strong>Donate {moneyShort(st.optimal_donation)}.</strong> That adds{" "}
          <strong>{money(st.optimal_donation_ev)}</strong> of expected value over not donating (the first dollar returns ${firstDollar.toFixed(2)}).
        </>
      )}{" "}
      {a === 0 ? (
        <>A risk-neutral donor is indifferent to hedging: at a fair price it changes the spread of outcomes, never the mean.</>
      ) : (
        <>
          <strong>Hedge fully ({moneyShort(st.full_hedge_size)})</strong>: a fair-priced hedge is free, so any risk-averse
          donor removes all variance. At this risk aversion that is worth{" "}
          <strong>{money(st.ce_gain_from_full_hedge)}</strong> in certainty equivalent.
        </>
      )}
    </>
  );

  const wp = d.curves.win_prob;
  const dEv = d.curves.donation_ev;
  const hc = d.curves.hedge;
  const donationLines = [
    { x: d.donation, label: "Your donation" },
    ...(st.optimal_donation > 0 ? [{ x: st.optimal_donation, label: "Optimal" }] : []),
  ];
  const hedgeLines = [
    { x: d.hedge, label: "Your hedge" },
    ...(Math.abs(d.hedge - st.full_hedge_size) > 0.5e6 ? [{ x: st.full_hedge_size, label: "Full hedge" }] : []),
  ];

  // chart 4: the donor's own risk aversion, plus two references (skipping any that match it)
  const refs = hc.ce_gain_by_a.filter((r) => Math.abs(r.a - a) / r.a > 0.05).slice(0, 2);
  const chart4: Series[] = [
    { key: "you", label: a === 0 ? "Your a = 0" : `Your a = ${sci(a)}`, color: CAT[0], y: hc.ce_gain },
    ...refs.map((r, i) => ({ key: String(r.a), label: `a = ${sci(r.a)}`, color: CAT[i + 1], y: r.values, dashed: true })),
  ];

  const ghostWin: Series[] = ghost
    ? [{
        key: "g-win", label: "before", color: "", ghost: true,
        x: ghost.curves.win_prob.donation, y: ghost.curves.win_prob[ghost.scenario.effect_form],
      }]
    : [];
  const ghostEv: Series[] = ghost
    ? [{ key: "g-ev", label: "before", color: "", ghost: true, x: ghost.curves.donation_ev.donation, y: ghost.curves.donation_ev.ev }]
    : [];
  const ghostPnl: Series[] = ghost
    ? [
        { key: "g-w", label: "before", color: "", ghost: true, x: ghost.curves.hedge.hedge, y: ghost.curves.hedge.pnl_win },
        { key: "g-l", label: "before", color: "", ghost: true, x: ghost.curves.hedge.hedge, y: ghost.curves.hedge.pnl_lose },
      ]
    : [];
  const ghostCe: Series[] = ghost
    ? [{ key: "g-ce", label: "before", color: "", ghost: true, x: ghost.curves.hedge.hedge, y: ghost.curves.hedge.ce_gain }]
    : [];

  const donationSlider = (
    <SliderField param="donation" label="Donation (D)" value={ui.donation} min={0} max={300e6} step={1e6}
      display={m0(ui.donation)} onChange={(v) => set({ donation: v })} />
  );
  const formSelect = <FormField value={ui.effectForm} onChange={(v) => set({ effectForm: v })} />;
  const scaleSlider = (
    <SliderField param="effectScale" label="Effect scale (s)" value={ui.effectScale} min={1e6} max={100e6} step={1e6}
      display={m0(ui.effectScale)} onChange={(v) => set({ effectScale: v })} />
  );

  return (
    <>
      <div className="rounded-xl border border-grid bg-surface p-4 text-sm leading-relaxed text-ink">{verdict}</div>

      <Section letter="A" title="Does the donation pay?"
        question="How much do donated dollars raise the win probability, and is that worth more than the dollars?"
        controls={
          <>
            <SliderField param="payoff" label="Payoff if wins (V)" value={ui.payoff} min={20e6} max={500e6} step={5e6}
              display={m0(ui.payoff)} onChange={(v) => set({ payoff: v })} />
            <SliderField param="baseProb" label="Win probability, no donation (p₀)" value={ui.baseProb} min={0.05} max={0.95} step={0.01}
              display={`${(ui.baseProb * 100).toFixed(0)}%`} onChange={(v) => set({ baseProb: v })} />
            {formSelect}
            <SliderField param="effectSize" label="Effect size (k)" value={ui.effectSize} min={0} max={0.1} step={0.001}
              display={ui.effectSize.toFixed(3)} onChange={(v) => set({ effectSize: v })} />
            {scaleSlider}
            {donationSlider}
          </>
        }>
        <ChartCard n={1} ringed={ringed(1)} title="Donation → win probability"
          takeaway="Each curve is a different assumption about how money buys votes. The selected form is solid; all share k and s.">
          <LineChart
            ariaLabel="Win probability versus donation for three functional forms"
            x={wp.donation}
            series={[
              ...(["log", "linear", "saturating"] as const).map((f, i) => ({
                key: f, label: FORM_LABEL[f] + (f === ui.effectForm ? " ✓" : ""), color: CAT[i],
                y: wp[f], dashed: f !== ui.effectForm,
              })),
              ...ghostWin,
            ]}
            xFormat={moneyShort} yFormat={(v) => pct(v, 0)} xTitle="Donation" yTitle="P(candidate wins)"
            vlines={donationLines} />
        </ChartCard>

        <ChartCard n={2} ringed={ringed(2)} title="Expected value of donating"
          takeaway={<>p(D)·V − D − p₀·V versus not donating. The peak is the optimal donation{st.optimal_donation === 0 ? " (here: zero)" : ""}.</>}>
          <LineChart
            ariaLabel="Expected value of donating versus not donating, by donation size"
            x={dEv.donation}
            series={[{ key: "ev", label: "EV vs none", color: CAT[0], y: dEv.ev }, ...ghostEv]}
            xFormat={moneyShort} yFormat={moneyShort} xTitle="Donation" yTitle="Expected value vs not donating"
            zeroLine vlines={donationLines} />
        </ChartCard>
      </Section>

      <Section letter="B" title="How should the donor hedge?"
        question="Given a donation, how much NO should they buy, and what is the hedge worth to them?"
        controls={
          <>
            {donationSlider}
            <FullHedgeToggle checked={ui.fullHedge} onChange={(v) => set({ fullHedge: v })} />
            <div className={ui.fullHedge ? "opacity-40" : ""}>
              <SliderField param="hedge" label="Hedge (spend on NO)" value={ui.hedge} min={0} max={200e6} step={1e6}
                display={m0(ui.hedge)} onChange={(v) => set({ hedge: v, fullHedge: false })} />
            </div>
            <SliderField param="gamma" label="Risk aversion (γ)" value={ui.gamma} min={0} max={20} step={0.5}
              display={ui.gamma === 0 ? "risk-neutral" : ui.gamma.toFixed(1)} onChange={(v) => set({ gamma: v })} />
            <SliderField param="wealth" label="Donor wealth" value={ui.wealthB} min={0.5} max={100} step={0.5}
              display={`$${ui.wealthB}B`} onChange={(v) => set({ wealthB: v })}
              readout={`a = γ / wealth = ${(ui.gamma / (ui.wealthB * 1e9)).toExponential(1)}`} />
          </>
        }>
        <ChartCard n={3} ringed={ringed(3)} title="Hedge size → payoffs"
          takeaway={<>A fair hedge never changes expected value; it moves the win and lose outcomes toward each other. They meet at the full hedge, <strong>{moneyShort(st.full_hedge_size)}</strong>.</>}>
          <LineChart
            ariaLabel="Profit if the candidate wins, profit if they lose, and expected value, by hedge size"
            x={hc.hedge}
            series={[
              { key: "win", label: "If wins", color: CAT[0], y: hc.pnl_win },
              { key: "lose", label: "If loses", color: CAT[1], y: hc.pnl_lose },
              { key: "ev", label: "Expected", color: CAT[2], y: hc.ev, dashed: true },
              ...ghostPnl,
            ]}
            xFormat={moneyShort} yFormat={moneyShort} xTitle="Hedge (spend on NO)" yTitle="Net profit"
            zeroLine vlines={hedgeLines} />
        </ChartCard>

        <ChartCard n={4} ringed={ringed(4)} title="Hedge size → value to the donor"
          takeaway="Certainty-equivalent gain over not hedging. It peaks at the full hedge and grows with risk aversion. Dashed lines are reference risk-aversion levels.">
          <LineChart
            ariaLabel="Certainty-equivalent gain from hedging by hedge size, for your risk aversion and two reference levels"
            x={hc.hedge}
            series={[...chart4, ...ghostCe]}
            xFormat={moneyShort} yFormat={moneyShort} xTitle="Hedge (spend on NO)" yTitle="Certainty-equivalent gain"
            vlines={hedgeLines} />
        </ChartCard>
      </Section>

      <Section letter="C" title="Where does it pay?"
        question="How the answers change across the whole space of effect sizes, payoffs, risk aversion and donation sizes."
        controls={
          <>
            {formSelect}
            {scaleSlider}
          </>
        }>
        <ChartCard n={5} ringed={ringed(5)} title="When is donating worth it?"
          takeaway="Optimal donation across effect size and payoff. The lowest shade means the best donation is $0; stronger shades are where money buys enough probability to pay.">
          {donationMap ? (
            <Heatmap
              ariaLabel="Optimal donation by effect size and payoff"
              xs={donationMap.payoff} ys={donationMap.effect_size} z={donationMap.optimal_donation}
              xFormat={moneyShort} yFormat={(v) => v.toFixed(3)} valueFormat={moneyShort}
              xTitle="Payoff if wins (V)" yTitle="Effect size (k)"
              marker={{ x: s.payoff_if_win, y: s.effect_size, label: "your scenario" }}
              ghost={ghost ? { x: ghost.scenario.payoff_if_win, y: ghost.scenario.effect_size } : null} />
          ) : <div className="h-[300px] text-sm text-ink-3">Loading…</div>}
        </ChartCard>

        <ChartCard n={6} ringed={ringed(6)} title="When is hedging worth it?"
          takeaway="Certainty-equivalent gain from the full hedge by risk aversion and donation size. It grows with both; for a modestly risk-averse billionaire (a near 4e-10) it is small.">
          {hedgeMap ? (
            <Heatmap
              ariaLabel="Value of the full hedge by risk aversion and donation"
              xs={hedgeMap.donation} ys={hedgeMap.risk_aversion} z={hedgeMap.ce_gain} yScale="log"
              xFormat={moneyShort} yFormat={sci} valueFormat={moneyShort}
              xTitle="Donation" yTitle="Risk aversion (a, per $)"
              marker={a > 0 ? { x: d.donation, y: a, label: "your scenario" } : undefined}
              ghost={ghost && ghost.scenario.risk_aversion > 0 ? { x: ghost.donation, y: ghost.scenario.risk_aversion } : null} />
          ) : <div className="h-[300px] text-sm text-ink-3">Loading…</div>}
        </ChartCard>
      </Section>
    </>
  );
}
