export interface ContractResponse<T> {
  result: T;
  latestLedger: number;
  cost: {
    cpuInsns: string;
    memBytes: string;
  };
}

export interface TransactionResult {
  hash: string;
  status: "success" | "failed" | "pending";
  ledger: number;
  resultXdr: string;
}

export interface ContractConfig {
  contractId: string;
  networkPassphrase: string;
  rpcUrl: string;
}

export interface Claim {
  id: number;
  claimant: string;
  agentId: number;
  transactionHash: string;
  claimType: ClaimType;
  evidenceHash: string;
  responseHash?: string;
  status: ClaimStatus;
  resolution?: Resolution;
  filedAt: number;
  resolvedAt?: number;
}

export type ClaimType = "non_delivery" | "poor_quality" | "fraud" | "overcharge" | "other";
export type ClaimStatus = "open" | "responded" | "resolved";
export type Resolution = "against_agent" | "for_agent" | "dismissed";
