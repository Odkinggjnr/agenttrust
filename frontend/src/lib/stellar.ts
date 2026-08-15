import * as StellarSdk from "@stellar/stellar-sdk";

interface NetworkConfig {
  rpcUrl: string;
  networkPassphrase: string;
  explorerUrl: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: StellarSdk.Networks.TESTNET,
    explorerUrl: "https://stellar.expert/explorer/testnet",
  },
  mainnet: {
    rpcUrl: "https://soroban.stellar.org",
    networkPassphrase: StellarSdk.Networks.PUBLIC,
    explorerUrl: "https://stellar.expert/explorer/public",
  },
};

export function getNetwork(): string {
  const network = process.env.NEXT_PUBLIC_NETWORK || "testnet";
  if (!(network in NETWORKS)) {
    throw new Error(`Unknown network: ${network}. Expected "testnet" or "mainnet".`);
  }
  return network;
}

export function getRpcClient(): StellarSdk.SorobanRpc.Server {
  const network = getNetwork();
  const config = NETWORKS[network];
  return new StellarSdk.SorobanRpc.Server(config.rpcUrl);
}

export function getNetworkPassphrase(): string {
  const network = getNetwork();
  return NETWORKS[network].networkPassphrase;
}
