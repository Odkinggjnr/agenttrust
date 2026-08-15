import React from "react";
import type { TrustTier } from "@/types/reputation";
import type { Agent } from "@/types/agent";
import { getTierLabel } from "@/types/reputation";
import TrustScoreRing from "@/components/agent/TrustScoreRing";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { truncateAddress, formatXLM } from "@/components/agent/AgentCard";

interface TrustCheckResultProps {
  agent: Agent;
  tier: TrustTier;
  flags: string[];
}

const flagConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  "All checks passed": {
    color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    icon: (
      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  "Recent claims filed": {
    color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    icon: (
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  },
  "Score below threshold": {
    color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    icon: (
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
  },
  "Inactive/decaying score": {
    color: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    icon: (
      <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  "Recently registered": {
    color: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    icon: (
      <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const defaultFlagConfig = {
  color: "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
  icon: (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function TrustCheckResult({
  agent,
  tier,
  flags,
}: TrustCheckResultProps) {
  const successRate = agent.totalTransactions > 0
    ? ((agent.successfulTransactions / agent.totalTransactions) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with ring */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <TrustScoreRing score={agent.trustScore} size="lg" />
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono">
            {truncateAddress(agent.agentAddress)}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
            {agent.agentAddress}
          </p>
          <div className="mt-2 flex gap-2">
            <Badge variant={agent.status} />
            <Badge variant={tier} />
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {successRate}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {agent.totalTransactions}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Transactions</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatXLM(agent.stake)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">XLM Staked</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {new Date(agent.registeredAt * 1000).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Registered</p>
          </div>
        </Card>
      </div>

      {/* Flags */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Trust Flags
        </h3>
        {flags.map((flag, idx) => {
          const config = flagConfig[flag] || defaultFlagConfig;
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${config.color}`}
            >
              <span className="flex-shrink-0">{config.icon}</span>
              <span className="text-sm font-medium">{flag}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
