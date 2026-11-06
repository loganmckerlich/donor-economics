"use client";

import Link from "next/link";
import { Fragment } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const TAGS = { Established: "✓", Contested: "◐", Unverified: "?" } as const;
type Tag = keyof typeof TAGS;

/** Turn [Established] / [Contested] / [Unverified] into badges (symbol + word, never color alone). */
function badges(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string") {
    const parts = node.split(/\[(Established|Contested|Unverified)\]/);
    if (parts.length === 1) return node;
    return parts.map((p, i) =>
      i % 2 ? (
        <span key={i} className="mx-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded border border-axis px-1.5 text-[0.7rem] font-medium not-italic text-ink-2">
          <span aria-hidden>{TAGS[p as Tag]}</span>{p}
        </span>
      ) : (
        <Fragment key={i}>{p}</Fragment>
      ),
    );
  }
  if (Array.isArray(node)) return node.map((n, i) => <Fragment key={i}>{badges(n)}</Fragment>);
  return node;
}

const components: Components = {
  p: ({ children }) => <p>{badges(children)}</p>,
  li: ({ children }) => <li>{badges(children)}</li>,
  td: ({ children }) => <td>{badges(children)}</td>,
  strong: ({ children }) => <strong>{badges(children)}</strong>,
  h2: ({ children }) => <h2>{badges(children)}</h2>,
  h3: ({ children }) => <h3>{badges(children)}</h3>,
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table>{children}</table>
    </div>
  ),
  a: ({ href = "", children }) => {
    // links between knowledgebase files become in-app navigation
    const m = href.match(/^(?:\.\/)?([\w-]+)\.md(?:#.*)?$/);
    if (m) {
      const slug = m[1].toLowerCase() === "readme" ? "overview" : m[1].toLowerCase();
      return <Link href={`/glossary?doc=${slug}`}>{children}</Link>;
    }
    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  },
};

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm max-w-none break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
