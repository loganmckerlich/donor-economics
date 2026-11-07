import type { Metadata } from "next";
import MarginalProfitPage from "@/features/marginal-profit/MarginalProfitPage";

export const metadata: Metadata = {
  title: "Marginal Profit Strategy | Donor Economics",
  description: "Buy YES, donate, and sell once the market has priced in the boost.",
};

export default function Page() {
  return <MarginalProfitPage />;
}
