"use client";

import React from "react";
import Link from "next/link";
import type { Agent } from "@/types/agent";
import { getTrustTier } from "@/types/reputation";
import TrustScoreRing from "./TrustScoreRing";
import CapabilityTags from "./CapabilityTags";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

interface AgentCardProps {
  agent: Agent;
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function formatXLM(stroops: string): string {
  const xlm = Number(stroops) / 10_000_000;
  return xlm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generateIdenticon(address: string): string[] {
  const colors = ["#0052FF", "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];
  const grid: string[] = [];
  for (let i = 0; i < 25; i++) {
    const charCode = address.charCodeAt(i % address.length) || 0;
    const nextCode = address.charCodeAt((i + 1) % address.length) || 0;
    const filled = (charCode + nextCode + i) % 3 !== 0;
    grid.push(filled ? colors[(charCode + i) % colors.length] : "transparent");
  }
  return grid;
}

function Identicon({ address, size = 40 }: { address: string; size?: number }) {
  const grid = generateIdenticon(address);
  const cellSize = size / 5;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-md overflow-hidden">
      <rect width={size} height={size} fill="#E5E7EB" className="dark:fill-gray-700" />
      {grid.map((color, i) => {
        const row = Math.floor(i / 5);
        const col = i % 5;
        if (color === "transparent") return null;
        return (
          <rect
            key={i}
            x={col * cellSize}
            y={row * cellSize}
            width={cellSize}
            height={cellSize}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

const statusDotColors: Record<string, string> = {
  active: "bg-green-500",
  suspended: "bg-red-500",
  deregistering: "bg-yellow-500",
};

export default function AgentCard({ agent }: AgentCardProps) {
  const visibleCaps = agent.capabilities.slice(0, 3);
  const remainingCaps = agent.capabilities.length - 3;

  return (
    <Link href={`/registry/${agent.id}`} className="block">
      <Card hover className="h-full">
        <div className="flex items-start gap-3">
          <Identicon address={agent.agentAddress} size={44} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {truncateAddress(agent.agentAddress)}
              </h3>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDotColors[agent.status] || "bg-gray-400"}`} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {truncateAddress(agent.owner)}
            </p>
          </div>
          <TrustScoreRing score={agent.trustScore} size="sm" showLabel={false} />
        </div>

        <div className="mt-3">
          <div className="flex flex-wrap gap-1">
            <CapabilityTags capabilities={visibleCaps} size="sm" />
            {remainingCaps > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-medium">
                +{remainingCaps} more
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{agent.totalTransactions} txns | {formatXLM(agent.stake)} XLM staked</span>
          <Badge variant={agent.status} />
        </div>
      </Card>
    </Link>
  );
}

export { Identicon, truncateAddress, generateIdenticon, formatXLM };
