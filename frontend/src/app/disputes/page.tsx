"use client";

import { useState } from "react";
import { useWallet } from "@/app/providers";
import type { Claim, ClaimType, ClaimStatus, Resolution } from "@/types/contract";

type DisputeTab = "file" | "my-claims" | "history";

const CLAIM_TYPES: { value: ClaimType; label: string }[] = [
  { value: "non_delivery", label: "Non-Delivery" },
  { value: "poor_quality", label: "Poor Quality" },
  { value: "fraud", label: "Fraud" },
  { value: "overcharge", label: "Overcharge" },
  { value: "other", label: "Other" },
];

const MOCK_MY_CLAIMS: Claim[] = [
  {
    id: 1,
    claimant: "GBXYZABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRST",
    agentId: 3,
    transactionHash: "txn_hash_abc123",
    claimType: "poor_quality",
    evidenceHash: "evidence_hash_001",
    status: "open",
    filedAt: 1722816000,
  },
  {
    id: 2,
    claimant: "GBXYZABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRST",
    agentId: 1,
    transactionHash: "txn_hash_def456",
    claimType: "overcharge",
    evidenceHash: "evidence_hash_002",
    status: "responded",
    responseHash: "response_hash_002",
    filedAt: 1721692800,
  },
];

const MOCK_RESOLVED: Claim[] = [
  {
    id: 3,
    claimant: "GCXHM7JONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCX",
    agentId: 2,
    transactionHash: "txn_hash_ghi789",
    claimType: "non_delivery",
    evidenceHash: "evidence_hash_003",
    responseHash: "response_hash_003",
    status: "resolved",
    resolution: "against_agent",
    filedAt: 1719014400,
    resolvedAt: 1719619200,
  },
  {
    id: 4,
    claimant: "GDONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JON",
    agentId: 4,
    transactionHash: "txn_hash_jkl012",
    claimType: "fraud",
    evidenceHash: "evidence_hash_004",
    status: "resolved",
    resolution: "dismissed",
    filedAt: 1717632000,
    resolvedAt: 1718236800,
  },
  {
    id: 5,
    claimant: "GEYXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JONASVQD3YX",
    agentId: 1,
    transactionHash: "txn_hash_mno345",
    claimType: "poor_quality",
    evidenceHash: "evidence_hash_005",
    responseHash: "response_hash_005",
    status: "resolved",
    resolution: "for_agent",
    filedAt: 1716422400,
    resolvedAt: 1717027200,
  },
];

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: ClaimStatus }) {
  const styles: Record<ClaimStatus, string> = {
    open: "bg-yellow-500/10 text-yellow-500",
    responded: "bg-blue-500/10 text-blue-500",
    resolved: "bg-green-500/10 text-green-500",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ResolutionBadge({ resolution }: { resolution: Resolution }) {
  const styles: Record<Resolution, string> = {
    against_agent: "bg-red-500/10 text-red-500",
    for_agent: "bg-green-500/10 text-green-500",
    dismissed: "bg-gray-500/10 text-gray-500",
  };
  const labels: Record<Resolution, string> = {
    against_agent: "Against Agent",
    for_agent: "For Agent",
    dismissed: "Dismissed",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[resolution]}`}
    >
      {labels[resolution]}
    </span>
  );
}

export default function DisputesPage() {
  const { isConnected, connect } = useWallet();
  const [tab, setTab] = useState<DisputeTab>("file");

  // File Claim form state
  const [agentAddress, setAgentAddress] = useState("");
  const [txHash, setTxHash] = useState("");
  const [claimType, setClaimType] = useState<ClaimType>("non_delivery");
  const [evidenceHash, setEvidenceHash] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  async function handleFileClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!agentAddress.trim() || !txHash.trim()) return;
    setIsSubmitting(true);
    // In production, this would submit to the dispute-resolution Soroban contract
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setAgentAddress("");
    setTxHash("");
    setEvidenceHash("");
    setDescription("");
  }

  const tabs: { id: DisputeTab; label: string }[] = [
    { id: "file", label: "File Claim" },
    { id: "my-claims", label: "My Claims" },
    { id: "history", label: "Resolution History" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)]">
        Disputes
      </h1>
      <p className="mt-2 text-[var(--text-secondary)]">
        File claims against agents, track your disputes, and review resolution
        history.
      </p>

      {/* Tabs */}
      <div className="mt-8 border-b border-[var(--border)]">
        <div className="-mb-px flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`border-b-2 pb-3 pt-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-stellar-blue text-stellar-blue"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 animate-fade-in">
        {/* File Claim Tab */}
        {tab === "file" && (
          <div>
            {!isConnected ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-12 text-center">
                <p className="text-[var(--text-secondary)]">
                  Connect your wallet to file a dispute claim.
                </p>
                <button
                  onClick={connect}
                  className="mt-4 rounded-lg bg-stellar-blue px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  Connect Wallet
                </button>
              </div>
            ) : submitSuccess ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-trust-trusted/10">
                  <span className="text-2xl text-trust-trusted">&#10003;</span>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                  Claim Submitted
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Your claim has been submitted on-chain. The agent will be
                  notified and can respond within 7 days.
                </p>
                <button
                  onClick={() => {
                    setSubmitSuccess(false);
                    setTab("my-claims");
                  }}
                  className="mt-6 rounded-lg bg-stellar-blue px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  View My Claims
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleFileClaim}
                className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8"
              >
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)]">
                    Agent Address
                  </label>
                  <input
                    type="text"
                    required
                    value={agentAddress}
                    onChange={(e) => setAgentAddress(e.target.value)}
                    placeholder="G..."
                    className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-stellar-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)]">
                    Transaction Hash
                  </label>
                  <input
                    type="text"
                    required
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="Transaction hash from the disputed interaction"
                    className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-stellar-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)]">
                    Claim Type
                  </label>
                  <select
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value as ClaimType)}
                    className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-stellar-blue"
                  >
                    {CLAIM_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>
                        {ct.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)]">
                    Evidence Hash{" "}
                    <span className="text-[var(--text-tertiary)]">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={evidenceHash}
                    onChange={(e) => setEvidenceHash(e.target.value)}
                    placeholder="IPFS hash or on-chain reference to evidence"
                    className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-stellar-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)]">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe the issue in detail..."
                    className="mt-1.5 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-stellar-blue"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-stellar-blue px-8 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Claim"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* My Claims Tab */}
        {tab === "my-claims" && (
          <div>
            {!isConnected ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-12 text-center">
                <p className="text-[var(--text-secondary)]">
                  Connect your wallet to view your claims.
                </p>
                <button
                  onClick={connect}
                  className="mt-4 rounded-lg bg-stellar-blue px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  Connect Wallet
                </button>
              </div>
            ) : MOCK_MY_CLAIMS.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-12 text-center">
                <p className="text-lg font-medium text-[var(--text-primary)]">
                  No claims filed
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  You haven&apos;t filed any dispute claims yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="pb-3 text-left font-medium text-[var(--text-secondary)]">
                        ID
                      </th>
                      <th className="pb-3 text-left font-medium text-[var(--text-secondary)]">
                        Agent
                      </th>
                      <th className="pb-3 text-left font-medium text-[var(--text-secondary)]">
                        Type
                      </th>
                      <th className="pb-3 text-left font-medium text-[var(--text-secondary)]">
                        Filed
                      </th>
                      <th className="pb-3 text-center font-medium text-[var(--text-secondary)]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {MOCK_MY_CLAIMS.map((claim) => (
                      <tr key={claim.id}>
                        <td className="py-3 text-[var(--text-primary)]">
                          #{claim.id}
                        </td>
                        <td className="py-3 text-[var(--text-primary)]">
                          Agent #{claim.agentId}
                        </td>
                        <td className="py-3 capitalize text-[var(--text-secondary)]">
                          {claim.claimType.replace("_", " ")}
                        </td>
                        <td className="py-3 text-[var(--text-tertiary)]">
                          {formatDate(claim.filedAt)}
                        </td>
                        <td className="py-3 text-center">
                          <StatusBadge status={claim.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Resolution History Tab */}
        {tab === "history" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="pb-3 text-left font-medium text-[var(--text-secondary)]">
                    ID
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--text-secondary)]">
                    Agent
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--text-secondary)]">
                    Type
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--text-secondary)]">
                    Filed
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--text-secondary)]">
                    Resolved
                  </th>
                  <th className="pb-3 text-center font-medium text-[var(--text-secondary)]">
                    Resolution
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {MOCK_RESOLVED.map((claim) => (
                  <tr key={claim.id}>
                    <td className="py-3 text-[var(--text-primary)]">
                      #{claim.id}
                    </td>
                    <td className="py-3 text-[var(--text-primary)]">
                      Agent #{claim.agentId}
                    </td>
                    <td className="py-3 capitalize text-[var(--text-secondary)]">
                      {claim.claimType.replace("_", " ")}
                    </td>
                    <td className="py-3 text-[var(--text-tertiary)]">
                      {formatDate(claim.filedAt)}
                    </td>
                    <td className="py-3 text-[var(--text-tertiary)]">
                      {claim.resolvedAt ? formatDate(claim.resolvedAt) : "-"}
                    </td>
                    <td className="py-3 text-center">
                      {claim.resolution && (
                        <ResolutionBadge resolution={claim.resolution} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
