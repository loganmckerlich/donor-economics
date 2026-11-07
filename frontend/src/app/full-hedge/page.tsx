import type { Metadata } from "next";
import FullHedgePage from "@/features/full-hedge/FullHedgePage";

export const metadata: Metadata = {
  title: "Full Hedge Strategy | Donor Economics",
  description: "Donate to raise a candidate's odds, then hedge the rest on a prediction market.",
};

export default function Page() {
  return <FullHedgePage />;
}
