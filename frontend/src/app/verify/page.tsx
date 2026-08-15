"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getTrustTier, getTierLabel, getTierColor } from "@/types/reputation";

type CodeTab = "curl" | "javascript" | "python";

interface VerifyResult {
  agent: {
    address: string;
    name: string;
    status: string;
    capabilities: string[];
    registeredAt: number;
    stakeAmount: string;
  };
  score: number;
  tier: string;
  flags: string[];
  attestationCount: number;
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const [address, setAddress] = useState(searchParams.get("address") || "");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeTab, setCodeTab] = useState<CodeTab>("curl");

  useEffect(() => {
    const addr = searchParams.get("address");
    if (addr) {
      setAddress(addr);
      runVerification(addr);
    }
  }, [searchParams]);

  async function runVerification(addr: string) {
    if (!addr.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Verification failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runVerification(address);
  }

  const tier = result ? getTrustTier(result.score) : null;
  const tierColor = tier ? getTierColor(tier) : "";
  const normalizedScore = result
    ? Math.round((result.score / 10000) * 100)
    : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          Verify an Agent
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Enter a Stellar address to check an agent&apos;s trust score,
          reputation tier, and on-chain history.
        </p>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-2xl gap-3"
      >
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Stellar address (G...)"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-stellar-blue focus:ring-1 focus:ring-stellar-blue"
        />
        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="rounded-lg bg-stellar-blue px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>

      {error && (
        <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-score-red/20 bg-score-red/5 p-4 text-center text-sm text-score-red">
          {error}
        </div>
      )}

      {/* Results */}
      {result && tier && (
        <div className="mt-10 animate-slide-up">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8">
            <div className="flex flex-col items-center gap-8 md:flex-row">
              {/* Trust Ring */}
              <div className="flex-shrink-0">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r="54"
                    fill="none"
                    stroke="var(--ring-bg)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r="54"
                    fill="none"
                    stroke={tierColor}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                    className="animate-score-ring"
                    style={
                      { "--score-offset": `${offset}` } as React.CSSProperties
                    }
                  />
                  <text
                    x="70"
                    y="64"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="30"
                    fontWeight="bold"
                    fill={tierColor}
                  >
                    {normalizedScore}
                  </text>
                  <text
                    x="70"
                    y="88"
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--text-tertiary)"
                  >
                    Trust Score
                  </text>
                </svg>
              </div>

              {/* Agent Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {result.agent.name}
                  </h2>
                  <span
                    className="rounded-full px-3 py-0.5 text-sm font-semibold"
                    style={{
                      backgroundColor: tierColor + "1A",
                      color: tierColor,
                    }}
                  >
                    {getTierLabel(tier)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      result.agent.status === "active"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {result.agent.status}
                  </span>
                </div>
                <p className="mt-1 font-mono text-sm text-[var(--text-tertiary)]">
                  {result.agent.address}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {result.score.toLocaleString()}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Raw Score
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {result.attestationCount}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Attestations
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {result.agent.stakeAmount} XLM
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Staked
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {result.agent.capabilities.length}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Capabilities
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Flags */}
            {result.flags.length > 0 && (
              <div className="mt-6 rounded-lg border border-score-orange/20 bg-score-orange/5 p-4">
                <h3 className="text-sm font-semibold text-score-orange">
                  Alerts
                </h3>
                <ul className="mt-2 space-y-1">
                  {result.flags.map((flag, i) => (
                    <li
                      key={i}
                      className="text-sm text-[var(--text-secondary)]"
                    >
                      - {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Documentation */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          API Reference
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Integrate agent verification directly into your application.
        </p>

        <div className="mt-6">
          <div className="flex gap-1 border-b border-[var(--border)]">
            {(["curl", "javascript", "python"] as CodeTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setCodeTab(tab)}
                className={`border-b-2 px-4 pb-2 pt-1 text-sm font-medium transition-colors ${
                  codeTab === tab
                    ? "border-stellar-blue text-stellar-blue"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab === "curl"
                  ? "cURL"
                  : tab === "javascript"
                  ? "JavaScript"
                  : "Python"}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-[var(--bg-secondary)] p-5">
            <pre className="overflow-x-auto text-sm text-[var(--text-secondary)]">
              {codeTab === "curl" && (
                <code>{`curl -X POST https://api.agenttrust.io/v1/verify \\
  -H "Content-Type: application/json" \\
  -d '{"address": "GABCDEF...XYZ"}'

# Response
{
  "score": 8750,
  "tier": "trusted",
  "status": "active",
  "flags": []
}`}</code>
              )}
              {codeTab === "javascript" && (
                <code>{`import { AgentTrust } from "@agent-trust/sdk";

const client = new AgentTrust({ network: "mainnet" });

const result = await client.verify("GABCDEF...XYZ");

console.log(result.tier);   // "trusted"
console.log(result.score);  // 8750
console.log(result.flags);  // []`}</code>
              )}
              {codeTab === "python" && (
                <code>{`from agent_trust import AgentTrustClient

client = AgentTrustClient(network="mainnet")

result = client.verify("GABCDEF...XYZ")

print(result.tier)    # "trusted"
print(result.score)   # 8750
print(result.flags)   # []`}</code>
              )}
            </pre>
          </div>
        </div>
      </section>

      {/* Embeddable Widget */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Embeddable Widget
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Add a trust badge to your agent&apos;s UI.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-[var(--bg-secondary)] p-5">
            <pre className="overflow-x-auto text-sm text-[var(--text-secondary)]">
              <code>{`<script src="https://cdn.agenttrust.io/widget.js"></script>
<agent-trust-badge
  address="GABCDEF...XYZ"
  theme="auto"
  size="standard"
/>`}</code>
            </pre>
          </div>
          <div className="flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-8">
            <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-3">
              <svg width="32" height="32" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="var(--ring-bg)"
                  strokeWidth="3"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeDasharray={2 * Math.PI * 18}
                  strokeDashoffset={
                    2 * Math.PI * 18 - (87 / 100) * (2 * Math.PI * 18)
                  }
                  strokeLinecap="round"
                  transform="rotate(-90 22 22)"
                />
                <text
                  x="22"
                  y="22"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#10B981"
                >
                  87
                </text>
              </svg>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Trusted Agent
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Verified by AgentTrust
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-10 text-center text-[var(--text-secondary)]">
          Loading verification form...
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
