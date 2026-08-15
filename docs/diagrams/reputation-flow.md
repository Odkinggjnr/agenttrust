# Reputation Flow

This diagram shows the complete flow from an x402 transaction to an updated trust tier.

```mermaid
flowchart LR
    A[x402 Transaction] --> B[Receipt Generated]
    B --> C[x402-verifier validates]
    C --> D[reputation-engine records]
    D --> E[Score calculated]
    E --> F[agent-registry updated]
    F --> G[Trust tier assigned]

    style A fill:#2563eb,color:#fff,stroke:#1d4ed8
    style B fill:#7c3aed,color:#fff,stroke:#6d28d9
    style C fill:#db2777,color:#fff,stroke:#be185d
    style D fill:#ea580c,color:#fff,stroke:#c2410c
    style E fill:#d97706,color:#fff,stroke:#b45309
    style F fill:#16a34a,color:#fff,stroke:#15803d
    style G fill:#0891b2,color:#fff,stroke:#0e7490
```

## Detailed Steps

### 1. x402 Transaction

An AI agent sends an HTTP request to a service with an x402 payment. The facilitator processes the Stellar payment and generates a receipt.

### 2. Receipt Generated

The x402 facilitator creates a signed receipt containing:
- Payer (agent address)
- Payee (service address)
- Amount (in stroops)
- Resource accessed
- Timestamp
- Facilitator signature

### 3. x402-verifier validates

The `x402-verifier` contract validates the receipt:
- Checks caller is admin or authorized facilitator
- Validates amount is positive
- Validates timestamp is within acceptable range (ledger time + 1 hour)
- Computes SHA-256 hash of receipt to prevent duplicates
- Stores the `VerifiedReceipt` record

### 4. reputation-engine records

The `reputation-engine` contract records the transaction:
- Creates a `TransactionRecord` with counterparty, amount, success status
- Updates the agent's `AgentScoreData` cache:
  - Increments `total_transactions`
  - Increments `successful_transactions` (if success)
  - Adds amount to `total_volume`
  - Updates `last_transaction_at`
- Maintains a rolling window of up to 1,000 records per agent

### 5. Score calculated

The `calculate_score` function computes the five-component breakdown:
- **Success Rate** (40%): `(successful / total) * 4000`
- **Volume** (20%): `min(2000, log10(volume_xlm + 1) * 400)`
- **Age** (10%): `min(1000, days * 2)`
- **Attestations** (15%): `min(1500, count * 100)`
- **Stake** (15%): `min(1500, (stake_xlm / 100) * 150)`

Total is capped at 10,000.

### 6. agent-registry updated

The admin calls `update_trust_score` and `update_transaction_stats` on the `agent-registry` to propagate the new score and statistics to the agent's canonical record.

### 7. Trust tier assigned

The score is mapped to a tier:
- 0--2,000: Unverified
- 2,001--5,000: Emerging
- 5,001--7,500: Established
- 7,501--9,000: Trusted
- 9,001--10,000: Elite

Service providers use the tier to make access decisions.
