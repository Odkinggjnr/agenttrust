export type TrustTier = "unverified" | "emerging" | "established" | "trusted" | "elite";

export interface ScoreBreakdown {
  successRateComponent: number;
  volumeComponent: number;
  ageComponent: number;
  attestationComponent: number;
  stakeComponent: number;
  total: number;
}

export interface TransactionRecord {
  id: number;
  agentId: number;
  counterparty: string;
  amount: string;
  success: boolean;
  receiptHash: string;
  timestamp: number;
}

export interface ScoreHistory {
  timestamp: number;
  score: number;
}

export function getTrustTier(score: number): TrustTier {
  if (score <= 2000) return "unverified";
  if (score <= 5000) return "emerging";
  if (score <= 7500) return "established";
  if (score <= 9000) return "trusted";
  return "elite";
}

export function getTierLabel(tier: TrustTier): string {
  const labels: Record<TrustTier, string> = {
    unverified: "Unverified",
    emerging: "Emerging",
    established: "Established",
    trusted: "Trusted",
    elite: "Elite",
  };
  return labels[tier];
}

export function getTierColor(tier: TrustTier): string {
  const colors: Record<TrustTier, string> = {
    unverified: "#6B7280",
    emerging: "#F59E0B",
    established: "#3B82F6",
    trusted: "#10B981",
    elite: "#6366F1",
  };
  return colors[tier];
}
