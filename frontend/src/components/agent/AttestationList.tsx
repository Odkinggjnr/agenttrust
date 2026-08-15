"use client";

import React from "react";
import type { Attestation, AttestationType } from "@/types/agent";
import Button from "@/components/ui/Button";

interface AttestationListProps {
  attestations: Attestation[];
  currentUser?: string;
  onRevoke?: (attestation: Attestation) => void;
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diffSec = now - timestamp;
  const minutes = Math.floor(diffSec / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return `${Math.floor(days / 30)}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

const attestationTypeConfig: Record<AttestationType, { label: string; color: string }> = {
  transaction_success: { label: "Tx Success", color: "text-green-500" },
  transaction_failure: { label: "Tx Failure", color: "text-red-500" },
  quality_review: { label: "Quality Review", color: "text-blue-500" },
  security_audit: { label: "Security Audit", color: "text-purple-500" },
  peer_endorsement: { label: "Peer Endorsement", color: "text-indigo-500" },
};

export default function AttestationList({
  attestations,
  currentUser,
  onRevoke,
}: AttestationListProps) {
  if (attestations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
        <p className="text-sm">No attestations yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-6">
        {attestations.map((att) => {
          const isOwn = currentUser && att.attester === currentUser;
          const typeConfig = attestationTypeConfig[att.attestationType];
          return (
            <div key={att.id} className="relative pl-10">
              {/* Timeline dot */}
              <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 bg-stellar-blue" />

              <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${att.revoked ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                      {att.revoked && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
                          Revoked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                      Attester: {truncateAddress(att.attester)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {timeAgo(att.timestamp)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isOwn && !att.revoked && onRevoke && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onRevoke(att)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
