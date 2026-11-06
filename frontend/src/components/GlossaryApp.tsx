"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  SCOPE, fetchDoc, fetchDocs, parseGlossary, sourcesSection,
  type Doc, type DocSummary,
} from "@/lib/knowledge";
import Markdown from "./Markdown";

const GLOSSARY_SRC = "07-glossary-and-sources";

interface NavItem { id: string; label: string; source: string }

function buildNav(docs: DocSummary[]): NavItem[] {
  const items: NavItem[] = [{ id: "glossary", label: "Glossary of terms", source: GLOSSARY_SRC }];
  for (const d of docs) {
    if (d.slug === GLOSSARY_SRC) continue;
    items.push({
      id: d.slug,
      label: d.slug === "overview" ? "Overview and key findings" : d.title.replace(/^\d+\s+/, ""),
      source: d.slug,
    });
  }
  items.push({ id: "sources", label: "Sources and reading list", source: GLOSSARY_SRC });
  return items;
}

function GlossaryView({ markdown }: { markdown: string }) {
  const [q, setQ] = useState("");
  const terms = useMemo(() => parseGlossary(markdown), [markdown]);
  const shown = terms.filter((t) => `${t.term} ${t.meaning}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <h1 className="text-xl font-semibold text-ink">Glossary of terms</h1>
      <p className="mt-1 text-sm text-ink-2">Plain definitions of the market, risk and campaign-finance terms used across the notes.</p>
      <input
        type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms"
        aria-label="Search glossary terms"
        className="mt-4 w-full max-w-md rounded-md border border-axis bg-surface px-3 py-2 text-sm"
      />
      <div className="mt-1 text-xs text-ink-3">{shown.length} of {terms.length} terms</div>
      <dl className="mt-3 divide-y divide-grid rounded-xl border border-grid bg-surface">
        {shown.map((t) => (
          <div key={t.term} className="grid gap-1 px-4 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
            <dt className="text-sm font-medium text-ink">{t.term}</dt>
            <dd className="text-sm text-ink-2">{t.meaning}</dd>
          </div>
        ))}
        {shown.length === 0 && <div className="px-4 py-6 text-sm text-ink-3">No terms match &ldquo;{q}&rdquo;.</div>}
      </dl>
    </>
  );
}

export default function GlossaryApp() {
  const params = useSearchParams();
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [cache, setCache] = useState<Record<string, Doc>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetchDocs(ac.signal).then(setDocs).catch((e) => { if (e.name !== "AbortError") setError(e.message); });
    return () => ac.abort();
  }, []);

  const nav = useMemo(() => (docs ? buildNav(docs) : []), [docs]);
  const id = params.get("doc") ?? "glossary";
  const current = nav.find((n) => n.id === id) ?? nav[0];
  const doc = current ? cache[current.source] : undefined;

  useEffect(() => {
    if (!current || cache[current.source]) return;
    const ac = new AbortController();
    fetchDoc(current.source, ac.signal)
      .then((d) => setCache((c) => ({ ...c, [d.slug]: d })))
      .catch((e) => { if (e.name !== "AbortError") setError(e.message); });
    return () => ac.abort();
  }, [current, cache]);

  const scope = current ? SCOPE[current.id] : undefined;
  const isTopic = current && current.id !== "glossary" && current.id !== "sources";

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-series-2 bg-surface p-4 text-sm text-ink">
          Could not load the knowledgebase ({error}). Is the API running on port 8000?
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <nav aria-label="Knowledgebase" className="lg:sticky lg:top-4 lg:self-start">
          <ul className="space-y-1 rounded-xl border border-grid bg-surface p-2">
            {nav.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.id === "glossary" ? "/glossary" : `/glossary?doc=${n.id}`}
                  aria-current={current?.id === n.id ? "page" : undefined}
                  className={`block rounded-md px-3 py-2 text-sm ${current?.id === n.id ? "bg-page font-medium text-ink" : "text-ink-2 hover:bg-page"}`}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0">
          {!doc && !error && <div className="text-sm text-ink-3">Loading…</div>}
          {doc && current && (
            <>
              {isTopic && (
                <div className="mb-4 space-y-2">
                  {scope && (
                    <div className="rounded-xl border border-grid bg-surface px-4 py-3 text-sm text-ink-2">
                      <span className="mr-2 rounded border border-axis px-1.5 py-0.5 text-xs font-medium text-ink">{scope.label}</span>
                      {scope.note}
                    </div>
                  )}
                </div>
              )}
              <article className="rounded-xl border border-grid bg-surface p-5 sm:p-6">
                {current.id === "glossary" ? (
                  <GlossaryView markdown={doc.markdown} />
                ) : current.id === "sources" ? (
                  <Markdown>{sourcesSection(doc.markdown)}</Markdown>
                ) : (
                  <Markdown>{doc.markdown}</Markdown>
                )}
              </article>
              <p className="mt-3 text-xs text-ink-3">
                Web-researched background, partly unverified. Not legal or financial advice.
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
