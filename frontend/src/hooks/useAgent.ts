"use client";
import { useState, useEffect, useCallback } from "react";
import type { Agent, Attestation, AttestationType } from "@/types/agent";
import type { Claim, ClaimType, ClaimStatus } from "@/types/contract";

interface UseAgentReturn {
  agent: Agent | null;
  attestations: Attestation[];
  claims: Claim[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
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

const AGENT_NAMES = [
  "SentinelAI", "DataForge", "PayStream", "LinguaBot",
  "VisionX", "AnalyticsPro", "ScribeAgent", "TradeGuard",
  "InsightMiner", "PixelCraft", "ChainRelay", "DocuMint",
];

const CAPABILITY_OPTIONS = [
  "text-generation", "text-analysis", "translation",
  "image-generation", "image-recognition",
  "data-retrieval", "data-analysis", "web-scraping",
  "payment-processing", "invoicing",
];

const ATTESTATION_TYPES: AttestationType[] = [
  "transaction_success", "transaction_failure",
  "quality_review", "security_audit", "peer_endorsement",
];

const CLAIM_TYPES: ClaimType[] = [
  "non_delivery", "poor_quality", "fraud", "overcharge", "other",
];

const CLAIM_STATUSES: ClaimStatus[] = ["open", "responded", "resolved"];

function generateMockAgent(agentId: number): Agent {
  const rand = seededRandom(agentId * 7919);
  const nameIndex = agentId % AGENT_NAMES.length;
  const score = Math.floor(rand() * 10000);
  const totalTx = Math.floor(rand() * 500) + 10;
  const successRate = 0.7 + rand() * 0.29;
  const successfulTx = Math.floor(totalTx * successRate);
  const volume = Math.floor(rand() * 500000000000) + 10000000; // in stroops
  const daysAgo = Math.floor(rand() * 365) + 30;
  const registeredAt = Math.floor(Date.now() / 1000) - daysAgo * 86400;
  const stakeAmount = Math.floor(rand() * 50000000000) + 1000000000; // 100-5100 XLM in stroops

  const numCapabilities = Math.floor(rand() * 4) + 1;
  const capabilities: string[] = [];
  const shuffled = [...CAPABILITY_OPTIONS].sort(() => rand() - 0.5);
  for (let i = 0; i < numCapabilities && i < shuffled.length; i++) {
    capabilities.push(shuffled[i]);
  }

  const statuses: Agent["status"][] = ["active", "active", "active", "active", "suspended", "deregistering"];

  return {
    id: agentId,
    owner: generateMockAddress(rand),
    agentAddress: generateMockAddress(rand),
    metadataUri: `ipfs://Qm${generateMockHash(rand).slice(0, 44)}`,
    capabilities,
    trustScore: score,
    totalTransactions: totalTx,
    successfulTransactions: successfulTx,
    totalVolume: volume.toString(),
    registeredAt,
    stake: stakeAmount.toString(),
    status: statuses[Math.floor(rand() * statuses.length)],
  };
}

function generateMockAttestations(agentId: number, rand: () => number): Attestation[] {
  const count = Math.floor(rand() * 3) + 3; // 3-5
  const attestations: Attestation[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(rand() * 60) + 1;
    attestations.push({
      id: agentId * 100 + i,
      agentId,
      attester: generateMockAddress(rand),
      attestationType: ATTESTATION_TYPES[Math.floor(rand() * ATTESTATION_TYPES.length)],
      dataHash: generateMockHash(rand),
      timestamp: now - daysAgo * 86400,
      revoked: rand() < 0.1, // 10% revoked
    });
  }

  return attestations.sort((a, b) => b.timestamp - a.timestamp);
}

function generateMockClaims(agentId: number, rand: () => number): Claim[] {
  const count = Math.floor(rand() * 3); // 0-2
  const claims: Claim[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(rand() * 90) + 1;
    const status = CLAIM_STATUSES[Math.floor(rand() * CLAIM_STATUSES.length)];
    const isResolved = status === "resolved";

    claims.push({
      id: agentId * 100 + 50 + i,
      claimant: generateMockAddress(rand),
      agentId,
      transactionHash: generateMockHash(rand),
      claimType: CLAIM_TYPES[Math.floor(rand() * CLAIM_TYPES.length)],
      evidenceHash: generateMockHash(rand),
      responseHash: status !== "open" ? generateMockHash(rand) : undefined,
      status,
      resolution: isResolved
        ? (["against_agent", "for_agent", "dismissed"] as const)[Math.floor(rand() * 3)]
        : undefined,
      filedAt: now - daysAgo * 86400,
      resolvedAt: isResolved ? now - Math.floor(rand() * daysAgo) * 86400 : undefined,
    });
  }

  return claims.sort((a, b) => b.filedAt - a.filedAt);
}

export function useAgent(agentId: number | null): UseAgentReturn {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  const refetch = useCallback(() => {
    setFetchCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (agentId === null) {
      setAgent(null);
      setAttestations([]);
      setClaims([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    // Simulate async fetch with small delay
    const timer = setTimeout(() => {
      if (cancelled) return;

      try {
        const rand = seededRandom(agentId * 13 + fetchCount);
        const mockAgent = generateMockAgent(agentId);
        const mockAttestations = generateMockAttestations(agentId, rand);
        const mockClaims = generateMockClaims(agentId, rand);

        setAgent(mockAgent);
        setAttestations(mockAttestations);
        setClaims(mockClaims);
        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch agent data");
          setIsLoading(false);
        }
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [agentId, fetchCount]);

  return { agent, attestations, claims, isLoading, error, refetch };
}
