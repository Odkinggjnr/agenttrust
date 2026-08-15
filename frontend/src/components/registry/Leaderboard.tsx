"use client";

import React from "react";
import type { Agent } from "@/types/agent";
import { Identicon, truncateAddress, formatXLM } from "@/components/agent/AgentCard";
import TrustScoreRing from "@/components/agent/TrustScoreRing";
import Link from "next/link";

interface LeaderboardProps {
  agents: Agent[];
}

const rankStyles: Record<number, string> = {
  1: "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800",
  2: "bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600",
  3: "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800",
};

const rankTextColors: Record<number, string> = {
  1: "text-yellow-600 dark:text-yellow-400",
  2: "text-gray-500 dark:text-gray-400",
  3: "text-amber-700 dark:text-amber-400",
};

function CrownIcon() {
  return (
    <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
    </svg>
  );
}

export default function Leaderboard({ agents }: LeaderboardProps) {
  const sorted = [...agents].sort((a, b) => b.trustScore - a.trustScore);

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 font-medium w-16">#</th>
            <th className="px-4 py-3 font-medium">Agent</th>
            <th className="px-4 py-3 font-medium text-center">Score</th>
            <th className="px-4 py-3 font-medium text-right">Transactions</th>
            <th className="px-4 py-3 font-medium text-right">Volume (XLM)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {sorted.map((agent, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;

            return (
              <tr
                key={agent.id}
                className={`
                  transition-colors
                  ${isTop3
                    ? rankStyles[rank]
                    : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }
                `}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {rank === 1 && <CrownIcon />}
                    <span className={`font-bold ${isTop3 ? rankTextColors[rank] : "text-gray-400"}`}>
                      {rank}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/registry/${agent.id}`} className="flex items-center gap-3 group">
                    <Identicon address={agent.agentAddress} size={32} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-stellar-blue transition-colors font-mono text-xs">
                        {truncateAddress(agent.agentAddress)}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <TrustScoreRing score={agent.trustScore} size="sm" showLabel={false} animated={false} />
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                  {agent.totalTransactions.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                  {formatXLM(agent.totalVolume)}
                </td>
              </tr>
            );
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No agents to display
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
