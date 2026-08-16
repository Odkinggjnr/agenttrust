import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Logo + tagline */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stellar-blue">
                <span className="text-sm font-bold text-white">AT</span>
              </div>
              <span className="text-lg font-bold text-[var(--text-primary)]">
                AgentTrust
              </span>
            </div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              The trust layer for AI agents on Stellar. On-chain attestation
              and reputation for the x402 agent economy.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-[var(--text-secondary)]">
                Built on Stellar
              </span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Product
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/registry" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Registry
                </Link>
              </li>
              <li>
                <Link href="/verify" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Verify
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Developer links */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Developers
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/docs" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Docs
                </Link>
              </li>
              <li>
                <Link href="/sdk" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  SDK
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Protocol links */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Protocol
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/analytics" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Analytics
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Odkinggjnr/agenttrust"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-[var(--border)] pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-[var(--text-tertiary)]">
            Built on Stellar. Powered by Soroban smart contracts.
          </p>
          <p className="text-sm text-[var(--text-tertiary)]">
            &copy; {new Date().getFullYear()} AgentTrust. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
