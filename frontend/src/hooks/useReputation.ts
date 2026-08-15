"use client";
import { useState, useEffect } from "react";
import type { ScoreBreakdown, TrustTier, TransactionRecord, ScoreHistory } from "@/types/reputation";
import { getTrustTier } from "@/types/reputation";

interface UseReputationReturn {
  score: number;
  breakdown: ScoreBreakdown | null;
  tier: TrustTier;
  history: TransactionRecord[];
  scoreHistory: ScoreHistory[];
  isLoading: boolean;
  error: string | null;
}

// Deterministic pseudo-random from seed
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return (state >>> 0) / 0xffffffff;
  };
}

function generateMockAddress(rand: () => number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let address = "G";
  for (let i = 1; i < 56; i++) {
    address += chars[Math.floor(rand() * chars.length)];
  }
  return address;
}

function generateMockHash(rand: () => number): string {
  const hexChars = "abcdef0123456789";
  let hash = "";
  for (let i = 0; i < 64; i++) {
    hash += hexChars[Math.floor(rand() * hexChars.length)];
  }
  return hash;
}

function generateMockBreakdown(rand: () => number, totalScore: number): ScoreBreakdown {
  // Distribute the total score across components with realistic proportions
  const successRateWeight = 0.30;
  const volumeWeight = 0.20;
  const ageWeight = 0.15;
  const attestationWeight = 0.20;
  const stakeWeight = 0.15;

  // Add slight variance to each component
  const variance = () => 0.8 + rand() * 0.4;

  const rawSuccess = totalScore * successRateWeight * variance();
  const rawVolume = totalScore * volumeWeight * variance();
  const rawAge = totalScore * ageWeight * variance();
  const rawAttestation = totalScore * attestationWeight * variance();
  const rawStake = totalScore * stakeWeight * variance();

  // Normalize so they sum to the total score
  const rawTotal = rawSuccess + rawVolume + rawAge + rawAttestation + rawStake;
  const scale = totalScore / rawTotal;

  return {
    successRateComponent: Math.round(rawSuccess * scale),
    volumeComponent: Math.round(rawVolume * scale),
    ageComponent: Math.round(rawAge * scale),
    attestationComponent: Math.round(rawAttestation * scale),
    stakeComponent: Math.round(rawStake * scale),
    total: totalScore,
  };
}

function generateMockTransactions(agentId: number, rand: () => number): TransactionRecord[] {
  const records: TransactionRecord[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(rand() * 90) + 1;
    const amount = Math.floor(rand() * 50000000000) + 1000000; // 0.1 to 5000 XLM in stroops

    records.push({
      id: agentId * 1000 + i,
      agentId,
      counterparty: generateMockAddress(rand),
      amount: amount.toString(),
      success: rand() > 0.15, // 85% success rate
      receiptHash: generateMockHash(rand),
      timestamp: now - daysAgo * 86400 - Math.floor(rand() * 86400),
    });
  }

  return records.sort((a, b) => b.timestamp - a.timestamp);
}

function generateMockScoreHistory(totalScore: number, rand: () => number): ScoreHistory[] {
  const history: ScoreHistory[] = [];
  const now = Math.floor(Date.now() / 1000);
  const startScore = Math.max(0, totalScore - Math.floor(rand() * 3000) - 1000);

  for (let i = 0; i < 20; i++) {
    // Score grows roughly from startScore to totalScore over 20 data points
    const progress = i / 19;
    const baseScore = startScore + (totalScore - startScore) * progress;
    // Add some noise
    const noise = (rand() - 0.5) * 400;
    const score = Math.max(0, Math.min(10000, Math.round(baseScore + noise)));

    const daysAgo = Math.floor((19 - i) * (180 / 19)); // Spread over ~180 days
    history.push({
      timestamp: now - daysAgo * 86400,
      score,
    });
  }

  // Ensure the last point matches the actual current score
  history[history.length - 1].score = totalScore;

  return history;
}

export function useReputation(agentId: number | null): UseReputationReturn {
  const [score, setScore] = useState(0);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [tier, setTier] = useState<TrustTier>("unverified");
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agentId === null) {
      setScore(0);
      setBreakdown(null);
      setTier("unverified");
      setHistory([]);
      setScoreHistory([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      if (cancelled) return;

      try {
        const rand = seededRandom(agentId * 3571);

        // Generate a score consistent with the agent
        const mockScore = Math.floor(rand() * 10000);
        const mockBreakdown = generateMockBreakdown(rand, mockScore);
        const mockTier = getTrustTier(mockScore);
        const mockHistory = generateMockTransactions(agentId, rand);
        const mockScoreHistory = generateMockScoreHistory(mockScore, rand);

        setScore(mockScore);
        setBreakdown(mockBreakdown);
        setTier(mockTier);
        setHistory(mockHistory);
        setScoreHistory(mockScoreHistory);
        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch reputation data");
          setIsLoading(false);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [agentId]);

  return { score, breakdown, tier, history, scoreHistory, isLoading, error };
}
