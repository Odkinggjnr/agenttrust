import { AgentTrustClient } from "./client";
import { AgentTrustConfig, AgentTrustResult, VerifyOptions } from "./types";

let defaultClient: AgentTrustClient | null = null;

function getDefaultClient(config?: AgentTrustConfig): AgentTrustClient {
  if (!defaultClient || config) {
    defaultClient = new AgentTrustClient(config ?? { network: "testnet" });
  }
  return defaultClient;
}

export async function verifyAgent(
  address: string,
  options?: VerifyOptions & { config?: AgentTrustConfig }
): Promise<AgentTrustResult> {
  const client = getDefaultClient(options?.config);
  const verifyOptions: VerifyOptions | undefined = options
    ? {
        includeHistory: options.includeHistory,
        includeAttestations: options.includeAttestations,
        maxAge: options.maxAge,
      }
    : undefined;
  return client.verify(address, verifyOptions);
}

export async function isAgentTrusted(
  address: string,
  minScore: number = 5000
): Promise<boolean> {
  const result = await verifyAgent(address);
  return result.exists && result.score >= minScore && result.status === "active";
}
