"use client";

import { useEffect, useState } from "react";

interface Stats {
  agents: number;
  transactions: number;
  volume: string;
}

export function LiveStats() {
  const [stats, setStats] = useState<Stats>({
    agents: 0,
    transactions: 0,
    volume: "$0",
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // In production, fetch from Soroban RPC or an indexer.
    // Simulate loading with placeholder data.
    const timer = setTimeout(() => {
      setStats({
        agents: 1247,
        transactions: 89432,
        volume: "$2.4M",
      });
      setLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const items = [
    { label: "Registered Agents", value: stats.agents.toLocaleString() },
    { label: "Verified Transactions", value: stats.transactions.toLocaleString() },
    { label: "Total Volume", value: stats.volume },
  ];

  return (
    <section className="border-y border-[var(--border)] bg-[var(--bg-secondary)] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 text-center transition-opacity duration-500 ${
                loaded ? "opacity-100" : "opacity-40"
              }`}
            >
              <p className="text-3xl font-bold text-stellar-blue">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
