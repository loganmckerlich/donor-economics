"use client";

import { useEffect, useMemo, useState } from "react";
import ChartCard from "@/components/ChartCard";
import Controls, { DEFAULT_UI, type UiState } from "@/components/Controls";
import Heatmap from "@/components/Heatmap";
import LineChart from "@/components/LineChart";
import {
  fetchAnalysis, fetchDonationHeatmap, fetchHedgeValue,
  type Analysis, type DonationHeatmap, type HedgeValueHeatmap, type ScenarioParams,
} from "@/lib/api";
import { money, moneyShort, pct, sci } from "@/lib/format";

const FORM_LABEL = { log: "Log", linear: "Linear", saturating: "Saturating" } as const;

/** debounce a value so sliders don't hammer the API */
function useDebounced<T>(value: T, ms = 150): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-grid bg-surface p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</div>
      <div className="mt-1 text-sm text-ink-2">{sub}</div>
    </div>
  );
}

export default function Page() {
  const [ui, setUi] = useState<UiState>(DEFAULT_UI);
  const [data, setData] = useState<Analysis | null>(null);
  const [donationMap, setDonationMap] = useState<DonationHeatmap | null>(null);
  const [hedgeMap, setHedgeMap] = useState<HedgeValueHeatmap | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const set = (patch: Partial<UiState>) => setUi((u) => ({ ...u, ...patch }));
  const applyOptimal = () => data && set({ donation: data.strategy.optimal_donation, fullHedge: true });

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Donor hedge explorer</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-2">
          A donor collects <em>V</em> if their candidate wins. They donate <em>D</em> to raise the odds, then buy
          NO on a prediction market to cover a loss. The market is efficient and already prices in the donation, orders
          fill at the quoted price, and there are no fees. Move the sliders; every chart recomputes from the Python model.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Controls ui={ui} set={set} onApplyOptimal={applyOptimal} optimalDonation={data?.strategy.optimal_donation ?? null} />
        </aside>

        <main className="min-w-0 space-y-6">
          {error && (
            <div role="alert" className="rounded-xl border border-series-2 bg-surface p-4 text-sm text-ink">
              Could not reach the API ({error}). Start it with{" "}
              <code className="font-mono">uvicorn app.main:app --port 8000</code> from <code className="font-mono">backend/</code>.
            </div>
          )}
          {!data && !error && <div className="text-sm text-ink-3">Loading…</div>}
          {data && <Dashboard d={data} ui={ui} donationMap={donationMap} hedgeMap={hedgeMap} />}
        </main>
      </div>
    </div>
  );
}

function Dashboard({
  d, ui, donationMap, hedgeMap,
}: { d: Analysis; ui: UiState; donationMap: DonationHeatmap | null; hedgeMap: HedgeValueHeatmap | null }) {
  const st = d.strategy;
  const s = d.scenario;
  const a = s.risk_aversion;
  const firstDollar = (s.payoff_if_win * s.effect_size) / s.effect_scale; // dEV/dD at D = 0, all forms
  const p0 = s.base_win_prob;

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
  const refColors = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];

  return (
    <>
      <div className="rounded-xl border border-grid bg-surface p-4 text-sm leading-relaxed text-ink">{verdict}</div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Optimal donation" value={moneyShort(st.optimal_donation)}
          sub={st.optimal_donation === 0 ? "donating never pays at these parameters" : `${money(st.optimal_donation_ev)} EV vs not donating`} />
        <Stat label="Your donation vs none" value={money(st.donation_ev)}
          sub={`win chance ${pct(p0)} → ${pct(d.outcome.p_win)}`} />
        <Stat label="Full hedge" value={moneyShort(st.full_hedge_size)}
          sub={`locks in ${money(st.locked_in_pnl)} either way`} />
        <Stat label="Value of hedging" value={money(st.ce_gain_from_full_hedge)}
          sub={a === 0 ? "risk-neutral: no value" : `certainty equivalent, a = ${sci(a)}`} />
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <ChartCard title="1. Donation → win probability"
          takeaway="Each curve is a different assumption about how money buys votes. The selected form is solid; all share k and s.">
          <LineChart
            ariaLabel="Win probability versus donation for three functional forms"
            x={wp.donation}
            series={(["log", "linear", "saturating"] as const).map((f, i) => ({
              key: f, label: FORM_LABEL[f] + (f === ui.effectForm ? " ✓" : ""), color: refColors[i],
              y: wp[f], dashed: f !== ui.effectForm,
            }))}
            xFormat={moneyShort} yFormat={(v) => pct(v, 0)} xTitle="Donation" yTitle="P(candidate wins)"
            vlines={donationLines} />
        </ChartCard>

        <ChartCard title="2. Does the donation pay?"
          takeaway={<>Expected value of donating <em>D</em> versus not donating: p(D)·V − D − p₀·V. The peak is the optimal donation{st.optimal_donation === 0 ? " (here: zero)" : ""}.</>}>
          <LineChart
            ariaLabel="Expected value of donating versus not donating, by donation size"
            x={dEv.donation}
            series={[{ key: "ev", label: "EV vs none", color: "var(--series-1)", y: dEv.ev }]}
            xFormat={moneyShort} yFormat={moneyShort} xTitle="Donation" yTitle="Expected value vs not donating"
            zeroLine vlines={donationLines} />
        </ChartCard>

        <ChartCard title="3. Hedge size → payoffs"
          takeaway={<>A fair hedge never changes expected value; it only moves the win and lose outcomes toward each other. They meet at the full hedge, <strong>{moneyShort(st.full_hedge_size)}</strong>.</>}>
          <LineChart
            ariaLabel="Profit if the candidate wins, profit if they lose, and expected value, by hedge size"
            x={hc.hedge}
            series={[
              { key: "win", label: "If wins", color: "var(--series-1)", y: hc.pnl_win },
              { key: "lose", label: "If loses", color: "var(--series-2)", y: hc.pnl_lose },
              { key: "ev", label: "Expected", color: "var(--series-3)", y: hc.ev, dashed: true },
            ]}
            xFormat={moneyShort} yFormat={moneyShort} xTitle="Hedge (spend on NO)" yTitle="Net profit"
            zeroLine vlines={hedgeLines} />
        </ChartCard>

        <ChartCard title="4. Hedge size → value to the donor"
          takeaway="Certainty-equivalent gain over not hedging, for three levels of risk aversion. It peaks at the full hedge and is bigger the more risk-averse the donor.">
          <LineChart
            ariaLabel="Certainty-equivalent gain from hedging, by hedge size, for three risk-aversion levels"
            x={hc.hedge}
            series={hc.ce_gain_by_a.map((r, i) => ({
              key: String(r.a), label: `a = ${sci(r.a)}`, color: refColors[i], y: r.values,
            }))}
            xFormat={moneyShort} yFormat={moneyShort} xTitle="Hedge (spend on NO)" yTitle="Certainty-equivalent gain"
            vlines={hedgeLines} />
        </ChartCard>

        <ChartCard title="5. When is donating worth it?"
          takeaway="Optimal donation across effect size and payoff. The lowest shade means the best donation is $0; stronger shades are where money buys enough probability to pay.">
          {donationMap ? (
            <Heatmap
              ariaLabel="Optimal donation by effect size and payoff"
              xs={donationMap.payoff} ys={donationMap.effect_size} z={donationMap.optimal_donation}
              xFormat={moneyShort} yFormat={(v) => v.toFixed(3)} valueFormat={moneyShort}
              xTitle="Payoff if wins (V)" yTitle="Effect size (k)"
              marker={{ x: s.payoff_if_win, y: s.effect_size, label: "current scenario" }} />
          ) : <div className="h-[300px] text-sm text-ink-3">Loading…</div>}
        </ChartCard>

        <ChartCard title="6. When is hedging worth it?"
          takeaway="Certainty-equivalent gain from the full hedge, by risk aversion and donation size. It grows with both; for a modestly risk-averse billionaire (a near 4e-10) it is small.">
          {hedgeMap ? (
            <Heatmap
              ariaLabel="Value of the full hedge by risk aversion and donation"
              xs={hedgeMap.donation} ys={hedgeMap.risk_aversion} z={hedgeMap.ce_gain} yScale="log"
              xFormat={moneyShort} yFormat={sci} valueFormat={moneyShort}
              xTitle="Donation" yTitle="Risk aversion (a, per $)"
              marker={a > 0 ? { x: d.donation, y: a, label: "current scenario" } : undefined} />
          ) : <div className="h-[300px] text-sm text-ink-3">Loading…</div>}
        </ChartCard>
      </div>
    </>
  );
}
