import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { WalletProvider } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "AgentTrust - Trust Layer for AI Agents on Stellar",
    template: "%s | AgentTrust",
  },
  description:
    "On-chain agent attestation and reputation registry for the Stellar/Soroban ecosystem. Verify any AI agent before transacting.",
  keywords: [
    "AI agents",
    "trust score",
    "Stellar",
    "Soroban",
    "reputation",
    "x402",
    "blockchain",
    "attestation",
  ],
  openGraph: {
    title: "AgentTrust - Trust Layer for AI Agents on Stellar",
    description:
      "On-chain attestation and reputation registry for the x402 agent economy. Verify any agent before transacting.",
    siteName: "AgentTrust",
    type: "website",
    url: "https://agenttrust-team.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentTrust",
    description:
      "The trust layer for AI agents on Stellar. On-chain reputation and verification.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
