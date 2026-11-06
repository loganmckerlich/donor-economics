export default function ChartCard({
  title, takeaway, children,
}: { title: string; takeaway: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-grid bg-surface p-4">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mb-3 mt-0.5 text-sm text-ink-2">{takeaway}</p>
      {children}
    </section>
  );
}
