import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disputes",
  description:
    "File claims against agents, track dispute progress, and review resolution history on AgentTrust.",
};

export default function DisputesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
