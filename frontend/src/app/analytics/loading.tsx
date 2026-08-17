export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-[var(--bg-tertiary)]" />
      <div className="mt-2 h-4 w-80 animate-pulse rounded bg-[var(--bg-tertiary)]" />
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]"
          />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]" />
        <div className="h-64 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]" />
      </div>
    </div>
  );
}
