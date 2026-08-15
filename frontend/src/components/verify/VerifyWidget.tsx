"use client";

import React, { useState } from "react";
import type { Agent } from "@/types/agent";
import type { TrustTier } from "@/types/reputation";
import { getTrustTier } from "@/types/reputation";
import Button from "@/components/ui/Button";
import TrustCheckResult from "./TrustCheckResult";

interface VerifyResponse {
  agent: Agent;
  tier: TrustTier;
  flags: string[];
}

export default function VerifyWidget() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/verify?address=${encodeURIComponent(address.trim())}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Verification failed (${res.status})`);
      }
      const data = await res.json();
      // If the API returns the agent, compute tier from trustScore
      const agent: Agent = data.agent;
      const tier = data.tier || getTrustTier(agent.trustScore);
      const flags: string[] = data.flags || [];
      setResult({ agent, tier, flags });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleVerify();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search input */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter agent address (G...)"
            className="
              w-full pl-12 pr-4 py-4 text-base
              border border-gray-300 dark:border-gray-600
              rounded-xl bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-stellar-blue/50 focus:border-stellar-blue
              transition-colors
            "
          />
        </div>
        <Button
          variant="primary"
          size="lg"
          loading={loading}
          disabled={!address.trim()}
          onClick={handleVerify}
          className="px-8"
        >
          Verify
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-fade-in">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-8">
          <TrustCheckResult
            agent={result.agent}
            tier={result.tier}
            flags={result.flags}
          />
        </div>
      )}
    </div>
  );
}
