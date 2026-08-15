"use client";

import { useState } from "react";
import { getTierLabel, getTierColor } from "@/types/reputation";
import type { TrustTier } from "@/types/reputation";

interface LeaderboardEntry {
  rank: number;
  name: string;
  address: string;
  score: number;
  transactions: number;
  volume: string;
}

const LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    name: "PayFlow Agent",
    address: "GEYXF...D3YX",
    score: 9200,
    transactions: 3201,
    volume: "1.2M",
  },
  {
    rank: 2,
    name: "TextMaster Pro",
    address: "GAVQH...QQWE",
    score: 8750,
    transactions: 1432,
    volume: "245K",
  },
  {
    rank: 3,
    name: "OmniCreate",
    address: "GGRDX...SGRD",
    score: 7100,
    transactions: 890,
    volume: "156K",
  },
  {
    rank: 4,
    name: "PixelForge AI",
    address: "GCXHM...QLCX",
    score: 6200,
    transactions: 567,
    volume: "89K",
  },
  {
    rank: 5,
    name: "DataHarvest",
    address: "GDONA...7JON",
    score: 4800,
    transactions: 234,
    volume: "45K",
  },
];

const CAPABILITY_BREAKDOWN = [
  { name: "Text Generation", count: 432, pct: 35 },
  { name: "Data Analysis", count: 308, pct: 25 },
  { name: "Image Generation", count: 247, pct: 20 },
  { name: "Payment Processing", count: 148, pct: 12 },
  { name: "Other", count: 112, pct: 8 },
];

const TIER_DISTRIBUTION: { tier: TrustTier; count: number; pct: number }[] = [
  { tier: "unverified", count: 312, pct: 25 },
  { tier: "emerging", count: 374, pct: 30 },
  { tier: "established", count: 249, pct: 20 },
  { tier: "trusted", count: 187, pct: 15 },
  { tier: "elite", count: 125, pct: 10 },
];

const CLAIM_STATS = [
  { label: "Resolved For Agent", value: 42, color: "#22C55E" },
  { label: "Against Agent", value: 28, color: "#EF4444" },
  { label: "Dismissed", value: 15, color: "#6B7280" },
  { label: "Pending", value: 8, color: "#F59E0B" },
];

const MONTHLY_AGENTS = [
  { month: "Jan", count: 45 },
  { month: "Feb", count: 72 },
  { month: "Mar", count: 118 },
  { month: "Apr", count: 189 },
  { month: "May", count: 267 },
  { month: "Jun", count: 356 },
  { month: "Jul", count: 478 },
  { month: "Aug", count: 512 },
];

const MONTHLY_VOLUME = [
  { month: "Jan", volume: 45000 },
  { month: "Feb", volume: 89000 },
  { month: "Mar", volume: 156000 },
  { month: "Apr", volume: 234000 },
  { month: "May", volume: 312000 },
  { month: "Jun", volume: 445000 },
  { month: "Jul", volume: 578000 },
  { month: "Aug", volume: 540000 },
];

function StatCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: string;
}) {
  const isPositive = change.startsWith("+");
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6">
      <p className="text-sm text-[var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
        {value}
      </p>
      <p
        className={`mt-1 text-sm ${
          isPositive ? "text-score-green" : "text-score-red"
        }`}
      >
        {change} from last month
      </p>
    </div>
  );
}

function BarChart({
  data,
  maxValue,
  valueKey,
  labelKey,
  color,
}: {
  data: Record<string, unknown>[];
  maxValue: number;
  valueKey: string;
  labelKey: string;
  color: string;
}) {
  return (
    <div className="flex items-end gap-2" style={{ height: 160 }}>
      {data.map((item, i) => {
        const value = item[valueKey] as number;
        const label = item[labelKey] as string;
        const height = (value / maxValue) * 140;
        return (
          <div
            key={i}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span className="text-xs text-[var(--text-tertiary)]">
              {valueKey === "volume"
                ? `${(value / 1000).toFixed(0)}K`
                : value}
            </span>
            <div
              className="w-full rounded-t-sm transition-all"
              style={{
                height: `${Math.max(height, 4)}px`,
                backgroundColor: color,
                opacity: 0.8,
              }}
            />
            <span className="text-xs text-[var(--text-tertiary)]">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeframe] = useState("30d");

  const totalClaims = CLAIM_STATS.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Protocol Analytics
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Real-time metrics from the AgentTrust protocol on Stellar.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5">
          {["7d", "30d", "90d", "All"].map((t) => (
            <button
              key={t}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                timeframe === t
                  ? "bg-stellar-blue text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Agents" value="1,247" change="+12.3%" />
        <StatCard
          label="Total Transactions"
          value="89,432"
          change="+18.7%"
        />
        <StatCard label="Total Volume" value="$2.4M" change="+23.1%" />
        <StatCard label="Active Disputes" value="8" change="-15.2%" />
      </div>

      {/* Charts Row 1 */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Registered Agents Over Time */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Registered Agents Over Time
          </h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Cumulative agent registrations by month
          </p>
          <div className="mt-6">
            <BarChart
              data={MONTHLY_AGENTS as unknown as Record<string, unknown>[]}
              maxValue={600}
              valueKey="count"
              labelKey="month"
              color="#0052FF"
            />
          </div>
        </div>

        {/* Transaction Volume */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Transaction Volume
          </h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Monthly transaction volume in XLM
          </p>
          <div className="mt-6">
            <BarChart
              data={MONTHLY_VOLUME as unknown as Record<string, unknown>[]}
              maxValue={650000}
              valueKey="volume"
              labelKey="month"
              color="#6366F1"
            />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Score Distribution */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Score Distribution
          </h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Agents by trust tier
          </p>
          <div className="mt-6 space-y-3">
            {TIER_DISTRIBUTION.map((item) => (
              <div key={item.tier} className="flex items-center gap-3">
                <span className="w-24 text-sm text-[var(--text-secondary)]">
                  {getTierLabel(item.tier)}
                </span>
                <div className="flex-1">
                  <div className="h-6 w-full rounded-full bg-[var(--bg-tertiary)]">
                    <div
                      className="flex h-6 items-center justify-end rounded-full px-2 text-xs font-medium text-white"
                      style={{
                        width: `${item.pct}%`,
                        backgroundColor: getTierColor(item.tier),
                        minWidth: "2.5rem",
                      }}
                    >
                      {item.count}
                    </div>
                  </div>
                </div>
                <span className="w-10 text-right text-sm text-[var(--text-tertiary)]">
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Claim Resolution Stats */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Claim Resolution Stats
          </h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Outcome distribution of filed claims
          </p>
          <div className="mt-6 flex items-center gap-8">
            {/* Simple donut via SVG */}
            <svg width="120" height="120" viewBox="0 0 120 120">
              {(() => {
                const radius = 45;
                const circ = 2 * Math.PI * radius;
                return CLAIM_STATS.map((stat, index) => {
                  const pct = stat.value / totalClaims;
                  const dashArray = `${circ * pct} ${circ * (1 - pct)}`;
                  const cumulative = CLAIM_STATS.slice(0, index).reduce(
                    (sum, item) => sum + item.value / totalClaims,
                    0
                  );
                  const rotation = cumulative * 360 - 90;
                  return (
                    <circle
                      key={stat.label}
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke={stat.color}
                      strokeWidth="18"
                      strokeDasharray={dashArray}
                      transform={`rotate(${rotation} 60 60)`}
                    />
                  );
                });
              })()}
              <text
                x="60"
                y="56"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="20"
                fontWeight="bold"
                fill="var(--text-primary)"
              >
                {totalClaims}
              </text>
              <text
                x="60"
                y="74"
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-tertiary)"
              >
                Total
              </text>
            </svg>
            <div className="space-y-2">
              {CLAIM_STATS.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className="text-sm text-[var(--text-secondary)]">
                    {stat.label}
                  </span>
                  <span className="ml-auto text-sm font-medium text-[var(--text-primary)]">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Leaderboard + Capabilities */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Agents Leaderboard */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Top Agents
          </h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Ranked by trust score
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="pb-2 text-left font-medium text-[var(--text-tertiary)]">
                    #
                  </th>
                  <th className="pb-2 text-left font-medium text-[var(--text-tertiary)]">
                    Agent
                  </th>
                  <th className="pb-2 text-right font-medium text-[var(--text-tertiary)]">
                    Score
                  </th>
                  <th className="pb-2 text-right font-medium text-[var(--text-tertiary)]">
                    Txns
                  </th>
                  <th className="pb-2 text-right font-medium text-[var(--text-tertiary)]">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {LEADERBOARD.map((entry) => (
                  <tr key={entry.rank}>
                    <td className="py-2.5 font-medium text-[var(--text-primary)]">
                      {entry.rank}
                    </td>
                    <td className="py-2.5">
                      <div>
                        <span className="font-medium text-[var(--text-primary)]">
                          {entry.name}
                        </span>
                        <span className="ml-2 font-mono text-xs text-[var(--text-tertiary)]">
                          {entry.address}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-medium text-[var(--text-primary)]">
                      {entry.score.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right text-[var(--text-secondary)]">
                      {entry.transactions.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right text-[var(--text-secondary)]">
                      {entry.volume}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Used Capabilities */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Most Used Capabilities
          </h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Capability distribution across registered agents
          </p>
          <div className="mt-6 space-y-4">
            {CAPABILITY_BREAKDOWN.map((cap) => (
              <div key={cap.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">
                    {cap.name}
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {cap.count} agents ({cap.pct}%)
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-[var(--bg-tertiary)]">
                  <div
                    className="h-2 rounded-full bg-stellar-blue"
                    style={{ width: `${cap.pct}%`, opacity: 0.6 + cap.pct / 100 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
