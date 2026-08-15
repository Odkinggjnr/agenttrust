"use client";
import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "agenttrust_wallet_address";

interface UseWalletReturn {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sign: (xdr: string) => Promise<string>;
}

function generateMockStellarAddress(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let address = "G";
  for (let i = 1; i < 56; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

export function useWallet(): UseWalletReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Restore persisted connection on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAddress(stored);
      }
    }
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    if (isConnecting) return;

    setIsConnecting(true);

    try {
      // In production, this would use passkey-kit to:
      // 1. Prompt for biometric authentication
      // 2. Create or retrieve a passkey credential
      // 3. Deploy or look up the smart wallet contract
      // 4. Return the contract address
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));

      const mockAddress = generateMockStellarAddress();
      setAddress(mockAddress);

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, mockAddress);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const disconnect = useCallback((): void => {
    setAddress(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const sign = useCallback(async (xdr: string): Promise<string> => {
    if (!address) {
      throw new Error("Wallet not connected. Call connect() first.");
    }

    // In production, this would use passkey-kit to:
    // 1. Prompt for biometric authentication
    // 2. Sign the transaction XDR with the passkey
    // 3. Return the signed XDR
    // For mock mode, return the input XDR unchanged
    return xdr;
  }, [address]);

  return {
    address,
    isConnected: address !== null,
    isConnecting,
    connect,
    disconnect,
    sign,
  };
}
