import React from "react";
import type { Agent } from "@/types/agent";
import AgentCard from "@/components/agent/AgentCard";
import Skeleton from "@/components/ui/Skeleton";

interface RegistryGridProps {
  agents: Agent[];
  isLoading: boolean;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
      <div className="flex items-start gap-3">
        <Skeleton variant="rect" width={44} height={44} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
        <Skeleton variant="circle" width={48} height={48} />
      </div>
      <div className="flex gap-2 mt-3">
        <Skeleton variant="rect" width={80} height={22} className="rounded-full" />
        <Skeleton variant="rect" width={80} height={22} className="rounded-full" />
      </div>
      <div className="flex justify-between mt-3">
        <Skeleton variant="text" width="30%" height={14} />
        <Skeleton variant="rect" width={60} height={20} className="rounded-full" />
      </div>
    </div>
  );
}

export default function RegistryGrid({ agents, isLoading }: RegistryGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
          No agents found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
