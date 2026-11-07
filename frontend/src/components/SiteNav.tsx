"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** The two strategy pages are the app's main pages; the glossary supports both. */
const LINKS = [
  { href: "/full-hedge", label: "Full Hedge Strategy" },
  { href: "/marginal-profit", label: "Marginal Profit Strategy" },
  { href: "/glossary", label: "Glossary" },
];

export default function SiteNav() {
  const path = usePathname();
  return (
    <nav aria-label="Primary" className="border-b border-grid bg-surface">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 overflow-x-auto px-4 sm:px-6">
        <Link href="/" className="shrink-0 py-3 text-sm font-semibold text-ink">Donor economics</Link>
        {LINKS.map((l) => {
          const active = path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap border-b-2 py-3 text-sm ${active ? "border-series-1 text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
