"use client";

import { useState } from "react";
import Link from "next/link";
import type { Agent, Attestation as AgentAttestation } from "@/types/agent";
import type { TransactionRecord } from "@/types/reputation";
import type { Claim } from "@/types/contract";
import { getTrustTier, getTierLabel, getTierColor } from "@/types/reputation";

const MOCK_AGENT: Agent = {
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
};

const MOCK_ATTESTATIONS: AgentAttestation[] = [
  {
    id: 1,
    agentId: 1,
    attester: "GCXHM7JONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCX",
    attestationType: "peer_endorsement",
    dataHash: "abc123def456",
    timestamp: 1722816000,
    revoked: false,
  },
  {
    id: 2,
    agentId: 1,
    attester: "GDONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JON",
    attestationType: "quality_review",
    dataHash: "def789ghi012",
    timestamp: 1721692800,
    revoked: false,
  },
  {
    id: 3,
    agentId: 1,
    attester: "GEYXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JONASVQD3YX",
    attestationType: "security_audit",
    dataHash: "ghi345jkl678",
    timestamp: 1719014400,
    revoked: false,
  },
  {
    id: 4,
    agentId: 1,
    attester: "GFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JONASVQD3YXFUS",
    attestationType: "transaction_success",
    dataHash: "jkl901mno234",
    timestamp: 1717632000,
    revoked: true,
  },
];

const MOCK_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 1,
    agentId: 1,
    counterparty: "GCXHM7JONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCX",
    amount: "150.0000000",
    success: true,
    receiptHash: "txn_hash_001",
    timestamp: 1722902400,
  },
  {
    id: 2,
    agentId: 1,
    counterparty: "GDONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JON",
    amount: "75.0000000",
    success: true,
    receiptHash: "txn_hash_002",
    timestamp: 1722816000,
  },
  {
    id: 3,
    agentId: 1,
    counterparty: "GEYXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JONASVQD3YX",
    amount: "320.0000000",
    success: false,
    receiptHash: "txn_hash_003",
    timestamp: 1722729600,
  },
  {
    id: 4,
    agentId: 1,
    counterparty: "GFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JONASVQD3YXFUS",
    amount: "500.0000000",
    success: true,
    receiptHash: "txn_hash_004",
    timestamp: 1722643200,
  },
];

const MOCK_CLAIMS: Claim[] = [
  {
    id: 1,
    claimant: "GDONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JON",
    agentId: 1,
    transactionHash: "txn_hash_003",
    claimType: "poor_quality",
    evidenceHash: "evidence_001",
    status: "resolved",
    resolution: "for_agent",
    filedAt: 1722729600,
    resolvedAt: 1722816000,
  },
];

const CAPABILITY_LABELS: Record<string, string> = {
  "text-generation": "Text Generation",
  "text-analysis": "Text Analysis",
  translation: "Translation",
  "image-generation": "Image Generation",
  "image-recognition": "Image Recognition",
  "data-retrieval": "Data Retrieval",
  "data-analysis": "Data Analysis",
  "web-scraping": "Web Scraping",
  "payment-processing": "Payment Processing",
  invoicing: "Invoicing",
};

const ATTESTATION_TYPE_LABELS: Record<string, string> = {
  transaction_success: "Transaction Success",
  transaction_failure: "Transaction Failure",
  quality_review: "Quality Review",
  security_audit: "Security Audit",
  peer_endorsement: "Peer Endorsement",
};

type Tab = "overview" | "attestations" | "transactions" | "claims";

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatXLM(amount: string): string {
  const num = parseFloat(amount);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M XLM`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K XLM`;
  return `${num.toFixed(2)} XLM`;
}

export default function AgentProfilePage({
  params,
}: {
  params: { agentId: string };
}) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const agent = MOCK_AGENT;
  const tier = getTrustTier(agent.trustScore);
  const tierColor = getTierColor(tier);
  const normalizedScore = Math.round((agent.trustScore / 10000) * 100);
  const successRate =
    agent.totalTransactions > 0
      ? ((agent.successfulTransactions / agent.totalTransactions) * 100).toFixed(
          1
        )
      : "0";
  const ageDays = Math.floor(
    (Date.now() / 1000 - agent.registeredAt) / 86400
  );

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (normalizedScore / 100) * circumference;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    {
      id: "attestations",
      label: "Attestations",
      count: MOCK_ATTESTATIONS.length,
    },
    {
      id: "transactions",
      label: "Transactions",
      count: MOCK_TRANSACTIONS.length,
    },
    { id: "claims", label: "Claims", count: MOCK_CLAIMS.length },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-[var(--text-tertiary)]">
        <Link href="/registry" className="hover:text-[var(--text-secondary)]">
          Registry
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--text-primary)]">
          Agent #{params.agentId}
        </span>
      </nav>

      {/* Agent Header */}
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <div className="flex flex-1 items-start gap-5">
          <div
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl text-2xl font-bold text-white"
            style={{ backgroundColor: tierColor }}
          >
            T
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                TextMaster Pro
              </h1>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: tierColor + "1A",
                  color: tierColor,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tierColor }}
                />
                {getTierLabel(tier)}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  agent.status === "active"
                    ? "bg-green-500/10 text-green-500"
                    : agent.status === "suspended"
                    ? "bg-red-500/10 text-red-500"
                    : "bg-yellow-500/10 text-yellow-500"
                }`}
              >
                {agent.status}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm text-[var(--text-tertiary)]">
              {agent.agentAddress.slice(0, 8)}...{agent.agentAddress.slice(-8)}
            </p>
          </div>
        </div>

        {/* Trust Score Ring */}
        <div className="flex flex-col items-center">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke="var(--ring-bg)"
              strokeWidth="8"
            />
            <circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke={tierColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 64 64)"
              className="animate-score-ring"
              style={
                { "--score-offset": `${offset}` } as React.CSSProperties
              }
            />
            <text
              x="64"
              y="58"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="28"
              fontWeight="bold"
              fill={tierColor}
            >
              {normalizedScore}
            </text>
            <text
              x="64"
              y="80"
              textAnchor="middle"
              fontSize="11"
              fill="var(--text-tertiary)"
            >
              Trust Score
            </text>
          </svg>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Total Transactions",
            value: agent.totalTransactions.toLocaleString(),
          },
          { label: "Success Rate", value: `${successRate}%` },
          { label: "Total Volume", value: formatXLM(agent.totalVolume) },
          { label: "Agent Age", value: `${ageDays} days` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5"
          >
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-[var(--border)]">
        <div className="-mb-px flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 pb-3 pt-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-stellar-blue text-stellar-blue"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6 animate-fade-in">
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Capabilities */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Capabilities
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-secondary)]"
                  >
                    {CAPABILITY_LABELS[cap] || cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Stake & Metadata */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Agent Details
              </h3>
              <dl className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-[var(--text-secondary)]">
                    Staked Amount
                  </dt>
                  <dd className="text-sm font-medium text-[var(--text-primary)]">
                    {formatXLM(agent.stake)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-[var(--text-secondary)]">
                    Registered
                  </dt>
                  <dd className="text-sm font-medium text-[var(--text-primary)]">
                    {formatDate(agent.registeredAt)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-[var(--text-secondary)]">
                    Owner
                  </dt>
                  <dd className="font-mono text-sm text-[var(--text-primary)]">
                    {agent.owner.slice(0, 6)}...{agent.owner.slice(-6)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-[var(--text-secondary)]">
                    Metadata URI
                  </dt>
                  <dd className="text-sm text-stellar-blue">
                    {agent.metadataUri}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === "attestations" && (
          <div className="space-y-4">
            {MOCK_ATTESTATIONS.map((att) => (
              <div
                key={att.id}
                className={`flex items-start gap-4 rounded-xl border p-5 ${
                  att.revoked
                    ? "border-red-500/20 bg-red-500/5"
                    : "border-[var(--border)] bg-[var(--bg-secondary)]"
                }`}
              >
                <div
                  className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    att.revoked ? "bg-red-500" : "bg-trust-trusted"
                  }`}
                >
                  {att.attester.charAt(1)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {ATTESTATION_TYPE_LABELS[att.attestationType] ||
                          att.attestationType}
                      </span>
                      {att.revoked && (
                        <span className="ml-2 rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-500">
                          Revoked
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {formatDate(att.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-[var(--text-tertiary)]">
                    by {att.attester.slice(0, 6)}...{att.attester.slice(-6)}
                  </p>
                  <p className="mt-1 font-mono text-xs text-[var(--text-tertiary)]">
                    Hash: {att.dataHash}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="pb-3 text-left font-medium text-[var(--text-secondary)]">
                    Receipt Hash
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--text-secondary)]">
                    Counterparty
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--text-secondary)]">
                    Amount
                  </th>
                  <th className="pb-3 text-center font-medium text-[var(--text-secondary)]">
                    Status
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--text-secondary)]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {MOCK_TRANSACTIONS.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-3 font-mono text-xs text-[var(--text-primary)]">
                      {tx.receiptHash}
                    </td>
                    <td className="py-3 font-mono text-xs text-[var(--text-tertiary)]">
                      {tx.counterparty.slice(0, 6)}...
                      {tx.counterparty.slice(-4)}
                    </td>
                    <td className="py-3 text-right text-[var(--text-primary)]">
                      {formatXLM(tx.amount)}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          tx.success
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {tx.success ? "Success" : "Failed"}
                      </span>
                    </td>
                    <td className="py-3 text-right text-xs text-[var(--text-tertiary)]">
                      {formatDate(tx.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "claims" && (
          <div className="space-y-4">
            {MOCK_CLAIMS.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-12 text-center">
                <p className="text-[var(--text-secondary)]">
                  No claims filed against this agent.
                </p>
              </div>
            ) : (
              MOCK_CLAIMS.map((claim) => (
                <div
                  key={claim.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-[var(--text-primary)]">
                      {claim.claimType.replace("_", " ")}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        claim.status === "resolved"
                          ? "bg-green-500/10 text-green-500"
                          : claim.status === "open"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {claim.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                    Filed by{" "}
                    <span className="font-mono">
                      {claim.claimant.slice(0, 6)}...
                      {claim.claimant.slice(-4)}
                    </span>{" "}
                    on {formatDate(claim.filedAt)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    Transaction: {claim.transactionHash}
                  </p>
                  {claim.resolution && (
                    <p className="mt-2 text-sm capitalize text-[var(--text-secondary)]">
                      Resolution:{" "}
                      {claim.resolution.replace("_", " ")}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Embed Widget Section */}
      <div className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Embed Trust Badge
        </h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Add this snippet to your app to display this agent&apos;s trust
          score.
        </p>
        <div className="mt-4 rounded-lg bg-[var(--bg-tertiary)] p-4">
          <pre className="overflow-x-auto text-xs text-[var(--text-secondary)]">
            {`<script src="https://cdn.agenttrust.io/widget.js"></script>
<agent-trust-badge
  address="${agent.agentAddress}"
  theme="auto"
  size="compact"
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
}
