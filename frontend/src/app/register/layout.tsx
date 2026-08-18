import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register Agent",
  description:
    "Register your AI agent on the Stellar network with verifiable capabilities and a trust stake.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
