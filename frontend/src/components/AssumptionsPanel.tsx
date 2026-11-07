import {
  ASSUMPTIONS, DEFAULT_SCENARIO_NOTE, DEPENDS, LEFT_OUT, type Assumption, type Dependency,
} from "@/lib/assumptions";

export interface AssumptionsContent {
  note: string;
  assumptions: Assumption[];
  leftOut: Assumption[];
  depends: Dependency[];
}

const HEDGE_CONTENT: AssumptionsContent = {
  note: DEFAULT_SCENARIO_NOTE, assumptions: ASSUMPTIONS, leftOut: LEFT_OUT, depends: DEPENDS,
};

function Card({ a, marker }: { a: Assumption; marker: React.ReactNode }) {
  return (
    <li className="min-w-0 rounded-lg border border-grid p-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border border-axis px-1 text-[11px] font-medium text-ink-2">
          {marker}
        </span>
        <h4 className="text-sm font-semibold text-ink">{a.title}</h4>
      </div>
      <p className="mt-1.5 text-sm text-ink-2">{a.statement}</p>
      <p className="mt-2 border-l-2 border-axis pl-3 text-sm text-ink-2">
        <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-ink-3">Example</span>
        {a.example}
      </p>
    </li>
  );
}

export default function AssumptionsPanel({ content = HEDGE_CONTENT }: { content?: AssumptionsContent }) {
  const { note, assumptions: ASSUMPTIONS, leftOut: LEFT_OUT, depends: DEPENDS } = content;
  return (
    <details id="assumptions" className="group/ap rounded-xl border border-grid bg-surface">
      <summary className="flex cursor-pointer select-none items-center justify-between gap-3 px-4 py-3">
        <span>
          <span className="block text-base font-semibold text-ink">Model assumptions</span>
          <span className="block text-sm text-ink-2">
            {ASSUMPTIONS.length} things the model assumes, {LEFT_OUT.length} it leaves out, and which results depend on which. Each with an example.
          </span>
        </span>
        <span aria-hidden className="shrink-0 text-ink-3 transition-transform group-open/ap:rotate-90">›</span>
      </summary>

      <div className="space-y-6 border-t border-grid px-4 py-4">
        <p className="text-sm text-ink-3">{note}</p>

        <section aria-labelledby="ap-assumes">
          <h3 id="ap-assumes" className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-3">What the model assumes</h3>
          <ol className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ASSUMPTIONS.map((a, i) => <Card key={a.title} a={a} marker={i + 1} />)}
          </ol>
        </section>

        <section aria-labelledby="ap-left-out">
          <h3 id="ap-left-out" className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-3">What it deliberately leaves out</h3>
          <p className="mb-2 text-sm text-ink-2">These are real, but they are not in the model, so the results ignore them.</p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {LEFT_OUT.map((a) => <Card key={a.title} a={a} marker="−" />)}
          </ul>
        </section>

        <section aria-labelledby="ap-depends">
          <h3 id="ap-depends" className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-3">Which results depend on which assumptions</h3>
          <ul className="space-y-3">
            {DEPENDS.map((d) => (
              <li key={d.result} className="rounded-lg border border-grid p-3 text-sm">
                <div className="font-semibold text-ink">{d.result}</div>
                <div className="mt-1 text-ink-2"><span className="text-ink-3">Rests on: </span>{d.rests}</div>
                <div className="mt-1 text-ink-2"><span className="text-ink-3">If that changes: </span>{d.breaks}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </details>
  );
}
