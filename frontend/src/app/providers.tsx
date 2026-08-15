"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  const connect = useCallback(async () => {
    // In production, this would use passkey-kit or Freighter to connect
    // For now, simulate a connection with a mock Stellar address
    const mockAddress = "GBXYZ" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".slice(0, 51);
    setAddress(mockAddress);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: address !== null,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
