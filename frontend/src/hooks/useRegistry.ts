"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Agent } from "@/types/agent";
import { getTrustTier } from "@/types/reputation";

interface RegistryFilters {
  search?: string;
  capability?: string;
  tier?: string;
  status?: string;
}

interface UseRegistryReturn {
  agents: Agent[];
  total: number;
  isLoading: boolean;
  error: string | null;
  filters: RegistryFilters;
  setFilters: (filters: RegistryFilters) => void;
  page: number;
  setPage: (page: number) => void;
}

const PAGE_SIZE = 9;

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

const CAPABILITY_OPTIONS = [
  "text-generation", "text-analysis", "translation",
  "image-generation", "image-recognition",
  "data-retrieval", "data-analysis", "web-scraping",
  "payment-processing", "invoicing",
];

const MOCK_NAMES = [
  "SentinelAI", "DataForge", "PayStream", "LinguaBot",
  "VisionX", "AnalyticsPro", "ScribeAgent", "TradeGuard",
  "InsightMiner", "PixelCraft", "ChainRelay", "DocuMint",
];

function generateMockRegistry(): Agent[] {
  const agents: Agent[] = [];

  for (let i = 1; i <= 12; i++) {
    const rand = seededRandom(i * 4201);
    const nameIndex = (i - 1) % MOCK_NAMES.length;

    // Distribute scores across tiers
    const scoreDistribution = [
      1500, 3200, 4800, 6100, 7200, 7800,
      8500, 9200, 2100, 5500, 8900, 6800,
    ];
    const score = scoreDistribution[i - 1];

    const totalTx = Math.floor(rand() * 800) + 5;
    const successRate = 0.65 + rand() * 0.34;
    const successfulTx = Math.floor(totalTx * successRate);
    const volume = Math.floor(rand() * 1000000000000) + 5000000;
    const daysAgo = Math.floor(rand() * 400) + 10;
    const registeredAt = Math.floor(Date.now() / 1000) - daysAgo * 86400;
    const stakeAmount = Math.floor(rand() * 80000000000) + 500000000;

    const numCapabilities = Math.floor(rand() * 4) + 1;
    const capabilities: string[] = [];
    const shuffled = [...CAPABILITY_OPTIONS].sort(() => rand() - 0.5);
    for (let j = 0; j < numCapabilities && j < shuffled.length; j++) {
      capabilities.push(shuffled[j]);
    }

    const statusChoices: Agent["status"][] = [
      "active", "active", "active", "active", "active",
      "active", "active", "active", "active",
      "suspended", "deregistering", "active",
    ];

    agents.push({
      id: i,
      owner: generateMockAddress(rand),
      agentAddress: generateMockAddress(rand),
      metadataUri: `ipfs://Qm${MOCK_NAMES[nameIndex].toLowerCase()}${i}${"a".repeat(40 - MOCK_NAMES[nameIndex].length)}`,
      capabilities,
      trustScore: score,
      totalTransactions: totalTx,
      successfulTransactions: successfulTx,
      totalVolume: volume.toString(),
      registeredAt,
      stake: stakeAmount.toString(),
      status: statusChoices[i - 1],
    });
  }

  return agents;
}

export function useRegistry(initialFilters?: RegistryFilters): UseRegistryReturn {
  const [allAgents] = useState<Agent[]>(() => generateMockRegistry());
  const [filters, setFiltersState] = useState<RegistryFilters>(initialFilters || {});
  const [page, setPage] = useState(1);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search || "");

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(filters.search || "");
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filters.search]);

  // Reset page when filters change
  const setFilters = useCallback((newFilters: RegistryFilters) => {
    setFiltersState(newFilters);
    setPage(1);
  }, []);

  // Filter agents
  useEffect(() => {
    setIsLoading(true);

    // Simulate async with small delay
    const timer = setTimeout(() => {
      let results = [...allAgents];

      // Filter by search (matches agent address)
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        results = results.filter(
          (agent) =>
            agent.agentAddress.toLowerCase().includes(searchLower) ||
            agent.owner.toLowerCase().includes(searchLower) ||
            agent.metadataUri.toLowerCase().includes(searchLower)
        );
      }

      // Filter by capability
      if (filters.capability) {
        results = results.filter((agent) =>
          agent.capabilities.includes(filters.capability!)
        );
      }

      // Filter by tier (derived from score)
      if (filters.tier) {
        results = results.filter(
          (agent) => getTrustTier(agent.trustScore) === filters.tier
        );
      }

      // Filter by status
      if (filters.status) {
        results = results.filter((agent) => agent.status === filters.status);
      }

      setFilteredAgents(results);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [allAgents, debouncedSearch, filters.capability, filters.tier, filters.status]);

  // Paginate
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedAgents = filteredAgents.slice(startIndex, startIndex + PAGE_SIZE);

  return {
    agents: paginatedAgents,
    total: filteredAgents.length,
    isLoading,
    error,
    filters,
    setFilters,
    page,
    setPage,
  };
}
