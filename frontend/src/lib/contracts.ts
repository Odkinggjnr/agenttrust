import { getNetwork, getRpcClient, NETWORKS } from "./stellar";

export const CONTRACT_IDS = {
  agentRegistry: process.env.NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT_ID || "",
  reputationEngine: process.env.NEXT_PUBLIC_REPUTATION_ENGINE_CONTRACT_ID || "",
  stakeManager: process.env.NEXT_PUBLIC_STAKE_MANAGER_CONTRACT_ID || "",
  disputeHandler: process.env.NEXT_PUBLIC_DISPUTE_HANDLER_CONTRACT_ID || "",
  x402Verifier: process.env.NEXT_PUBLIC_X402_VERIFIER_CONTRACT_ID || "",
} as const;

interface ContractClient {
  contractId: string;
  networkPassphrase: string;
  rpcUrl: string;
}

function getContractClient(contractId: string): ContractClient {
  const network = getNetwork();
  const config = NETWORKS[network];
  if (!contractId) {
    throw new Error("Contract ID is not configured. Check your environment variables.");
  }
  return {
    contractId,
    networkPassphrase: config.networkPassphrase,
    rpcUrl: config.rpcUrl,
  };
}

export function getRegistryContract(): ContractClient {
  return getContractClient(CONTRACT_IDS.agentRegistry);
}

export function getReputationContract(): ContractClient {
  return getContractClient(CONTRACT_IDS.reputationEngine);
}

export function getStakeContract(): ContractClient {
  return getContractClient(CONTRACT_IDS.stakeManager);
}

export function getDisputeContract(): ContractClient {
  return getContractClient(CONTRACT_IDS.disputeHandler);
}

export function getVerifierContract(): ContractClient {
  return getContractClient(CONTRACT_IDS.x402Verifier);
}

export async function buildTransaction(
  contract: ContractClient,
  method: string,
  args: unknown[] = []
): Promise<string> {
  const server = getRpcClient();
  const account = await server.getLatestLedger();

  // In production, this would:
  // 1. Create a StellarSdk.Contract instance
  // 2. Build the transaction with the method and args
  // 3. Simulate the transaction
  // 4. Return the prepared transaction XDR
  console.log(`Building transaction for ${contract.contractId}.${method}`, {
    args,
    ledger: account.sequence,
  });

  // Return a placeholder XDR that will be replaced with real implementation
  // when contract clients are generated from the deployed contracts
  const placeholderXdr = Buffer.from(
    JSON.stringify({
      contract: contract.contractId,
      method,
      args,
      network: contract.networkPassphrase,
      timestamp: Date.now(),
    })
  ).toString("base64");

  return placeholderXdr;
}
