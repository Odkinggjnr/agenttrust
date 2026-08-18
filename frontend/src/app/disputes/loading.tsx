export default function DisputesLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-8 w-32 animate-pulse rounded-lg bg-[var(--bg-tertiary)]" />
      <div className="mt-2 h-4 w-64 animate-pulse rounded bg-[var(--bg-tertiary)]" />

      <div className="mt-8 flex gap-6 border-b border-[var(--border)] pb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-4 w-24 animate-pulse rounded bg-[var(--bg-tertiary)]"
          />
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]"
          />
        ))}
      </div>
    </div>
  );
}
