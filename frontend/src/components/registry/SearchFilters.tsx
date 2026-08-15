"use client";

import React from "react";
import Search from "@/components/ui/Search";
import type { AgentStatus } from "@/types/agent";
import { CAPABILITIES } from "@/types/agent";
import type { TrustTier } from "@/types/reputation";

export interface FilterState {
  search: string;
  capability: string;
  tier: TrustTier | "";
  status: AgentStatus | "all";
}

interface SearchFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const tierOptions: { value: TrustTier | ""; label: string }[] = [
  { value: "", label: "All Tiers" },
  { value: "elite", label: "Elite" },
  { value: "trusted", label: "Trusted" },
  { value: "established", label: "Established" },
  { value: "emerging", label: "Emerging" },
  { value: "unverified", label: "Unverified" },
];

const statusOptions: { value: AgentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "deregistering", label: "Deregistering" },
];

// Group capabilities by category
const capsByCategory = CAPABILITIES.reduce<Record<string, typeof CAPABILITIES>>((acc, cap) => {
  const cat = cap.category.charAt(0).toUpperCase() + cap.category.slice(1);
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(cap);
  return acc;
}, {});

export default function SearchFilters({ filters, onFilterChange }: SearchFiltersProps) {
  const update = (partial: Partial<FilterState>) => {
    onFilterChange({ ...filters, ...partial });
  };

  const hasFilters = filters.search || filters.capability || filters.tier || filters.status !== "all";

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
      <Search
        value={filters.search}
        onChange={(val) => update({ search: val })}
        placeholder="Search agents..."
        className="w-full sm:w-64"
      />

      <select
        value={filters.capability}
        onChange={(e) => update({ capability: e.target.value })}
        className="
          px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-stellar-blue/50 focus:border-stellar-blue
        "
      >
        <option value="">All Capabilities</option>
        {Object.entries(capsByCategory).map(([category, caps]) => (
          <optgroup key={category} label={category}>
            {caps.map((cap) => (
              <option key={cap.id} value={cap.id}>
                {cap.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <select
        value={filters.tier}
        onChange={(e) => update({ tier: e.target.value as TrustTier | "" })}
        className="
          px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-stellar-blue/50 focus:border-stellar-blue
        "
      >
        {tierOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update({ status: opt.value })}
            className={`
              px-3 py-2 text-sm font-medium transition-colors
              ${filters.status === opt.value
                ? "bg-stellar-blue text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {hasFilters && (
        <button
          onClick={() =>
            onFilterChange({ search: "", capability: "", tier: "", status: "all" })
          }
          className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
