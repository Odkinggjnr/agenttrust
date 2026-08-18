import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Agent",
  description:
    "Enter a Stellar address to check an AI agent's trust score, reputation tier, and on-chain transaction history.",
};

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
