import { ControlPanel } from "./Controls";
import Tip from "./Tip";

export function Mini({
  label, value, sub, tip, align = "left",
}: { label: string; value: string; sub?: string; tip: React.ReactNode; align?: "left" | "right" }) {
  return (
    <Tip content={tip} side="bottom" align={align} width="w-80" focusable className="min-w-0 cursor-help">
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-3 sm:truncate underline decoration-dotted decoration-ink-3/50 underline-offset-4">
        {label}
      </div>
      <div className="truncate text-lg font-semibold tabular-nums text-ink">{value}</div>
      {sub && <div className="text-xs leading-snug text-ink-3">{sub}</div>}
    </Tip>
  );
}

export function Section({
  letter, title, question, controls, children,
}: { letter: string; title: string; question: string; controls?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`sec-${letter}`}>
      <div className="mb-3">
        <h2 id={`sec-${letter}`} className="text-lg font-semibold text-ink">
          <span className="mr-2 text-ink-3">{letter}</span>{title}
        </h2>
        <p className="text-sm text-ink-2">{question}</p>
      </div>
      {controls ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <ControlPanel>{controls}</ControlPanel>
          <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">{children}</div>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">{children}</div>
      )}
    </section>
  );
}
