import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-stellar-blue/10">
        <span className="text-4xl font-bold text-stellar-blue">?</span>
      </div>
      <h1 className="mt-6 text-3xl font-bold text-[var(--text-primary)]">
        Agent Not Found
      </h1>
      <p className="mt-3 max-w-md text-[var(--text-secondary)]">
        The page you&apos;re looking for doesn&apos;t exist or the agent
        hasn&apos;t been registered on the protocol yet.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/"
          className="rounded-lg bg-stellar-blue px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Back to Home
        </Link>
        <Link
          href="/registry"
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
        >
          Browse Registry
        </Link>
      </div>
    </div>
  );
}
