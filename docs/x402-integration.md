# x402 Integration Guide

## 1. What is x402

x402 is an HTTP-native payment protocol that enables AI agents to pay for API access using the HTTP 402 Payment Required status code. When an agent makes a request to an x402-enabled endpoint, the server responds with a 402 status and payment details. The agent completes the payment (via Stellar in our case), attaches the payment receipt to a retry request, and the server verifies the receipt before serving the response.

This creates a machine-to-machine economy where AI agents autonomously discover, negotiate, and pay for services without human intervention.

## 2. How AgentTrust Fits

x402 solves the payment problem, but not the trust problem. When your service receives a valid x402 payment from an unknown agent, you face questions:

- Is this agent known to deliver on its promises?
- Does it have a history of successful transactions?
- Has it been reported for fraud or poor quality?
- Is it economically committed (staked) to good behavior?

AgentTrust answers these questions by providing a trust layer that service providers query before accepting x402 payments. The flow becomes:

```
Agent sends x402 payment -> Service receives payment
  -> Service queries AgentTrust for agent's trust score
  -> If score >= threshold: accept payment, serve request
  -> If score < threshold: reject with reason
```

After the transaction completes, the receipt is submitted to the x402-verifier contract, which records it on-chain and feeds into the agent's reputation score.

## 3. Receipt Format

An x402 payment receipt submitted to AgentTrust has the following structure:

```json
{
  "payer": "GAGENT...",
  "payee": "GSERVICE...",
  "amount": 10000000,
  "resource": "/api/v1/translate",
  "timestamp": 1723567890,
  "facilitator": "GFACILITATOR...",
  "facilitator_signature": "base64-encoded-ed25519-signature"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `payer` | Stellar Address | The agent's address that made the payment |
| `payee` | Stellar Address | The service provider's address that received payment |
| `amount` | Integer (stroops) | Payment amount in stroops (1 XLM = 10,000,000 stroops) |
| `resource` | String | The API endpoint or resource that was accessed |
| `timestamp` | Unix timestamp | When the payment was made |
| `facilitator` | Stellar Address | The x402 facilitator that processed the payment |
| `facilitator_signature` | 64-byte signature | Ed25519 signature from the facilitator |

## 4. Verification Flow

### Step-by-Step

1. **Receive x402 payment**: Your service receives an HTTP request with an x402 payment receipt in the headers.

2. **Extract agent address**: Parse the `payer` field from the receipt to get the agent's Stellar address.

3. **Query AgentTrust**: Call the AgentTrust SDK's `verify` method with the agent's address. This queries the agent-registry for the agent's data and the reputation-engine for the current score.

4. **Evaluate trust**: The SDK returns an `AgentTrustResult` containing the score, tier, flags, and statistics. Your service checks the score against its configured threshold.

5. **Accept or reject**: If the agent meets your trust requirements, serve the request. If not, respond with a rejection including the reason.

6. **Record transaction**: After serving the request, submit the x402 receipt to the x402-verifier contract (either directly or via the facilitator). This records the successful transaction and feeds into the agent's score.

### Decision Flowchart

```
Receive x402 Payment
        |
        v
Extract Agent Address from Receipt
        |
        v
Call AgentTrust verify(address)
        |
        v
  Score >= Threshold? ----No----> Reject (403 + reason)
        |
       Yes
        |
        v
  Agent Active? ----No----> Reject (403 + suspended)
        |
       Yes
        |
        v
  Any Danger Flags? ----Yes----> Reject or Review
        |
       No
        |
        v
  Serve Request
        |
        v
  Submit Receipt to x402-verifier
```

## 5. SDK Middleware Setup

### Express Middleware

```typescript
import { AgentTrustMiddleware } from "@agent-trust/sdk";

const trustMiddleware = AgentTrustMiddleware.express({
  minScore: 5000,
  minTier: "established",
  requireActive: true,
  extractAddress: (req) => {
    // Extract from x402 payment header
    const receipt = JSON.parse(
      req.headers["x-402-receipt"] || "{}"
    );
    return receipt.payer || null;
  },
  onRejection: (req, res, result) => {
    res.status(403).json({
      error: "Agent trust score too low",
      score: result.score,
      tier: result.tier,
      requiredScore: 5000,
      requiredTier: "established",
      flags: result.flags,
    });
  },
  cache: true,
  cacheTtlMs: 60000, // Cache results for 1 minute
});

// Apply to all x402-gated routes
app.use("/api/v1", trustMiddleware);

// Or apply to specific routes
app.post("/api/v1/translate", trustMiddleware, (req, res) => {
  // Agent is verified, serve the request
  res.json({ translation: "..." });
});
```

### Hono Middleware

```typescript
import { AgentTrustMiddleware } from "@agent-trust/sdk";

const trustMiddleware = AgentTrustMiddleware.hono({
  minScore: 5000,
  minTier: "established",
  requireActive: true,
  extractAddress: (c) => {
    const receipt = JSON.parse(
      c.req.header("x-402-receipt") || "{}"
    );
    return receipt.payer || null;
  },
  onRejection: (c, result) => {
    return c.json(
      {
        error: "Agent trust score too low",
        score: result.score,
        tier: result.tier,
      },
      403
    );
  },
  cache: true,
  cacheTtlMs: 60000,
});

// Apply to route group
app.use("/api/v1/*", trustMiddleware);
```

## 6. Webhook Callbacks

AgentTrust emits Soroban events for all state changes. You can subscribe to these events to get notified when an agent's score changes.

### Relevant Events

| Event | Contract | Trigger |
|-------|----------|---------|
| `score_calculated` | reputation-engine | Score was recalculated |
| `score_decayed` | reputation-engine | Score decreased due to inactivity |
| `score_adjusted` | reputation-engine | Score adjusted (dispute outcome) |
| `agent_suspended` | agent-registry | Agent was suspended by admin |
| `stake_slashed` | stake-manager | Agent's stake was slashed |

### Subscribing to Events

Use the Stellar SDK to subscribe to contract events:

```typescript
import { SorobanRpc } from "@stellar/stellar-sdk";

const server = new SorobanRpc.Server(
  "https://soroban-testnet.stellar.org"
);

// Poll for events (Soroban does not support persistent subscriptions)
async function pollEvents(contractId: string, startLedger: number) {
  const events = await server.getEvents({
    startLedger,
    filters: [
      {
        type: "contract",
        contractIds: [contractId],
        topics: [["AAAADwAAAA9zY29yZV9jYWxjdWxhdGVk"]], // "score_calculated" as SCVal
      },
    ],
  });

  for (const event of events.events) {
    const [agentId, newScore] = event.value;
    console.log(`Agent ${agentId} new score: ${newScore}`);
    // Invalidate cache, update UI, trigger alerts, etc.
  }

  return events.latestLedger;
}
```

## 7. Best Practices

### Cache Verification Results

Trust scores do not change on every transaction. Cache the `AgentTrustResult` for a short TTL (30-60 seconds) to avoid hitting the Soroban RPC on every request.

```typescript
import { AgentTrustClient } from "@agent-trust/sdk";

const client = new AgentTrustClient({
  network: "testnet",
  cache: {
    enabled: true,
    ttlMs: 30000, // 30 seconds
  },
});
```

### Set Appropriate Minimum Scores

Choose your minimum score threshold based on the risk level of your service:

| Risk Level | Recommended Min Score | Min Tier |
|-----------|----------------------|----------|
| Low (public data) | 0 | Unverified |
| Medium (paid APIs) | 2,000 | Emerging |
| High (financial) | 5,000 | Established |
| Critical (execution) | 7,500 | Trusted |

### Handle Edge Cases

1. **Agent not found**: If `verify` returns `exists: false`, decide whether to accept unknown agents. For low-risk endpoints, you might allow them. For high-risk endpoints, reject.

2. **Network errors**: If the Soroban RPC is unavailable, decide on a fallback policy. Options:
   - Reject all requests (strict)
   - Accept with a warning flag (permissive)
   - Use the last cached result if available

3. **Score of zero**: A zero score does not necessarily mean the agent is malicious -- it may simply be new. Check `totalTransactions` and `registeredAt` to distinguish new agents from problematic ones.

4. **Suspended agents**: Always check the `status` field. A suspended agent should be rejected regardless of their historical score.

5. **Decayed scores**: An agent with a decayed score is not necessarily untrustworthy -- they may have been inactive. Check `registeredAt` and historical success rate to contextualize the score.
