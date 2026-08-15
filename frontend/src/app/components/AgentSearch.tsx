"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AgentSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/verify?address=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter Stellar address (G...)"
        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-colors focus:border-stellar-blue focus:ring-1 focus:ring-stellar-blue"
      />
      <button
        type="submit"
        className="rounded-lg bg-stellar-blue px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Look Up
      </button>
    </form>
  );
}
