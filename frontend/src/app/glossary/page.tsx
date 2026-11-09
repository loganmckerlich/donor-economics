import type { Metadata } from "next";
import { Suspense } from "react";
import GlossaryApp from "@/components/GlossaryApp";

export const metadata: Metadata = {
  title: "Glossary | Donor Economics",
  description: "Glossary and background notes on hedging, prediction markets and political donations.",
};

export default function GlossaryPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1400px] px-6 py-6 text-sm text-ink-3">Loading…</div>}>
      <GlossaryApp />
    </Suspense>
  );
}
