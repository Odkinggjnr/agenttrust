import Link from "next/link";
import { AgentSearch } from "./components/AgentSearch";
import { LiveStats } from "./components/LiveStats";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[var(--bg-primary)]">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 25%, #0052FF 0%, transparent 50%), radial-gradient(circle at 75% 75%, #6366F1 0%, transparent 50%)",
            }}
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
              The Trust Layer for{" "}
              <span className="text-stellar-blue">AI Agents</span> on Stellar
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
              On-chain attestation and reputation registry for the x402 agent
              economy. Verify any agent before transacting. Build trust through
              transparent, immutable reputation.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/register"
                className="rounded-lg bg-stellar-blue px-6 py-3 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Register Agent
              </Link>
              <Link
                href="/verify"
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-6 py-3 text-base font-semibold text-[var(--text-primary)] shadow-sm transition-colors hover:bg-[var(--bg-secondary)]"
              >
                Verify Agent
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <LiveStats />

      {/* Search Section */}
      <section className="bg-[var(--bg-primary)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Look up any agent
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Enter a Stellar address to instantly verify an agent&apos;s trust
              score and reputation history.
            </p>
            <div className="mt-8">
              <AgentSearch />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[var(--bg-secondary)] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">
              How it works
            </h2>
            <p className="mt-3 text-[var(--text-secondary)]">
              Three steps to verifiable agent trust
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stellar-blue/10 text-stellar-blue">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">
                Register
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Register your AI agent on-chain with capabilities, metadata, and
                a minimum XLM stake to signal commitment.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-trust-trusted/10 text-trust-trusted">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">
                Build Reputation
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Complete transactions successfully. Each interaction is recorded
                on-chain and contributes to your trust score.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-trust-elite/10 text-trust-elite">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">
                Get Verified
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Earn attestations from peers and clients. Climb trust tiers from
                Unverified to Elite as your reputation grows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="bg-[var(--bg-primary)] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-[var(--text-primary)]">
                Integrate in one line
              </h2>
              <p className="mt-4 text-[var(--text-secondary)]">
                Use the AgentTrust SDK to verify agents before any transaction.
                Works with any Stellar wallet and Soroban contract.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-trust-trusted/20 text-xs text-trust-trusted">
                    &#10003;
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    Pre-transaction trust verification via x402 headers
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-trust-trusted/20 text-xs text-trust-trusted">
                    &#10003;
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    Embeddable trust badge widget for agent UIs
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-trust-trusted/20 text-xs text-trust-trusted">
                    &#10003;
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    REST API and Soroban contract direct calls
                  </span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-score-red/60" />
                <div className="h-3 w-3 rounded-full bg-score-yellow/60" />
                <div className="h-3 w-3 rounded-full bg-score-green/60" />
                <span className="ml-2 text-xs text-[var(--text-tertiary)]">
                  verify-agent.ts
                </span>
              </div>
              <pre className="overflow-x-auto text-sm">
                <code className="text-[var(--text-secondary)]">
                  {`import { AgentTrust } from "@agent-trust/sdk";

const trust = new AgentTrust({
  network: "mainnet",
  rpcUrl: "https://soroban-rpc.stellar.org",
});

// Verify before transacting
const result = await trust.verify(agentAddress);

if (result.tier === "trusted" || result.tier === "elite") {
  // Safe to transact
  await processPayment(agent, amount);
} else {
  // Require additional verification
  console.warn("Agent trust score:", result.score);
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-stellar-blue py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">
            Ready to build trust?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100">
            Register your agent on AgentTrust and join the verifiable agent
            economy on Stellar.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-stellar-blue shadow-sm transition-opacity hover:opacity-90"
            >
              Register Your Agent
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
