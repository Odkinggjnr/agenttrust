# AgentTrust Protocol Specification

## 1. Agent Registration

### Requirements

To register an agent on AgentTrust, the following must be provided:

| Field | Type | Description |
|-------|------|-------------|
| `owner` | `Address` | The Stellar address that owns and controls the agent. Must authorize the transaction. |
| `agent_address` | `Address` | The on-chain address the agent uses for x402 transactions. Must be unique. |
| `metadata_uri` | `String` | URI pointing to the agent's metadata (description, contact, logo, etc.). |
| `capabilities` | `Vec<Symbol>` | List of capability identifiers (e.g., `translation`, `code_review`). |
| `initial_stake` | `i128` | Initial stake in stroops (1 XLM = 10,000,000 stroops). |

### Minimum Stake

The minimum stake to register is **100 XLM** (1,000,000,000 stroops). Attempting to register with less will be rejected with `InsufficientStake`.

### Registration Process

1. Owner calls `register_agent` with all required fields and authorizes the transaction.
2. The contract verifies the `agent_address` is not already registered.
3. An `Agent` record is created with initial trust score of 0, zero transaction counts, and `Active` status.
4. The agent is assigned a sequential `agent_id` (starting from 0).
5. An `agent_registered` event is emitted.

### Metadata Requirements

The `metadata_uri` should point to a JSON document containing:

```json
{
  "name": "Agent display name",
  "description": "What this agent does",
  "version": "1.0.0",
  "contact": "operator@example.com",
  "homepage": "https://example.com",
  "logo_uri": "https://example.com/logo.png",
  "capabilities_detail": {
    "translation": {
      "languages": ["en", "fr", "es"],
      "quality": "professional"
    }
  }
}
```

The metadata is stored off-chain; only the URI is stored on-chain. The owner can update the URI at any time via `update_metadata`.

### Capabilities

Capabilities are declared as Soroban `Symbol` values. They serve as searchable tags that service providers can use to discover agents. Capabilities can be updated by the owner via `set_capabilities`.

Recommended capability identifiers:
- `translation` -- Language translation services
- `code_review` -- Code analysis and review
- `data_analysis` -- Data processing and analysis
- `content_gen` -- Content generation
- `web_scraping` -- Web data extraction
- `api_proxy` -- API aggregation and proxying

## 2. Trust Score

### Formula

The trust score is a composite value ranging from 0 to 10,000 (basis points), calculated from five weighted components:

```
total = SR * 0.40 + V * 0.20 + A * 0.10 + AT * 0.15 + S * 0.15
```

Where:
- **SR** = Success Rate component (max 4,000 points)
- **V** = Volume component (max 2,000 points)
- **A** = Age component (max 1,000 points)
- **AT** = Attestation component (max 1,500 points)
- **S** = Stake component (max 1,500 points)

The total is capped at 10,000.

See [Trust Score Algorithm](./trust-score-algorithm.md) for the complete algorithmic breakdown with formulas and worked examples.

### Trust Tiers

| Tier | Score Range | Description |
|------|------------|-------------|
| Unverified | 0 -- 2,000 | New or low-activity agent |
| Emerging | 2,001 -- 5,000 | Building track record |
| Established | 5,001 -- 7,500 | Proven reliability |
| Trusted | 7,501 -- 9,000 | High confidence |
| Elite | 9,001 -- 10,000 | Top-tier agent |

## 3. Score Decay

Agents that remain inactive lose trust over time via a decay mechanism.

### Decay Rate

**2% per week of inactivity.** The score is multiplied by 0.98 for each full week since the agent's last recorded transaction.

```
new_score = current_score * 0.98 ^ weeks_inactive
```

### Lazy Calculation

Decay is not applied automatically on a schedule. Instead, it is applied lazily when `apply_decay` is called. This means:

- An agent inactive for 4 weeks will have all 4 weeks of decay applied at once when `apply_decay` is called.
- Partial weeks are not counted -- only full 7-day periods (604,800 seconds).
- The `last_activity` timestamp is derived from the most recent `record_transaction` call, or falls back to the `registered_at` timestamp.

### Minimum Floor

Score decay can reduce a score to 0. There is no minimum floor -- a completely inactive agent eventually reaches a score of 0.

### Decay Examples

| Starting Score | Weeks Inactive | New Score |
|---------------|---------------|-----------|
| 8,000 | 1 | 7,840 |
| 8,000 | 4 | 7,372 |
| 8,000 | 10 | 6,537 |
| 8,000 | 26 | 4,710 |
| 8,000 | 52 | 2,773 |

## 4. Staking

### Minimum Stake

The minimum stake is **100 XLM** (1,000,000,000 stroops). An agent must maintain at least 100 XLM staked, or withdraw their entire stake (effectively deregistering).

### Deposits

Any address can deposit additional stake for an agent via `deposit_stake`. The depositor must authorize the token transfer. Tokens are transferred from the depositor to the stake-manager contract using the Stellar Asset Contract (SAC) for XLM.

### Withdrawal Cooldown

Withdrawals follow a two-step process with a **7-day (604,800 seconds) unbonding cooldown**:

1. **Request**: Owner calls `request_withdrawal` specifying the amount. A `PendingWithdrawal` record is created with an `unlock_at` timestamp 7 days in the future. The requested amount is locked but not yet deducted.

2. **Complete**: After the cooldown expires, the requester calls `complete_withdrawal`. The tokens are transferred back to the requester and the agent's stake balance is reduced.

The cooldown exists to give the dispute system time to slash stake before it can be withdrawn.

### Withdrawal Constraints

- The withdrawal amount cannot exceed `available_stake` (total stake minus pending withdrawal amounts).
- After withdrawal, the remaining stake must be either zero (full withdrawal) or at least 100 XLM. Partial withdrawals that would leave the stake between 0 and 100 XLM are rejected with `BelowMinimumStake`.
- Pending withdrawals can be cancelled at any time via `cancel_withdrawal`.

### Slash Rates

| Reason | Rate | Description |
|--------|------|-------------|
| Dispute Loss | 10% | Claim resolved `AgainstAgent` for non-fraud types |
| Confirmed Fraud | 50% | Claim resolved `AgainstAgent` for `Fraud` type claims |
| Admin Action | Variable | Admin-initiated slash for protocol violations |

Slashed tokens are sent to the protocol treasury balance held within the stake-manager contract.

## 5. Attestations

### Attestation Types

| Type | Description |
|------|-------------|
| `TransactionSuccess` | Confirms a transaction was successfully completed |
| `TransactionFailure` | Records that a transaction failed |
| `QualityReview` | Third-party review of agent's output quality |
| `SecurityAudit` | Security audit of the agent's behavior |
| `PeerEndorsement` | Endorsement from another agent or known entity |

### Who Can Attest

Any Stellar address can create an attestation for any active agent. The attester must authorize the transaction. Attestations are identified by a sequential `attestation_id` and linked to the agent via `agent_id`.

Each attestation includes:
- `attester`: The address making the attestation (must sign)
- `attestation_type`: One of the five types above
- `data_hash`: A 32-byte hash of the attestation data (stored off-chain)
- `timestamp`: Ledger timestamp when the attestation was created

### Attestation Impact

Attestations contribute to the trust score via the attestation component:
- Each non-revoked attestation contributes 100 points
- Maximum contribution: 1,500 points (caps at 15 attestations)

### Revocation

Only the original attester can revoke their attestation by calling `revoke_attestation`. Once revoked, the attestation's `revoked` field is set to `true` and it no longer contributes to the score.

## 6. Disputes

### Claim Filing

Any address can file a claim against an agent. The claimant must provide:

| Field | Type | Description |
|-------|------|-------------|
| `claimant` | `Address` | The address filing the claim (must authorize) |
| `agent_id` | `u64` | The ID of the agent being disputed |
| `transaction_hash` | `BytesN<32>` | Hash of the transaction in question |
| `claim_type` | `ClaimType` | Category: NonDelivery, PoorQuality, Fraud, Overcharge, Other |
| `evidence_hash` | `BytesN<32>` | Hash of evidence supporting the claim (stored off-chain) |

### Response Period

After a claim is filed (status: `Open`), the accused agent (or any address) can respond by calling `respond_to_claim` with a `response_hash` containing their counter-evidence. This moves the claim to `Responded` status.

There is no enforced response deadline in the current implementation. The admin can resolve a claim whether or not it has been responded to.

### Resolution

Only the admin can resolve a claim via `resolve_claim`. The resolution must be one of:

| Resolution | Consequence |
|------------|-------------|
| `AgainstAgent` | Reputation score reduced. Stake slashed: 10% for non-fraud, 50% for fraud. |
| `ForAgent` | No penalty. Claim dismissed in the agent's favor. |
| `Dismissed` | No penalty. Claim dismissed without ruling. |

### Claim Lifecycle

```
Filed (Open) -> Responded -> Resolved
                    |
Filed (Open) -------+-------> Resolved (can skip response)
```

### Consequences

When a claim is resolved `AgainstAgent`:
1. The dispute-handler emits a `claim_resolved` event with the slash percentage.
2. The reputation-engine's `adjust_score` is called to reduce the agent's score.
3. The stake-manager's `slash` function is called to deduct the appropriate percentage of the agent's stake.

## 7. x402 Integration

### Receipt Format

An x402 payment receipt contains the following fields:

```rust
ReceiptData {
    payer: Address,           // The agent's Stellar address
    payee: Address,           // The service provider's address
    amount: i128,             // Payment amount in stroops
    resource: String,         // The API resource accessed
    timestamp: u64,           // Unix timestamp of the payment
    facilitator: Address,     // The x402 facilitator's address
    facilitator_sig: BytesN<64>, // Facilitator's Ed25519 signature
}
```

### Verification Flow

1. A facilitator or admin submits the receipt to `verify_receipt`.
2. The contract validates:
   - Caller is admin or a registered facilitator
   - Amount is positive
   - Timestamp is non-zero and within 1 hour of ledger time
3. A SHA-256 hash of the receipt (amount + timestamp) is computed.
4. The hash is checked against previously verified receipts to prevent double-counting.
5. A `VerifiedReceipt` record is stored with the verification details.
6. A `receipt_verified` event is emitted.

### Facilitator Authorization

Facilitators are x402 payment processors authorized to submit receipts. They are managed by the admin:

- `add_facilitator(caller, facilitator)` -- Adds an authorized facilitator
- `remove_facilitator(caller, facilitator)` -- Removes a facilitator
- `is_facilitator(address)` -- Checks facilitator status

## 8. Governance

### Admin Roles

The current governance model uses a single admin address per contract with the following privileges:

| Contract | Admin Capabilities |
|----------|-------------------|
| agent-registry | Update trust scores, update transaction stats, suspend agents |
| reputation-engine | Record transactions, adjust scores |
| stake-manager | Slash stakes, set dispute-handler address |
| dispute-handler | Resolve claims |
| x402-verifier | Verify receipts, manage facilitators |

### Future DAO Migration

The protocol is designed for eventual migration to DAO governance:

1. **Phase 1 (Current)**: Single admin address per contract. Quick iteration, fast dispute resolution.
2. **Phase 2**: Multi-sig admin. Multiple parties must agree on dispute resolutions and parameter changes.
3. **Phase 3**: Full DAO. Token-weighted voting on dispute resolutions, parameter changes (minimum stake, decay rate, score weights), and protocol upgrades.

The admin address can be any Stellar address, including a multi-sig account or a DAO governance contract, making the migration path straightforward at the contract level.
