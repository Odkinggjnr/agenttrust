import React from "react";
import type { AgentStatus } from "@/types/agent";
import type { TrustTier } from "@/types/reputation";

type BadgeVariant = AgentStatus | TrustTier;

interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

const variantClasses: Record<string, string> = {
  // Status variants
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  deregistering: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  // Tier variants
  unverified: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  emerging: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  established: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  trusted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  elite: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
};

const defaultLabels: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
  deregistering: "Deregistering",
  unverified: "Unverified",
  emerging: "Emerging",
  established: "Established",
  trusted: "Trusted",
  elite: "Elite",
};

export default function Badge({ variant, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ${variantClasses[variant] || "bg-gray-100 text-gray-700"}
        ${className}
      `}
    >
      {children || defaultLabels[variant] || variant}
    </span>
  );
}
