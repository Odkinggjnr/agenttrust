"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Agent, CapabilityCategory } from "@/types/agent";
import { getTrustTier, getTierLabel, getTierColor } from "@/types/reputation";
import type { TrustTier } from "@/types/reputation";

const MOCK_AGENTS: Agent[] = [
  {
    id: 1,
    owner: "GBXYZABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRST",
    agentAddress: "GAVQHQLCXHM7JONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWE",
    metadataUri: "https://meta.agenttrust.io/1",
    capabilities: ["text-generation", "text-analysis", "translation"],
    trustScore: 8750,
    totalTransactions: 1432,
    successfulTransactions: 1418,
    totalVolume: "245000.00",
    registeredAt: 1710288000,
    stake: "500.0000000",
    status: "active",
  },
  {
    id: 2,
    owner: "GCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    agentAddress: "GCXHM7JONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCX",
    metadataUri: "https://meta.agenttrust.io/2",
    capabilities: ["image-generation", "image-recognition"],
    trustScore: 6200,
    totalTransactions: 567,
    successfulTransactions: 548,
    totalVolume: "89000.00",
    registeredAt: 1714003200,
    stake: "250.0000000",
    status: "active",
  },
  {
    id: 3,
    owner: "GHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
    agentAddress: "GDONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JON",
    metadataUri: "https://meta.agenttrust.io/3",
    capabilities: ["data-retrieval", "data-analysis", "web-scraping"],
    trustScore: 4800,
    totalTransactions: 234,
    successfulTransactions: 221,
    totalVolume: "45000.00",
    registeredAt: 1717632000,
    stake: "150.0000000",
    status: "active",
  },
  {
    id: 4,
    owner: "GKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789AB",
    agentAddress: "GEYXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JONASVQD3YX",
    metadataUri: "https://meta.agenttrust.io/4",
    capabilities: ["payment-processing", "invoicing"],
    trustScore: 9200,
    totalTransactions: 3201,
    successfulTransactions: 3189,
    totalVolume: "1200000.00",
    registeredAt: 1704067200,
    stake: "1000.0000000",
    status: "active",
  },
  {
    id: 5,
    owner: "GNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFG",
    agentAddress: "GFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JONASVQD3YXFUS",
    metadataUri: "https://meta.agenttrust.io/5",
    capabilities: ["text-generation", "data-analysis"],
    trustScore: 1500,
    totalTransactions: 12,
    successfulTransactions: 10,
    totalVolume: "800.00",
    registeredAt: 1722816000,
    stake: "100.0000000",
    status: "active",
  },
  {
    id: 6,
    owner: "GQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJ",
    agentAddress: "GGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JONASVQD3YXFUSGRD",
    metadataUri: "https://meta.agenttrust.io/6",
    capabilities: ["image-generation", "text-generation", "data-retrieval"],
    trustScore: 7100,
    totalTransactions: 890,
    successfulTransactions: 869,
    totalVolume: "156000.00",
    registeredAt: 1711497600,
    stake: "350.0000000",
    status: "suspended",
  },
];

const AGENT_NAMES: Record<number, string> = {
  1: "TextMaster Pro",
  2: "PixelForge AI",
  3: "DataHarvest",
  4: "PayFlow Agent",
  5: "NovaMind",
  6: "OmniCreate",
};

const CAPABILITY_LABELS: Record<string, string> = {
  "text-generation": "Text Gen",
  "text-analysis": "Text Analysis",
  translation: "Translation",
  "image-generation": "Image Gen",
  "image-recognition": "Image Recognition",
  "data-retrieval": "Data Retrieval",
  "data-analysis": "Data Analysis",
  "web-scraping": "Web Scraping",
  "payment-processing": "Payments",
  invoicing: "Invoicing",
};

const TIER_OPTIONS: TrustTier[] = [
  "unverified",
  "emerging",
  "established",
  "trusted",
  "elite",
];

const CATEGORY_OPTIONS: CapabilityCategory[] = [
  "text",
  "image",
  "data",
  "payment",
];

function getCapabilityCategory(capId: string): CapabilityCategory {
  if (capId.startsWith("text") || capId === "translation") return "text";
  if (capId.startsWith("image")) return "image";
  if (capId.startsWith("data") || capId === "web-scraping") return "data";
  return "payment";
}

function TrustScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const normalizedScore = Math.round((score / 10000) * 100);
  const tier = getTrustTier(score);
  const color = getTierColor(tier);
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (normalizedScore / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox="0 0 44 44">
      <circle
        cx="22"
        cy="22"
        r="18"
        fill="none"
        stroke="var(--ring-bg)"
        strokeWidth="4"
      />
      <circle
        cx="22"
        cy="22"
        r="18"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
      />
      <text
        x="22"
        y="22"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="10"
        fontWeight="bold"
        fill={color}
      >
        {normalizedScore}
      </text>
    </svg>
  );
}

export default function RegistryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    CapabilityCategory | ""
  >("");
  const [selectedTier, setSelectedTier] = useState<TrustTier | "">("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  const filtered = useMemo(() => {
    return MOCK_AGENTS.filter((agent) => {
      const name = AGENT_NAMES[agent.id] || "";
      if (
        searchQuery &&
        !name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !agent.agentAddress.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (
        selectedCategory &&
        !agent.capabilities.some(
          (c) => getCapabilityCategory(c) === selectedCategory
        )
      ) {
        return false;
      }
      if (selectedTier && getTrustTier(agent.trustScore) !== selectedTier) {
        return false;
      }
      if (showActiveOnly && agent.status !== "active") {
        return false;
      }
      return true;
    });
  }, [searchQuery, selectedCategory, selectedTier, showActiveOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          Agent Registry
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Browse and discover verified AI agents on the Stellar network.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search by name or address..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-stellar-blue"
        />
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value as CapabilityCategory | "");
            setCurrentPage(1);
          }}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-stellar-blue"
        >
          <option value="">All Capabilities</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={selectedTier}
          onChange={(e) => {
            setSelectedTier(e.target.value as TrustTier | "");
            setCurrentPage(1);
          }}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-stellar-blue"
        >
          <option value="">All Tiers</option>
          {TIER_OPTIONS.map((tier) => (
            <option key={tier} value={tier}>
              {getTierLabel(tier)}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={(e) => {
              setShowActiveOnly(e.target.checked);
              setCurrentPage(1);
            }}
            className="h-4 w-4 rounded border-[var(--border)] accent-stellar-blue"
          />
          Active only
        </label>
      </div>

      {/* Agent Grid */}
      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] py-20">
          <div className="text-4xl text-[var(--text-tertiary)]">&#9678;</div>
          <p className="mt-4 text-lg font-medium text-[var(--text-primary)]">
            No agents found
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Try adjusting your search filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paged.map((agent) => {
            const tier = getTrustTier(agent.trustScore);
            const name = AGENT_NAMES[agent.id] || `Agent #${agent.id}`;
            return (
              <Link
                key={agent.id}
                href={`/registry/${agent.id}`}
                className="group rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: getTierColor(tier) }}
                    >
                      {name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-stellar-blue">
                        {name}
                      </h3>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {agent.agentAddress.slice(0, 4)}...
                        {agent.agentAddress.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <TrustScoreRing score={agent.trustScore} />
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {agent.capabilities.slice(0, 3).map((cap) => (
                    <span
                      key={cap}
                      className="rounded-full bg-[var(--bg-tertiary)] px-2.5 py-0.5 text-xs text-[var(--text-secondary)]"
                    >
                      {CAPABILITY_LABELS[cap] || cap}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span className="rounded-full bg-[var(--bg-tertiary)] px-2.5 py-0.5 text-xs text-[var(--text-tertiary)]">
                      +{agent.capabilities.length - 3}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
                  <div className="flex items-center gap-1">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          agent.status === "active"
                            ? "#22C55E"
                            : agent.status === "suspended"
                            ? "#EF4444"
                            : "#F59E0B",
                      }}
                    />
                    <span className="text-xs capitalize text-[var(--text-secondary)]">
                      {agent.status}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {agent.totalTransactions.toLocaleString()} txns
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: getTierColor(tier) + "1A",
                      color: getTierColor(tier),
                    }}
                  >
                    {getTierLabel(tier)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                page === currentPage
                  ? "bg-stellar-blue text-white"
                  : "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
