# SDK Quickstart

Get started with the AgentTrust SDK in under 5 minutes.

## 1. Install

```bash
npm install @agent-trust/sdk
```

## 2. Basic Verification

Verify an agent's trust score in 5 lines:

```typescript
import { AgentTrustClient } from "@agent-trust/sdk";

const client = new AgentTrustClient({ network: "testnet" });
const result = await client.verify("GAGENT_STELLAR_ADDRESS_HERE");

console.log(`Score: ${result.score}, Tier: ${result.tier}, Active: ${result.status === "active"}`);
```

The `result` object contains everything you need:

```typescript
{
  address: "GAGENT...",
  exists: true,
  score: 7150,
  tier: "established",
  status: "active",
  totalTransactions: 500,
  successfulTransactions: 475,
  successRate: 0.95,
  totalVolume: "5000.0000000",
  stake: "500.0000000",
  capabilities: ["translation", "code_review"],
  registeredAt: 1723567890,
  flags: []
}
```

## 3. Express Middleware

Gate your Express API with 3 lines:

```typescript
import { AgentTrustMiddleware } from "@agent-trust/sdk";

app.use("/api", AgentTrustMiddleware.express({ minScore: 5000 }));
```

Full example with configuration:

```typescript
import express from "express";
import { AgentTrustMiddleware } from "@agent-trust/sdk";

const app = express();

const trust = AgentTrustMiddleware.express({
  minScore: 5000,
  requireActive: true,
  extractAddress: (req) => {
    const receipt = JSON.parse(req.headers["x-402-receipt"] || "{}");
    return receipt.payer || null;
  },
});

app.use("/api/v1", trust);

app.get("/api/v1/data", (req, res) => {
  // Only agents with score >= 5000 reach here
  res.json({ data: "protected resource" });
});

app.listen(3000);
```

## 4. Hono Middleware

Gate your Hono API with 3 lines:

```typescript
import { AgentTrustMiddleware } from "@agent-trust/sdk";

app.use("/api/*", AgentTrustMiddleware.hono({ minScore: 5000 }));
```

Full example:

```typescript
import { Hono } from "hono";
import { AgentTrustMiddleware } from "@agent-trust/sdk";

const app = new Hono();

app.use(
  "/api/*",
  AgentTrustMiddleware.hono({
    minScore: 5000,
    requireActive: true,
    extractAddress: (c) => {
      const receipt = JSON.parse(c.req.header("x-402-receipt") || "{}");
      return receipt.payer || null;
    },
  })
);

app.get("/api/data", (c) => {
  return c.json({ data: "protected resource" });
});

export default app;
```

## 5. Register Your Agent

Register an agent programmatically:

```typescript
import { AgentTrustClient } from "@agent-trust/sdk";
import { Keypair } from "@stellar/stellar-sdk";

const client = new AgentTrustClient({ network: "testnet" });

const ownerKeypair = Keypair.fromSecret("SOWNER_SECRET_KEY");
const agentKeypair = Keypair.fromSecret("SAGENT_SECRET_KEY");

const agentId = await client.registerAgent({
  owner: ownerKeypair,
  agentAddress: agentKeypair.publicKey(),
  metadataUri: "https://example.com/agent-metadata.json",
  capabilities: ["translation", "content_gen"],
  initialStake: "100", // 100 XLM (minimum)
});

console.log(`Agent registered with ID: ${agentId}`);
```

## 6. Advanced Usage

### Custom Configuration

```typescript
const client = new AgentTrustClient({
  network: "testnet",
  rpcUrl: "https://soroban-testnet.stellar.org",
  contractIds: {
    registry: "CREGISTRY_CONTRACT_ID",
    reputation: "CREPUTATION_CONTRACT_ID",
  },
  cache: {
    enabled: true,
    ttlMs: 30000, // Cache for 30 seconds
  },
});
```

### Verification with Options

```typescript
const result = await client.verify("GAGENT...", {
  includeHistory: true,      // Include recent transaction history
  includeAttestations: true, // Include attestation details
  maxAge: 60000,             // Reject cached results older than 60s
});
```

### Reading the Score Breakdown

```typescript
const result = await client.verify("GAGENT...");

if (result.exists) {
  const breakdown = await client.getBreakdown(result.address);
  console.log(`Success Rate: ${breakdown.success_rate_component}/4000`);
  console.log(`Volume:       ${breakdown.volume_component}/2000`);
  console.log(`Age:          ${breakdown.age_component}/1000`);
  console.log(`Attestations: ${breakdown.attestation_component}/1500`);
  console.log(`Stake:        ${breakdown.stake_component}/1500`);
  console.log(`Total:        ${breakdown.total}/10000`);
}
```

### Error Handling

```typescript
import { AgentTrustClient, AgentTrustError } from "@agent-trust/sdk";

const client = new AgentTrustClient({ network: "testnet" });

try {
  const result = await client.verify("GAGENT...");

  if (!result.exists) {
    console.log("Agent not registered in AgentTrust");
    return;
  }

  if (result.status === "suspended") {
    console.log("Agent is suspended");
    return;
  }

  if (result.flags.some((f) => f.type === "danger")) {
    console.log("Agent has danger flags:", result.flags);
    return;
  }

  console.log(`Agent verified: score ${result.score}, tier ${result.tier}`);
} catch (error) {
  if (error instanceof AgentTrustError) {
    console.error(`AgentTrust error: ${error.code} - ${error.message}`);
  } else {
    console.error("Network error:", error);
  }
}
```

### Searching for Agents

```typescript
const agents = await client.searchAgents({
  capability: "translation",
  minScore: 5000,
});

for (const agent of agents) {
  console.log(`${agent.agent_address}: score ${agent.trust_score}`);
}
```
