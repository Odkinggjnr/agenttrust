"use client";

import React, { useState } from "react";
import type { Agent, Attestation } from "@/types/agent";
import type { ScoreBreakdown, TransactionRecord } from "@/types/reputation";
import { getTrustTier, getTierLabel } from "@/types/reputation";
import { Identicon, truncateAddress, formatXLM } from "./AgentCard";
import TrustScoreRing from "./TrustScoreRing";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import CapabilityTags from "./CapabilityTags";
import AttestationList from "./AttestationList";
import TransactionHistory from "./TransactionHistory";

type TabKey = "overview" | "attestations" | "transactions";

interface AgentProfileProps {
  agent: Agent;
  scoreBreakdown?: ScoreBreakdown;
  attestations: Attestation[];
  transactions?: TransactionRecord[];
  currentUser?: string;
  onRevokeAttestation?: (attestation: Attestation) => void;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "attestations", label: "Attestations" },
  { key: "transactions", label: "Transactions" },
];

export default function AgentProfile({
  agent,
  scoreBreakdown,
  attestations,
  transactions = [],
  currentUser,
  onRevokeAttestation,
}: AgentProfileProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const tier = getTrustTier(agent.trustScore);
  const successRate = agent.totalTransactions > 0
    ? ((agent.successfulTransactions / agent.totalTransactions) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
        <Identicon address={agent.agentAddress} size={80} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {truncateAddress(agent.agentAddress)}
            </h1>
            <Badge variant={agent.status} />
            <Badge variant={tier} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
            {agent.agentAddress}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Owner: {truncateAddress(agent.owner)}
          </p>
        </div>
        <div className="flex-shrink-0">
          <TrustScoreRing score={agent.trustScore} size="lg" />
        </div>
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {(agent.trustScore / 100).toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Trust Score</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {successRate}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Success Rate</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {agent.totalTransactions}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Transactions</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatXLM(agent.stake)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">XLM Staked</p>
          </div>
        </Card>
      </section>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-6 -mb-px overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                pb-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                ${activeTab === tab.key
                  ? "border-stellar-blue text-stellar-blue"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }
              `}
            >
              {tab.label}
              {tab.key === "attestations" && attestations.length > 0 && (
                <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
                  {attestations.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card header={<h3 className="font-semibold text-gray-900 dark:text-gray-100">Capabilities</h3>}>
              <CapabilityTags capabilities={agent.capabilities} />
            </Card>
            {scoreBreakdown && (
              <Card header={<h3 className="font-semibold text-gray-900 dark:text-gray-100">Score Breakdown</h3>}>
                <div className="space-y-3">
                  <ScoreBar label="Success Rate" value={scoreBreakdown.successRateComponent} max={10000} />
                  <ScoreBar label="Volume" value={scoreBreakdown.volumeComponent} max={10000} />
                  <ScoreBar label="Account Age" value={scoreBreakdown.ageComponent} max={10000} />
                  <ScoreBar label="Attestations" value={scoreBreakdown.attestationComponent} max={10000} />
                  <ScoreBar label="Stake" value={scoreBreakdown.stakeComponent} max={10000} />
                  <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {(scoreBreakdown.total / 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            <Card header={<h3 className="font-semibold text-gray-900 dark:text-gray-100">Details</h3>}>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Agent Address</dt>
                  <dd className="font-mono text-gray-900 dark:text-gray-100 mt-0.5 truncate">
                    {agent.agentAddress}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Owner</dt>
                  <dd className="font-mono text-gray-900 dark:text-gray-100 mt-0.5 truncate">
                    {agent.owner}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Metadata URI</dt>
                  <dd className="font-mono text-gray-900 dark:text-gray-100 mt-0.5 truncate">
                    {agent.metadataUri || "Not specified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Registered</dt>
                  <dd className="text-gray-900 dark:text-gray-100 mt-0.5">
                    {new Date(agent.registeredAt * 1000).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Total Volume</dt>
                  <dd className="text-gray-900 dark:text-gray-100 mt-0.5">
                    {formatXLM(agent.totalVolume)} XLM
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Tier</dt>
                  <dd className="text-gray-900 dark:text-gray-100 mt-0.5">
                    {getTierLabel(tier)}
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        )}

        {activeTab === "attestations" && (
          <AttestationList
            attestations={attestations}
            currentUser={currentUser}
            onRevoke={onRevokeAttestation}
          />
        )}

        {activeTab === "transactions" && (
          <Card>
            <TransactionHistory transactions={transactions} agentId={agent.id} />
          </Card>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = (value / max) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {(value / 100).toFixed(1)}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-stellar-blue rounded-full transition-all duration-500"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
