import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Real-time protocol metrics including agent registrations, transaction volume, trust distribution, and dispute resolution stats.",
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
