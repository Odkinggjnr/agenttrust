import * as StellarSdk from "@stellar/stellar-sdk";
import { AgentTrustConfig, AgentTrustResult, TrustTier, TrustFlag, VerifyOptions } from "./types";
import { getTierFromScore, isValidStellarAddress } from "./utils";

const DEFAULT_RPC_URLS: Record<string, string> = {
  testnet: "https://soroban-testnet.stellar.org",
  mainnet: "https://soroban.stellar.org",
};

const DEFAULT_CACHE_TTL_MS = 60_000;

interface CacheEntry {
  result: AgentTrustResult;
  timestamp: number;
}

export class AgentTrustClient {
  private config: {
    network: "testnet" | "mainnet";
    rpcUrl: string;
    contractIds: {
      registry: string;
      reputation: string;
    };
    cache: {
      enabled: boolean;
      ttlMs: number;
    };
  };
  private rpc: StellarSdk.SorobanRpc.Server;
  private cache: Map<string, CacheEntry>;

  constructor(config: AgentTrustConfig) {
    this.config = {
      network: config.network,
      rpcUrl: config.rpcUrl ?? DEFAULT_RPC_URLS[config.network],
      contractIds: {
        registry: config.contractIds?.registry ?? "",
        reputation: config.contractIds?.reputation ?? "",
      },
      cache: {
        enabled: config.cache?.enabled ?? true,
        ttlMs: config.cache?.ttlMs ?? DEFAULT_CACHE_TTL_MS,
      },
    };

    this.rpc = new StellarSdk.SorobanRpc.Server(this.config.rpcUrl);
    this.cache = new Map();
  }

  async verify(address: string, options?: VerifyOptions): Promise<AgentTrustResult> {
    if (!isValidStellarAddress(address)) {
      return this.notFoundResult(address, [
        {
          type: "danger",
          code: "INVALID_ADDRESS",
          message: "The provided address is not a valid Stellar public key",
        },
      ]);
    }

    if (this.config.cache.enabled) {
      const cached = this.cache.get(address);
      if (cached) {
        const age = Date.now() - cached.timestamp;
        const maxAge = options?.maxAge ?? this.config.cache.ttlMs;
        if (age < maxAge) {
          return cached.result;
        }
        this.cache.delete(address);
      }
    }

    let agentData: {
      exists: boolean;
      agentId: number;
      status: "active" | "suspended" | "deregistering" | "not_found";
      stake: string;
      capabilities: string[];
      registeredAt: number;
      trustScore: number;
      totalTransactions: number;
      successfulTransactions: number;
      totalVolume: string;
    };

    try {
      agentData = await this.queryAgentRegistry(address);
    } catch {
      agentData = {
        exists: false,
        agentId: 0,
        status: "not_found",
        stake: "0",
        capabilities: [],
        registeredAt: 0,
        trustScore: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
        totalVolume: "0",
      };
    }

    if (!agentData.exists) {
      const result = this.notFoundResult(address);
      this.setCacheEntry(address, result);
      return result;
    }

    let reputationData: {
      score: number | null;
    };

    try {
      reputationData = await this.queryReputation(agentData.agentId);
    } catch {
      reputationData = {
        score: null,
      };
    }

    const score = reputationData.score ?? agentData.trustScore;

    const successRate =
      agentData.totalTransactions > 0
        ? agentData.successfulTransactions / agentData.totalTransactions
        : 0;

    const partialResult: Partial<AgentTrustResult> = {
      address,
      exists: true,
      score,
      tier: getTierFromScore(score),
      status: agentData.status,
      totalTransactions: agentData.totalTransactions,
      successfulTransactions: agentData.successfulTransactions,
      successRate,
      totalVolume: agentData.totalVolume,
      stake: agentData.stake,
      capabilities: agentData.capabilities,
      registeredAt: agentData.registeredAt,
    };

    const flags = this.generateFlags(partialResult);

    const result: AgentTrustResult = {
      address,
      exists: true,
      score,
      tier: getTierFromScore(score),
      status: agentData.status,
      totalTransactions: agentData.totalTransactions,
      successfulTransactions: agentData.successfulTransactions,
      successRate,
      totalVolume: agentData.totalVolume,
      stake: agentData.stake,
      capabilities: agentData.capabilities,
      registeredAt: agentData.registeredAt,
      flags,
    };

    this.setCacheEntry(address, result);

    return result;
  }

  async lookup(
    address: string
  ): Promise<{ exists: boolean; score: number; tier: TrustTier; status: string }> {
    const result = await this.verify(address);
    return {
      exists: result.exists,
      score: result.score,
      tier: result.tier,
      status: result.status,
    };
  }

  async getHistory(address: string, limit: number = 10): Promise<any[]> {
    if (!isValidStellarAddress(address)) {
      return [];
    }

    try {
      const agent = await this.queryAgentRegistry(address);
      if (!agent.exists) return [];
      const result = await this.queryContract(
        this.config.contractIds.reputation,
        "get_history",
        [
          StellarSdk.nativeToScVal(agent.agentId, { type: "u64" }),
          StellarSdk.nativeToScVal(limit, { type: "u32" }),
        ]
      );

      if (!result) return [];

      const entries = StellarSdk.scValToNative(result);
      return Array.isArray(entries) ? entries : [];
    } catch {
      return [];
    }
  }

  async getAttestations(address: string): Promise<any[]> {
    if (!isValidStellarAddress(address)) {
      return [];
    }

    try {
      const agent = await this.queryAgentRegistry(address);
      if (!agent.exists) return [];
      const result = await this.queryContract(
        this.config.contractIds.registry,
        "get_attestations",
        [
          StellarSdk.nativeToScVal(agent.agentId, { type: "u64" }),
          StellarSdk.nativeToScVal(100, { type: "u32" }),
        ]
      );

      if (!result) return [];

      const entries = StellarSdk.scValToNative(result);
      return Array.isArray(entries) ? entries : [];
    } catch {
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  private generateFlags(result: Partial<AgentTrustResult>): TrustFlag[] {
    const flags: TrustFlag[] = [];

    if (result.score !== undefined && result.score < 2000) {
      flags.push({
        type: "warning",
        code: "LOW_SCORE",
        message: `Trust score ${result.score} is below the "emerging" threshold (2000)`,
      });
    }

    if (result.registeredAt && result.registeredAt > 0) {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const registeredAtMs =
        result.registeredAt < 1e12 ? result.registeredAt * 1000 : result.registeredAt;
      if (Date.now() - registeredAtMs < sevenDaysMs) {
        flags.push({
          type: "info",
          code: "RECENTLY_REGISTERED",
          message: "Agent was registered less than 7 days ago",
        });
      }
    }

    if (result.totalTransactions !== undefined && result.totalTransactions === 0) {
      flags.push({
        type: "warning",
        code: "NO_TRANSACTIONS",
        message: "Agent has no recorded transactions",
      });
    }

    if (
      result.totalTransactions !== undefined &&
      result.successfulTransactions !== undefined &&
      result.totalTransactions > 0
    ) {
      const failureRate =
        (result.totalTransactions - result.successfulTransactions) / result.totalTransactions;
      if (failureRate > 0.2) {
        flags.push({
          type: "danger",
          code: "HIGH_FAILURE_RATE",
          message: `Failure rate ${(failureRate * 100).toFixed(1)}% exceeds 20% threshold`,
        });
      }
    }

    if (result.status === "suspended") {
      flags.push({
        type: "danger",
        code: "SUSPENDED",
        message: "Agent is currently suspended",
      });
    }

    if (result.status === "deregistering") {
      flags.push({
        type: "warning",
        code: "DEREGISTERING",
        message: "Agent is in the process of deregistering",
      });
    }

    if (result.stake !== undefined) {
      const stakeVal = parseInt(result.stake, 10);
      if (!isNaN(stakeVal) && stakeVal > 0 && stakeVal < 100_0000000) {
        flags.push({
          type: "info",
          code: "LOW_STAKE",
          message: "Agent stake is below 100 XLM",
        });
      }
    }

    return flags;
  }

  private async queryAgentRegistry(address: string): Promise<{
    exists: boolean;
    agentId: number;
    status: "active" | "suspended" | "deregistering" | "not_found";
    stake: string;
    capabilities: string[];
    registeredAt: number;
    trustScore: number;
    totalTransactions: number;
    successfulTransactions: number;
    totalVolume: string;
  }> {
    if (!this.config.contractIds.registry) {
      return {
        exists: false,
        agentId: 0,
        status: "not_found",
        stake: "0",
        capabilities: [],
        registeredAt: 0,
        trustScore: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
        totalVolume: "0",
      };
    }

    const result = await this.queryContract(
      this.config.contractIds.registry,
      "get_agent_by_address",
      [StellarSdk.nativeToScVal(address, { type: "address" })]
    );

    if (!result) {
      return {
        exists: false,
        agentId: 0,
        status: "not_found",
        stake: "0",
        capabilities: [],
        registeredAt: 0,
        trustScore: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
        totalVolume: "0",
      };
    }

    const native = StellarSdk.scValToNative(result);

    const statusMap: Record<number, "active" | "suspended" | "deregistering"> = {
      0: "active",
      1: "suspended",
      2: "deregistering",
    };

    const nativeStatus = native.status;
    const statusName = Array.isArray(nativeStatus) ? nativeStatus[0] : nativeStatus;
    const status =
      typeof statusName === "string"
        ? statusName.toLowerCase() === "active"
          ? "active"
          : statusName.toLowerCase() === "suspended"
            ? "suspended"
            : "deregistering"
        : statusMap[Number(statusName)] ?? "active";

    return {
      exists: true,
      agentId: Number(native.id ?? 0),
      status,
      stake: String(native.stake ?? "0"),
      capabilities: Array.isArray(native.capabilities) ? native.capabilities : [],
      registeredAt: Number(native.registered_at ?? 0),
      trustScore: Number(native.trust_score ?? 0),
      totalTransactions: Number(native.total_transactions ?? 0),
      successfulTransactions: Number(native.successful_transactions ?? 0),
      totalVolume: String(native.total_volume ?? "0"),
    };
  }

  private async queryReputation(agentId: number): Promise<{
    score: number | null;
  }> {
    if (!this.config.contractIds.reputation) {
      return {
        score: null,
      };
    }

    const result = await this.queryContract(
      this.config.contractIds.reputation,
      "get_score",
      [StellarSdk.nativeToScVal(agentId, { type: "u64" })]
    );

    if (!result) {
      return {
        score: null,
      };
    }

    const native = StellarSdk.scValToNative(result);

    return {
      score: Number(native.score ?? 0),
    };
  }

  private async queryContract(
    contractId: string,
    method: string,
    args: StellarSdk.xdr.ScVal[]
  ): Promise<StellarSdk.xdr.ScVal | null> {
    const contract = new StellarSdk.Contract(contractId);

    const sourceKeypair = StellarSdk.Keypair.random();
    const sourceAccount = new StellarSdk.Account(sourceKeypair.publicKey(), "0");

    const networkPassphrase =
      this.config.network === "testnet"
        ? StellarSdk.Networks.TESTNET
        : StellarSdk.Networks.PUBLIC;

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100",
      networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const simResponse = await this.rpc.simulateTransaction(tx);

    if (
      StellarSdk.SorobanRpc.Api.isSimulationError(simResponse)
    ) {
      return null;
    }

    const successResponse = simResponse as StellarSdk.SorobanRpc.Api.SimulateTransactionSuccessResponse;

    if (!successResponse.result) {
      return null;
    }

    return successResponse.result.retval;
  }

  private notFoundResult(address: string, extraFlags: TrustFlag[] = []): AgentTrustResult {
    return {
      address,
      exists: false,
      score: 0,
      tier: "unverified",
      status: "not_found",
      totalTransactions: 0,
      successfulTransactions: 0,
      successRate: 0,
      totalVolume: "0",
      stake: "0",
      capabilities: [],
      registeredAt: 0,
      flags: extraFlags,
    };
  }

  private setCacheEntry(address: string, result: AgentTrustResult): void {
    if (this.config.cache.enabled) {
      this.cache.set(address, { result, timestamp: Date.now() });
    }
  }
}
