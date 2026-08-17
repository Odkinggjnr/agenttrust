const requiredVars = [
  "NEXT_PUBLIC_STELLAR_NETWORK",
  "NEXT_PUBLIC_SOROBAN_RPC_URL",
  "NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT_ID",
  "NEXT_PUBLIC_REPUTATION_ENGINE_CONTRACT_ID",
] as const;

const optionalVars = [
  "NEXT_PUBLIC_STAKE_MANAGER_CONTRACT_ID",
  "NEXT_PUBLIC_DISPUTE_HANDLER_CONTRACT_ID",
  "NEXT_PUBLIC_X402_VERIFIER_CONTRACT_ID",
  "NEXT_PUBLIC_LAUNCHTUBE_URL",
] as const;

export function validateEnv(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of requiredVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  for (const key of optionalVars) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

export function getEnvSummary(): Record<string, "set" | "missing"> {
  const summary: Record<string, "set" | "missing"> = {};
  for (const key of [...requiredVars, ...optionalVars]) {
    summary[key] = process.env[key] ? "set" : "missing";
  }
  return summary;
}
