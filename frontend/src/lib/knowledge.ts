export interface DocSummary {
  slug: string;
  title: string;
}
export interface Doc extends DocSummary {
  markdown: string;
}
export interface Term {
  term: string;
  meaning: string;
}

export const fetchDocs = (signal?: AbortSignal): Promise<DocSummary[]> =>
  fetch("/api/knowledge", { signal }).then((r) => {
    if (!r.ok) throw new Error(`knowledge list failed: ${r.status}`);
    return r.json();
  });

export const fetchDoc = (slug: string, signal?: AbortSignal): Promise<Doc> =>
  fetch(`/api/knowledge/${encodeURIComponent(slug)}`, { signal }).then((r) => {
    if (!r.ok) throw new Error(`knowledge doc failed: ${r.status}`);
    return r.json();
  });

/** Pull the `| Term | Meaning |` table out of the "## Glossary" section. */
export function parseGlossary(markdown: string): Term[] {
  const start = markdown.search(/^## Glossary\s*$/m);
  if (start < 0) return [];
  const rest = markdown.slice(start).split("\n").slice(1);
  const terms: Term[] = [];
  for (const line of rest) {
    if (/^## /.test(line)) break;
    if (!line.trim().startsWith("|")) continue;
    const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    if (cells.length < 2 || /^-+$/.test(cells[0].replace(/:/g, "")) || cells[0] === "Term") continue;
    terms.push({ term: cells[0], meaning: cells.slice(1).join(" | ") });
  }
  return terms;
}

/** Everything from "## Sources" onward (sources, reading list, open questions). */
export function sourcesSection(markdown: string): string {
  const i = markdown.search(/^## Sources/m);
  return i < 0 ? markdown : markdown.slice(i);
}

/** How each topic relates to the current model (the model dropped fees, impact and legal). */
export const SCOPE: Record<string, { label: string; note: string }> = {
  "01-hedging-and-risk": {
    label: "In the model",
    note: "Hedging, full-hedge size and risk aversion are core to the current model.",
  },
  "02-prediction-market-mechanics": {
    label: "Mostly outside the model",
    note: "The model assumes a frictionless binary market: no fees, depth or position limits. Useful for realism checks.",
  },
  "03-microstructure-and-price-impact": {
    label: "Outside the model",
    note: "The model assumes the whole order fills at the quoted price, so there is no price impact or signaling.",
  },
  "04-political-donations": {
    label: "In the model",
    note: "Informs the donation-effect curve p(D). Legal-channel details are outside the model.",
  },
  "05-legal-and-regulatory-risk": {
    label: "Outside the model",
    note: "Legality, regulation and taxes are deliberately excluded from the model.",
  },
  "06-quantitative-methods": {
    label: "Partly in the model",
    note: "Expected utility is in the model (CARA). Kelly, Monte Carlo and calibration are future work.",
  },
};
