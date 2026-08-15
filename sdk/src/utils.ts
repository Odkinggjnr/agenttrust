import { StrKey } from "@stellar/stellar-sdk";
import { TrustTier } from "./types";

export function getTierFromScore(score: number): TrustTier {
  if (score <= 2000) return "unverified";
  if (score <= 5000) return "emerging";
  if (score <= 7500) return "established";
  if (score <= 9000) return "trusted";
  return "elite";
}

export function getTierScore(tier: TrustTier): number {
  const scores: Record<TrustTier, number> = {
    unverified: 0,
    emerging: 2001,
    established: 5001,
    trusted: 7501,
    elite: 9001,
  };
  return scores[tier];
}

export function isValidStellarAddress(address: string): boolean {
  return StrKey.isValidEd25519PublicKey(address);
}

export function formatScore(score: number): string {
  return (score / 100).toFixed(1);
}

export function formatXLM(stroops: string | number): string {
  const val = typeof stroops === "string" ? parseInt(stroops, 10) : stroops;
  return (val / 10_000_000).toFixed(2);
}
