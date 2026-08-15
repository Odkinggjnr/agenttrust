export type TrustTier = "unverified" | "emerging" | "established" | "trusted" | "elite";

export interface AgentTrustResult {
  address: string;
  exists: boolean;
  score: number;
  tier: TrustTier;
  status: "active" | "suspended" | "deregistering" | "not_found";
  totalTransactions: number;
  successfulTransactions: number;
  successRate: number;
  totalVolume: string;
  stake: string;
  capabilities: string[];
  registeredAt: number;
  flags: TrustFlag[];
}

export interface TrustFlag {
  type: "warning" | "danger" | "info";
  code: string;
  message: string;
}

export interface AgentTrustConfig {
  network: "testnet" | "mainnet";
  rpcUrl?: string;
  contractIds?: {
    registry?: string;
    reputation?: string;
  };
  cache?: {
    enabled: boolean;
    ttlMs?: number;
  };
}

export interface MiddlewareConfig {
  minScore?: number;
  minTier?: TrustTier;
  requireActive?: boolean;
  extractAddress?: (req: any) => string | null;
  onRejection?: (req: any, res: any, result: AgentTrustResult) => void;
  cache?: boolean;
  cacheTtlMs?: number;
}

export interface VerifyOptions {
  includeHistory?: boolean;
  includeAttestations?: boolean;
  maxAge?: number;
}
