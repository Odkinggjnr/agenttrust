"use client";

import React, { useState } from "react";
import { useWallet } from "@/app/providers";

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function ConnectWallet() {
  const { address, isConnected, connect, disconnect } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connect();
    } finally {
      setConnecting(false);
    }
  };

  // Disconnected state
  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        className={`
          inline-flex items-center justify-center gap-2
          rounded-lg bg-stellar-blue px-4 py-2 text-sm font-medium text-white
          transition-opacity hover:opacity-90
          ${connecting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {connecting ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Connecting...
          </>
        ) : (
          "Connect Wallet"
        )}
      </button>
    );
  }

  // Connected state
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu((prev) => !prev)}
        className="
          inline-flex items-center gap-2 px-3 py-2 text-sm font-medium
          rounded-lg border border-[var(--border)]
          bg-[var(--bg-primary)] text-[var(--text-primary)]
          hover:bg-[var(--bg-secondary)] transition-colors
        "
      >
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="font-mono text-xs">
          {address ? truncateAddress(address) : ""}
        </span>
        <svg
          className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${showMenu ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] shadow-lg z-20 animate-fade-in">
            <div className="p-1">
              <button
                onClick={() => {
                  if (address) navigator.clipboard.writeText(address).catch(() => {});
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
              >
                Copy Address
              </button>
              <button
                onClick={() => {
                  disconnect();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
