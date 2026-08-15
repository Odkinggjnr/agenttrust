"use client";
import { useState, useCallback } from "react";
import type { TransactionResult } from "@/types/contract";

interface UseContractReturn {
  invoke: (method: string, args?: Record<string, unknown>) => Promise<TransactionResult>;
  query: (method: string, args?: Record<string, unknown>) => Promise<unknown>;
  isLoading: boolean;
  error: string | null;
}

function generateMockTxHash(): string {
  const hexChars = "abcdef0123456789";
  let hash = "";
  for (let i = 0; i < 64; i++) {
    hash += hexChars[Math.floor(Math.random() * hexChars.length)];
  }
  return hash;
}

function generateMockResultXdr(): string {
  // Generate a realistic-looking base64 XDR string
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let xdr = "";
  for (let i = 0; i < 88; i++) {
    xdr += chars[Math.floor(Math.random() * chars.length)];
  }
  return xdr + "==";
}

export function useContract(contractName: string): UseContractReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invoke = useCallback(
    async (method: string, args?: Record<string, unknown>): Promise<TransactionResult> => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`[${contractName}] Invoking ${method}`, args);

        // In production, this would:
        // 1. Build the transaction using buildTransaction()
        // 2. Simulate the transaction via Soroban RPC
        // 3. Have the user sign it via passkey-kit
        // 4. Submit via Launchtube for fee abstraction
        // 5. Poll for transaction result

        // Mock: simulate network delay
        await new Promise<void>((resolve) => setTimeout(resolve, 1500));

        const result: TransactionResult = {
          hash: generateMockTxHash(),
          status: "success",
          ledger: Math.floor(Date.now() / 5000), // roughly every 5s like Stellar
          resultXdr: generateMockResultXdr(),
        };

        console.log(`[${contractName}] Transaction successful:`, result.hash);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to invoke ${contractName}.${method}`;
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [contractName]
  );

  const query = useCallback(
    async (method: string, args?: Record<string, unknown>): Promise<unknown> => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`[${contractName}] Querying ${method}`, args);

        // In production, this would:
        // 1. Create a Contract instance with the contract ID
        // 2. Call contract.call(method, ...args) via Soroban RPC
        // 3. Parse and return the result

        // Mock: simulate network delay
        await new Promise<void>((resolve) => setTimeout(resolve, 500));

        // Return mock data based on method name patterns
        const mockResponses: Record<string, unknown> = {
          get_agent: {
            id: 1,
            owner: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV",
            trust_score: 7500,
            status: "active",
          },
          get_score: 7500,
          get_stake: "10000000000",
          get_claims: [],
          get_attestations: [],
          is_registered: true,
          get_config: {
            min_stake: "1000000000",
            dispute_period: 604800,
          },
        };

        const result = mockResponses[method] ?? null;
        console.log(`[${contractName}] Query result:`, result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to query ${contractName}.${method}`;
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [contractName]
  );

  return { invoke, query, isLoading, error };
}
