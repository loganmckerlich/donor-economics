"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Explorer" },
  { href: "/glossary", label: "Glossary" },
];

export default function SiteNav() {
  const path = usePathname();
  return (
    <nav aria-label="Primary" className="border-b border-grid bg-surface">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4 sm:px-6">
        <span className="py-3 text-sm font-semibold text-ink">Donor hedge</span>
        {LINKS.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`border-b-2 py-3 text-sm ${active ? "border-series-1 text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
