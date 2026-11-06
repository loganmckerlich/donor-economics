export default function ChartCard({
  n, title, takeaway, ringed, children,
}: { n: number; title: string; takeaway: React.ReactNode; ringed?: boolean; children: React.ReactNode }) {
  return (
    <section
      id={`chart-${n}`}
      className={`rounded-xl border bg-surface p-4 transition-shadow ${
        ringed ? "border-series-1 shadow-[0_0_0_2px_var(--series-1)]" : "border-grid"
      }`}
    >
      <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-axis text-xs font-medium text-ink-2">{n}</span>
        {title}
      </h3>
      <p className="mb-3 mt-1 text-sm text-ink-2">{takeaway}</p>
      {children}
    </section>
  );
}
