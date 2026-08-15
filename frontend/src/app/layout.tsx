import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { WalletProvider } from "./providers";

export const metadata: Metadata = {
  title: "AgentTrust - Trust Layer for AI Agents on Stellar",
  description:
    "On-chain agent attestation and reputation registry for the Stellar/Soroban ecosystem",
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
