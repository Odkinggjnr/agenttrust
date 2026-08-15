"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/app/providers";
import { CAPABILITIES } from "@/types/agent";
import type { CapabilityCategory } from "@/types/agent";

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { num: 1, label: "Connect Wallet" },
  { num: 2, label: "Agent Details" },
  { num: 3, label: "Capabilities" },
  { num: 4, label: "Stake & Confirm" },
] as const;

const CATEGORIES: CapabilityCategory[] = ["text", "image", "data", "payment"];
const CATEGORY_LABELS: Record<CapabilityCategory, string> = {
  text: "Text",
  image: "Image",
  data: "Data",
  payment: "Payment",
};

const MIN_STAKE = 100;

export default function RegisterPage() {
  const { address, isConnected, connect } = useWallet();
  const [step, setStep] = useState<Step>(1);
  const [agentName, setAgentName] = useState("");
  const [description, setDescription] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>(
    []
  );
  const [stakeAmount, setStakeAmount] = useState(MIN_STAKE.toString());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggleCapability(capId: string) {
    setSelectedCapabilities((prev) =>
      prev.includes(capId)
        ? prev.filter((c) => c !== capId)
        : [...prev, capId]
    );
  }

  function validateStep(s: Step): boolean {
    const newErrors: Record<string, string> = {};

    if (s === 1) {
      if (!isConnected) {
        newErrors.wallet = "Please connect your wallet to continue.";
      }
    } else if (s === 2) {
      if (!agentName.trim()) newErrors.name = "Agent name is required.";
      if (agentName.trim().length > 64)
        newErrors.name = "Name must be 64 characters or fewer.";
      if (!description.trim())
        newErrors.description = "Description is required.";
      if (!endpoint.trim()) newErrors.endpoint = "Endpoint URL is required.";
      try {
        if (endpoint.trim()) new URL(endpoint.trim());
      } catch {
        newErrors.endpoint = "Please enter a valid URL.";
      }
    } else if (s === 3) {
      if (selectedCapabilities.length === 0)
        newErrors.capabilities = "Select at least one capability.";
    } else if (s === 4) {
      const stake = parseFloat(stakeAmount);
      if (isNaN(stake) || stake < MIN_STAKE)
        newErrors.stake = `Minimum stake is ${MIN_STAKE} XLM.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function goNext() {
    if (validateStep(step) && step < 4) {
      setStep((step + 1) as Step);
    }
  }

  function goBack() {
    if (step > 1) setStep((step - 1) as Step);
  }

  async function handleSubmit() {
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    // In production, this would call the Soroban agent-registry contract
    await new Promise((r) => setTimeout(r, 2000));
    setIsSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-trust-trusted/10">
          <span className="text-3xl text-trust-trusted">&#10003;</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-[var(--text-primary)]">
          Agent Registered
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Your agent &ldquo;{agentName}&rdquo; has been submitted for
          on-chain registration. The transaction is being processed on the
          Stellar network.
        </p>
        <p className="mt-6 font-mono text-sm text-[var(--text-tertiary)]">
          Agent Address: {address?.slice(0, 8)}...{address?.slice(-8)}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/registry"
            className="rounded-lg bg-stellar-blue px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            View Registry
          </Link>
          <Link
            href="/verify"
            className="rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
          >
            Verify Agent
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)]">
        Register Your Agent
      </h1>
      <p className="mt-2 text-[var(--text-secondary)]">
        Register an AI agent on the Stellar network with verifiable
        capabilities and a trust stake.
      </p>

      {/* Step Indicator */}
      <div className="mt-8 flex items-center">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  step >= s.num
                    ? "bg-stellar-blue text-white"
                    : "border-2 border-[var(--border)] text-[var(--text-tertiary)]"
                }`}
              >
                {step > s.num ? (
                  <span>&#10003;</span>
                ) : (
                  s.num
                )}
              </div>
              <span
                className={`mt-1.5 text-xs ${
                  step >= s.num
                    ? "font-medium text-[var(--text-primary)]"
                    : "text-[var(--text-tertiary)]"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 ${
                  step > s.num
                    ? "bg-stellar-blue"
                    : "bg-[var(--border)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="mt-10 animate-fade-in">
        {/* Step 1: Connect Wallet */}
        {step === 1 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8 text-center">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Connect Your Wallet
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Connect a Stellar wallet to register your agent on-chain. This
              wallet address will be the agent&apos;s owner.
            </p>
            {isConnected ? (
              <div className="mt-6">
                <div className="mx-auto inline-flex items-center gap-2 rounded-lg bg-trust-trusted/10 px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-trust-trusted" />
                  <span className="text-sm font-medium text-trust-trusted">
                    Connected
                  </span>
                </div>
                <p className="mt-3 font-mono text-sm text-[var(--text-secondary)]">
                  {address}
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <button
                  onClick={connect}
                  className="rounded-lg bg-stellar-blue px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Connect Wallet
                </button>
                {errors.wallet && (
                  <p className="mt-3 text-sm text-score-red">
                    {errors.wallet}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Agent Details */}
        {step === 2 && (
          <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Agent Details
            </h2>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Agent Name
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g. TextMaster Pro"
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-stellar-blue"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-score-red">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your agent does..."
                rows={4}
                className="mt-1.5 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-stellar-blue"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-score-red">
                  {errors.description}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Endpoint URL
              </label>
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://api.youragent.com/v1"
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-stellar-blue"
              />
              {errors.endpoint && (
                <p className="mt-1 text-sm text-score-red">
                  {errors.endpoint}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Metadata URI{" "}
                <span className="text-[var(--text-tertiary)]">(optional)</span>
              </label>
              <input
                type="url"
                value={metadataUri}
                onChange={(e) => setMetadataUri(e.target.value)}
                placeholder="https://meta.youragent.com/info.json"
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-stellar-blue"
              />
            </div>
          </div>
        )}

        {/* Step 3: Capabilities */}
        {step === 3 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Select Capabilities
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Choose what your agent can do. This helps users find and evaluate
              your agent.
            </p>
            {errors.capabilities && (
              <p className="mt-2 text-sm text-score-red">
                {errors.capabilities}
              </p>
            )}
            <div className="mt-6 space-y-6">
              {CATEGORIES.map((cat) => {
                const caps = CAPABILITIES.filter((c) => c.category === cat);
                return (
                  <div key={cat}>
                    <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                      {CATEGORY_LABELS[cat]}
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {caps.map((cap) => {
                        const checked = selectedCapabilities.includes(cap.id);
                        return (
                          <label
                            key={cap.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                              checked
                                ? "border-stellar-blue bg-stellar-blue/5"
                                : "border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--text-tertiary)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCapability(cap.id)}
                              className="mt-0.5 h-4 w-4 rounded accent-stellar-blue"
                            />
                            <div>
                              <span className="text-sm font-medium text-[var(--text-primary)]">
                                {cap.name}
                              </span>
                              <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                                {cap.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Stake & Confirm */}
        {step === 4 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Stake & Confirm
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Stake XLM to signal commitment. Higher stakes increase initial
              trust. Minimum stake is {MIN_STAKE} XLM.
            </p>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Stake Amount (XLM)
                </label>
                <input
                  type="number"
                  min={MIN_STAKE}
                  step="1"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-stellar-blue"
                />
                {errors.stake && (
                  <p className="mt-1 text-sm text-score-red">{errors.stake}</p>
                )}
                <div className="mt-3 flex items-center justify-between text-sm text-[var(--text-tertiary)]">
                  <span>Wallet Balance</span>
                  <span>10,000.00 XLM</span>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-5">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Registration Summary
                </h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[var(--text-secondary)]">Name</dt>
                    <dd className="font-medium text-[var(--text-primary)]">
                      {agentName || "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--text-secondary)]">
                      Capabilities
                    </dt>
                    <dd className="font-medium text-[var(--text-primary)]">
                      {selectedCapabilities.length}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--text-secondary)]">Endpoint</dt>
                    <dd className="max-w-[180px] truncate font-medium text-[var(--text-primary)]">
                      {endpoint || "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border)] pt-2">
                    <dt className="font-medium text-[var(--text-primary)]">
                      Stake
                    </dt>
                    <dd className="font-bold text-stellar-blue">
                      {stakeAmount} XLM
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-lg bg-stellar-blue px-10 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting
                  ? "Submitting Transaction..."
                  : "Confirm & Register"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={goBack}
          disabled={step === 1}
          className="rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-40"
        >
          Back
        </button>
        {step < 4 && (
          <button
            onClick={goNext}
            className="rounded-lg bg-stellar-blue px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
