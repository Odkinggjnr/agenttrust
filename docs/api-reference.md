# API Reference

## Smart Contracts

### agent-registry

#### `initialize`

Initialize the contract with an admin address.

```rust
fn initialize(env: Env, admin: Address) -> Result<(), AgentRegistryError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `admin` | `Address` | The admin address that governs the contract |

**Returns**: `Ok(())` on success.

**Errors**:
- `AlreadyInitialized` (2) -- Contract is already initialized.

**Events**: None.

---

#### `register_agent`

Register a new agent identity on-chain.

```rust
fn register_agent(
    env: Env,
    owner: Address,
    agent_address: Address,
    metadata_uri: String,
    capabilities: Vec<Symbol>,
    initial_stake: i128,
) -> Result<u64, AgentRegistryError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `owner` | `Address` | Owner address (must authorize) |
| `agent_address` | `Address` | On-chain address for the agent (must be unique) |
| `metadata_uri` | `String` | URI pointing to agent metadata JSON |
| `capabilities` | `Vec<Symbol>` | List of capability identifiers |
| `initial_stake` | `i128` | Initial stake amount in stroops (min: 1,000,000,000) |

**Returns**: `Ok(agent_id)` -- The assigned agent ID (sequential, starting from 0).

**Errors**:
- `NotInitialized` (1) -- Contract not initialized.
- `InsufficientStake` (6) -- `initial_stake` < 100 XLM.
- `AgentAlreadyExists` (7) -- `agent_address` is already registered.

**Events**:
- `agent_registered(agent_id, owner, agent_address)`

---

#### `update_metadata`

Update the metadata URI for an agent. Only the owner can call this.

```rust
fn update_metadata(
    env: Env,
    agent_id: u64,
    caller: Address,
    new_metadata_uri: String,
) -> Result<(), AgentRegistryError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |
| `caller` | `Address` | Must be the agent's owner (must authorize) |
| `new_metadata_uri` | `String` | New metadata URI |

**Returns**: `Ok(())`.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (3), `NotOwner` (4), `AgentSuspended` (10), `AgentDeregistering` (11).

**Events**:
- `metadata_updated(agent_id)`

---

#### `add_attestation`

Add a third-party attestation for an agent.

```rust
fn add_attestation(
    env: Env,
    agent_id: u64,
    attester: Address,
    attestation_type: AttestationType,
    data_hash: BytesN<32>,
) -> Result<u64, AgentRegistryError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | Target agent's ID |
| `attester` | `Address` | Address making the attestation (must authorize) |
| `attestation_type` | `AttestationType` | One of: TransactionSuccess, TransactionFailure, QualityReview, SecurityAudit, PeerEndorsement |
| `data_hash` | `BytesN<32>` | SHA-256 hash of attestation data |

**Returns**: `Ok(attestation_id)` -- Sequential attestation ID.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (3), `AgentSuspended` (10), `AgentDeregistering` (11).

**Events**:
- `attestation_added(attestation_id, agent_id, attester)`

---

#### `revoke_attestation`

Revoke an attestation. Only the original attester can revoke.

```rust
fn revoke_attestation(
    env: Env,
    attestation_id: u64,
    caller: Address,
) -> Result<(), AgentRegistryError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `attestation_id` | `u64` | The attestation to revoke |
| `caller` | `Address` | Must be the original attester (must authorize) |

**Returns**: `Ok(())`.

**Errors**:
- `NotInitialized` (1), `AttestationNotFound` (8), `NotAttester` (9).

**Events**:
- `attestation_revoked(attestation_id)`

---

#### `set_capabilities`

Set capabilities for an agent. Only the owner can call this.

```rust
fn set_capabilities(
    env: Env,
    agent_id: u64,
    caller: Address,
    capabilities: Vec<Symbol>,
) -> Result<(), AgentRegistryError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |
| `caller` | `Address` | Must be the agent's owner (must authorize) |
| `capabilities` | `Vec<Symbol>` | New capabilities list |

**Returns**: `Ok(())`.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (3), `NotOwner` (4), `AgentSuspended` (10), `AgentDeregistering` (11).

**Events**:
- `capabilities_updated(agent_id)`

---

#### `get_agent`

Get an agent by its ID.

```rust
fn get_agent(env: Env, agent_id: u64) -> Result<Agent, AgentRegistryError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |

**Returns**: `Ok(Agent)` -- The agent record.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (3).

---

#### `get_agent_by_address`

Get an agent by its on-chain address.

```rust
fn get_agent_by_address(
    env: Env,
    agent_address: Address,
) -> Result<Agent, AgentRegistryError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_address` | `Address` | The agent's on-chain address |

**Returns**: `Ok(Agent)`.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (3).

---

#### `get_attestations`

Get the most recent attestations recorded for an agent.

```rust
fn get_attestations(
    env: Env,
    agent_id: u64,
    limit: u32,
) -> Result<Vec<Attestation>, AgentRegistryError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |
| `limit` | `u32` | Maximum number of attestations to return |

**Returns**: `Ok(Vec<Attestation>)` -- Most recent entries up to `limit`, in chronological order.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (3).

---

#### `search_agents`

Search agents by capability and minimum trust score.

```rust
fn search_agents(
    env: Env,
    capability: Symbol,
    min_score: u32,
) -> Result<Vec<Agent>, AgentRegistryError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `capability` | `Symbol` | Capability to search for |
| `min_score` | `u32` | Minimum trust score (0-10000) |

**Returns**: `Ok(Vec<Agent>)` -- All active agents matching the criteria.

**Errors**:
- `NotInitialized` (1).

---

#### `deregister`

Deregister an agent. Only the owner can call this. Sets status to `Deregistering`.

```rust
fn deregister(
    env: Env,
    agent_id: u64,
    caller: Address,
) -> Result<(), AgentRegistryError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |
| `caller` | `Address` | Must be the agent's owner (must authorize) |

**Returns**: `Ok(())`.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (3), `NotOwner` (4), `AgentSuspended` (10), `AgentDeregistering` (11).

**Events**:
- `agent_deregistered(agent_id)`

---

#### `update_trust_score`

Update the trust score for an agent. Admin only.

```rust
fn update_trust_score(
    env: Env,
    agent_id: u64,
    new_score: u32,
) -> Result<(), AgentRegistryError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |
| `new_score` | `u32` | New trust score (0-10000) |

**Returns**: `Ok(())`.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (3). Requires admin auth.

---

#### `update_transaction_stats`

Update transaction statistics for an agent. Admin only.

```rust
fn update_transaction_stats(
    env: Env,
    agent_id: u64,
    success: bool,
    amount: i128,
) -> Result<(), AgentRegistryError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |
| `success` | `bool` | Whether the transaction was successful |
| `amount` | `i128` | Transaction amount in stroops |

**Returns**: `Ok(())`.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (3). Requires admin auth.

---

#### `suspend_agent`

Suspend an agent. Admin only.

```rust
fn suspend_agent(env: Env, agent_id: u64) -> Result<(), AgentRegistryError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |

**Returns**: `Ok(())`.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (3). Requires admin auth.

**Events**:
- `agent_suspended(agent_id)`

---

### reputation-engine

#### `initialize`

Initialize the contract with an admin and the agent-registry contract address.

```rust
fn initialize(
    env: Env,
    admin: Address,
    registry_contract_id: Address,
) -> Result<(), ReputationError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `admin` | `Address` | Admin address |
| `registry_contract_id` | `Address` | The agent-registry contract address |

**Returns**: `Ok(())`.

**Errors**:
- `AlreadyInitialized` (2).

---

#### `record_transaction`

Record a completed transaction for an agent. Admin only.

```rust
fn record_transaction(
    env: Env,
    caller: Address,
    agent_id: u64,
    counterparty: Address,
    amount: i128,
    success: bool,
    receipt_hash: BytesN<32>,
) -> Result<u64, ReputationError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `caller` | `Address` | Must be admin (must authorize) |
| `agent_id` | `u64` | The agent's ID |
| `counterparty` | `Address` | The other party in the transaction |
| `amount` | `i128` | Transaction amount in stroops (must be >= 0) |
| `success` | `bool` | Whether the transaction was successful |
| `receipt_hash` | `BytesN<32>` | Hash of the x402 receipt |

**Returns**: `Ok(record_id)` -- Sequential record ID.

**Errors**:
- `NotInitialized` (1), `NotAuthorized` (3), `InvalidAmount` (5).

**Events**:
- `tx_recorded(record_id, agent_id, success)`

**Notes**: Maintains up to 1,000 records per agent (oldest are trimmed). Updates the agent's `AgentScoreData` cache and `last_activity` timestamp.

---

#### `calculate_score`

Calculate the trust score for an agent using the weighted formula.

```rust
fn calculate_score(
    env: Env,
    agent_id: u64,
) -> Result<ScoreBreakdown, ReputationError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |

**Returns**: `Ok(ScoreBreakdown)` with fields: `success_rate_component`, `volume_component`, `age_component`, `attestation_component`, `stake_component`, `total`.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (4).

**Events**:
- `score_calculated(agent_id, new_score)`

---

#### `apply_decay`

Apply decay to an agent's score based on inactivity. 2% per week.

```rust
fn apply_decay(
    env: Env,
    agent_id: u64,
) -> Result<ScoreResult, ReputationError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |

**Returns**: `Ok(ScoreResult)` with `score` and `tier`.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (4).

**Events**:
- `score_decayed(agent_id, old_score, new_score)` -- Only emitted if decay was applied.

---

#### `get_score`

Get the current score and tier for an agent.

```rust
fn get_score(
    env: Env,
    agent_id: u64,
) -> Result<ScoreResult, ReputationError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |

**Returns**: `Ok(ScoreResult)` with `score` and `tier`.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (4).

---

#### `get_score_breakdown`

Get the full score breakdown with all components.

```rust
fn get_score_breakdown(
    env: Env,
    agent_id: u64,
) -> Result<ScoreBreakdown, ReputationError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |

**Returns**: `Ok(ScoreBreakdown)`.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (4).

---

#### `get_history`

Get recent transaction history for an agent.

```rust
fn get_history(
    env: Env,
    agent_id: u64,
    limit: u32,
) -> Result<Vec<TransactionRecord>, ReputationError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |
| `limit` | `u32` | Maximum number of records to return |

**Returns**: `Ok(Vec<TransactionRecord>)` -- Most recent records up to `limit`.

**Errors**:
- `NotInitialized` (1).

---

#### `adjust_score`

Adjust an agent's score. Admin only. Used by dispute outcomes.

```rust
fn adjust_score(
    env: Env,
    caller: Address,
    agent_id: u64,
    adjustment: u32,
    positive: bool,
) -> Result<ScoreResult, ReputationError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `caller` | `Address` | Must be admin (must authorize) |
| `agent_id` | `u64` | The agent's ID |
| `adjustment` | `u32` | Points to add or subtract |
| `positive` | `bool` | `true` to add, `false` to subtract |

**Returns**: `Ok(ScoreResult)` with updated `score` and `tier`. Score is capped at 10,000 (positive) or floored at 0 (negative).

**Errors**:
- `NotInitialized` (1), `NotAuthorized` (3), `AgentNotFound` (4), `InvalidAdjustment` (6) if `adjustment == 0`.

**Events**:
- `score_adjusted(agent_id, adjustment, positive)`

---

### stake-manager

#### `initialize`

Initialize the contract with an admin and the XLM token contract address.

```rust
fn initialize(
    env: Env,
    admin: Address,
    token_contract: Address,
) -> Result<(), StakeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `admin` | `Address` | Admin address |
| `token_contract` | `Address` | The XLM Stellar Asset Contract address |

**Returns**: `Ok(())`.

**Errors**:
- `AlreadyInitialized` (2).

---

#### `deposit_stake`

Deposit stake for an agent.

```rust
fn deposit_stake(
    env: Env,
    agent_id: u64,
    depositor: Address,
    amount: i128,
) -> Result<i128, StakeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |
| `depositor` | `Address` | Address depositing tokens (must authorize) |
| `amount` | `i128` | Amount in stroops (must be > 0) |

**Returns**: `Ok(new_total)` -- Updated total stake amount.

**Errors**:
- `NotInitialized` (1), `InvalidAmount` (8).

**Events**:
- `stake_deposited(agent_id, amount, new_total)`

---

#### `request_withdrawal`

Request a withdrawal of staked tokens. Subject to 7-day cooldown.

```rust
fn request_withdrawal(
    env: Env,
    agent_id: u64,
    caller: Address,
    amount: i128,
) -> Result<u64, StakeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |
| `caller` | `Address` | Agent owner (must authorize) |
| `amount` | `i128` | Amount to withdraw in stroops |

**Returns**: `Ok(withdrawal_id)`.

**Errors**:
- `NotInitialized` (1), `InvalidAmount` (8), `AgentNotFound` (9), `InsufficientStake` (4), `BelowMinimumStake` (5).

**Events**:
- `withdrawal_requested(withdrawal_id, agent_id, amount, unlock_at)`

---

#### `complete_withdrawal`

Complete a withdrawal after the cooldown period.

```rust
fn complete_withdrawal(
    env: Env,
    withdrawal_id: u64,
    caller: Address,
) -> Result<(), StakeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `withdrawal_id` | `u64` | The withdrawal to complete |
| `caller` | `Address` | Must be original requester (must authorize) |

**Returns**: `Ok(())`.

**Errors**:
- `NotInitialized` (1), `WithdrawalNotFound` (6), `NotRequester` (10), `CooldownNotComplete` (7).

**Events**:
- `withdrawal_completed(withdrawal_id, agent_id, amount)`

---

#### `cancel_withdrawal`

Cancel a pending withdrawal.

```rust
fn cancel_withdrawal(
    env: Env,
    withdrawal_id: u64,
    caller: Address,
) -> Result<(), StakeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `withdrawal_id` | `u64` | The withdrawal to cancel |
| `caller` | `Address` | Must be original requester (must authorize) |

**Returns**: `Ok(())`.

**Errors**:
- `NotInitialized` (1), `WithdrawalNotFound` (6), `NotRequester` (10).

**Events**:
- `withdrawal_cancelled(withdrawal_id, agent_id)`

---

#### `slash`

Slash an agent's stake. Admin or dispute-handler only.

```rust
fn slash(
    env: Env,
    agent_id: u64,
    amount: i128,
    reason: SlashReason,
    caller: Address,
) -> Result<(), StakeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |
| `amount` | `i128` | Amount to slash in stroops |
| `reason` | `SlashReason` | DisputeLoss, ConfirmedFraud, or AdminAction |
| `caller` | `Address` | Must be admin or dispute-handler contract |

**Returns**: `Ok(())`. Slash amount is capped at current stake.

**Errors**:
- `NotInitialized` (1), `NotAuthorized` (3), `InvalidAmount` (8), `AgentNotFound` (9).

**Events**:
- `stake_slashed(agent_id, amount, reason)`

---

#### `get_stake`

Get stake information for an agent.

```rust
fn get_stake(env: Env, agent_id: u64) -> Result<StakeInfo, StakeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |

**Returns**: `Ok(StakeInfo)` with `agent_id`, `total_stake`, `available_stake`, `pending_withdrawal_amount`.

**Errors**:
- `NotInitialized` (1), `AgentNotFound` (9).

---

#### `get_pending_withdrawals`

Get all pending withdrawals for an agent.

```rust
fn get_pending_withdrawals(
    env: Env,
    agent_id: u64,
) -> Result<Vec<PendingWithdrawal>, StakeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |

**Returns**: `Ok(Vec<PendingWithdrawal>)`.

**Errors**:
- `NotInitialized` (1).

---

#### `set_dispute_handler`

Set the dispute-handler contract address. Admin only.

```rust
fn set_dispute_handler(
    env: Env,
    caller: Address,
    contract_id: Address,
) -> Result<(), StakeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `caller` | `Address` | Must be admin (must authorize) |
| `contract_id` | `Address` | Dispute-handler contract address |

**Returns**: `Ok(())`.

**Errors**:
- `NotInitialized` (1), `NotAuthorized` (3).

---

### dispute-handler

#### `initialize`

Initialize the contract with admin and linked contract addresses.

```rust
fn initialize(
    env: Env,
    admin: Address,
    reputation_contract: Address,
    stake_contract: Address,
) -> Result<(), DisputeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `admin` | `Address` | Admin address |
| `reputation_contract` | `Address` | reputation-engine contract address |
| `stake_contract` | `Address` | stake-manager contract address |

**Returns**: `Ok(())`.

**Errors**:
- `AlreadyInitialized` (2).

---

#### `file_claim`

File a dispute claim against an agent.

```rust
fn file_claim(
    env: Env,
    claimant: Address,
    agent_id: u64,
    transaction_hash: BytesN<32>,
    claim_type: ClaimType,
    evidence_hash: BytesN<32>,
) -> Result<u64, DisputeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `claimant` | `Address` | Address filing the claim (must authorize) |
| `agent_id` | `u64` | Agent being disputed |
| `transaction_hash` | `BytesN<32>` | Hash of the disputed transaction |
| `claim_type` | `ClaimType` | NonDelivery, PoorQuality, Fraud, Overcharge, or Other |
| `evidence_hash` | `BytesN<32>` | Hash of supporting evidence |

**Returns**: `Ok(claim_id)`.

**Errors**:
- `NotInitialized` (1).

**Events**:
- `claim_filed(claim_id, claimant, agent_id, claim_type)`

---

#### `respond_to_claim`

Respond to an open claim.

```rust
fn respond_to_claim(
    env: Env,
    claim_id: u64,
    responder: Address,
    response_hash: BytesN<32>,
) -> Result<(), DisputeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `claim_id` | `u64` | The claim to respond to |
| `responder` | `Address` | Address responding (must authorize) |
| `response_hash` | `BytesN<32>` | Hash of response evidence |

**Returns**: `Ok(())`.

**Errors**:
- `NotInitialized` (1), `ClaimNotFound` (4), `ClaimAlreadyResolved` (5), `ClaimNotOpen` (6).

**Events**:
- `claim_responded(claim_id, agent_id)`

---

#### `resolve_claim`

Resolve a dispute claim. Admin only.

```rust
fn resolve_claim(
    env: Env,
    claim_id: u64,
    caller: Address,
    resolution: Resolution,
) -> Result<(), DisputeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `claim_id` | `u64` | The claim to resolve |
| `caller` | `Address` | Must be admin (must authorize) |
| `resolution` | `Resolution` | AgainstAgent, ForAgent, or Dismissed |

**Returns**: `Ok(())`.

**Errors**:
- `NotInitialized` (1), `NotAuthorized` (3), `ClaimNotFound` (4), `ClaimAlreadyResolved` (5).

**Events**:
- `claim_resolved(claim_id, agent_id, resolution, slash_percent)`

---

#### `get_claims`

Get all claims for an agent.

```rust
fn get_claims(env: Env, agent_id: u64) -> Result<Vec<Claim>, DisputeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |

**Returns**: `Ok(Vec<Claim>)`.

**Errors**:
- `NotInitialized` (1).

---

#### `get_claim`

Get a specific claim by ID.

```rust
fn get_claim(env: Env, claim_id: u64) -> Result<Claim, DisputeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `claim_id` | `u64` | The claim ID |

**Returns**: `Ok(Claim)`.

**Errors**:
- `NotInitialized` (1), `ClaimNotFound` (4).

---

#### `get_claims_by_status`

Get all claims with a specific status.

```rust
fn get_claims_by_status(
    env: Env,
    status: ClaimStatus,
) -> Result<Vec<Claim>, DisputeError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | `ClaimStatus` | Open, Responded, or Resolved |

**Returns**: `Ok(Vec<Claim>)`.

**Errors**:
- `NotInitialized` (1).

---

### x402-verifier

#### `initialize`

Initialize the contract with an admin and linked contract addresses.

```rust
fn initialize(
    env: Env,
    admin: Address,
    reputation_contract: Address,
    registry_contract: Address,
) -> Result<(), VerifierError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `admin` | `Address` | Admin address |
| `reputation_contract` | `Address` | reputation-engine contract address |
| `registry_contract` | `Address` | agent-registry contract address |

**Returns**: `Ok(())`.

**Errors**:
- `AlreadyInitialized` (2).

---

#### `verify_receipt`

Verify an x402 payment receipt and record it on-chain.

```rust
fn verify_receipt(
    env: Env,
    caller: Address,
    agent_id: u64,
    receipt_data: ReceiptData,
) -> Result<u64, VerifierError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `caller` | `Address` | Must be admin or facilitator (must authorize) |
| `agent_id` | `u64` | The agent this receipt belongs to |
| `receipt_data` | `ReceiptData` | The receipt data to verify |

**Returns**: `Ok(verification_id)`.

**Errors**:
- `NotInitialized` (1), `NotAuthorized` (3), `InvalidAmount` (6), `InvalidTimestamp` (7), `ReceiptAlreadyVerified` (5).

**Events**:
- `receipt_verified(verification_id, agent_id, receipt_hash, amount)`

---

#### `get_verified_transactions`

Return verified receipts for an agent.

```rust
fn get_verified_transactions(
    env: Env,
    agent_id: u64,
    limit: u32,
) -> Result<Vec<VerifiedReceipt>, VerifierError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | `u64` | The agent's ID |
| `limit` | `u32` | Maximum number of records to return |

**Returns**: `Ok(Vec<VerifiedReceipt>)`.

**Errors**:
- `NotInitialized` (1).

---

#### `is_valid_receipt`

Check whether a receipt hash has been verified.

```rust
fn is_valid_receipt(
    env: Env,
    receipt_hash: BytesN<32>,
) -> Result<bool, VerifierError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `receipt_hash` | `BytesN<32>` | The receipt hash to check |

**Returns**: `Ok(bool)`.

**Errors**:
- `NotInitialized` (1).

---

#### `add_facilitator`

Add an authorized x402 facilitator. Admin only.

```rust
fn add_facilitator(
    env: Env,
    caller: Address,
    facilitator: Address,
) -> Result<(), VerifierError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `caller` | `Address` | Must be admin (must authorize) |
| `facilitator` | `Address` | Facilitator address to add |

**Returns**: `Ok(())`.

**Errors**:
- `NotInitialized` (1), `NotAuthorized` (3), `FacilitatorAlreadyExists` (10).

**Events**:
- `facilitator_added(facilitator)`

---

#### `remove_facilitator`

Remove a facilitator. Admin only.

```rust
fn remove_facilitator(
    env: Env,
    caller: Address,
    facilitator: Address,
) -> Result<(), VerifierError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `caller` | `Address` | Must be admin (must authorize) |
| `facilitator` | `Address` | Facilitator address to remove |

**Returns**: `Ok(())`.

**Errors**:
- `NotInitialized` (1), `NotAuthorized` (3), `FacilitatorNotFound` (11).

**Events**:
- `facilitator_removed(facilitator)`

---

#### `is_facilitator`

Check whether an address is a registered facilitator.

```rust
fn is_facilitator(env: Env, address: Address) -> Result<bool, VerifierError>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | `Address` | Address to check |

**Returns**: `Ok(bool)`.

**Errors**:
- `NotInitialized` (1).

---

## API Routes

The frontend exposes two API routes for external consumption.

### POST /api/verify

Verify an agent's trust score.

**Request**:

```json
{
  "address": "GAGENT_STELLAR_ADDRESS"
}
```

**Response (200)**:

```json
{
  "address": "GAGENT...",
  "exists": true,
  "score": 7150,
  "tier": "established",
  "status": "active",
  "totalTransactions": 500,
  "successfulTransactions": 475,
  "successRate": 0.95,
  "totalVolume": "5000.0000000",
  "stake": "500.0000000",
  "capabilities": ["translation", "code_review"],
  "registeredAt": 1723567890,
  "flags": []
}
```

**Response (404)**:

```json
{
  "address": "GAGENT...",
  "exists": false,
  "error": "Agent not found"
}
```

### GET /api/lookup

Look up an agent by address.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | `string` | Yes | Stellar address to look up |

**Response (200)**:

```json
{
  "agent": {
    "id": 42,
    "owner": "GOWNER...",
    "agentAddress": "GAGENT...",
    "metadataUri": "https://example.com/agent.json",
    "capabilities": ["translation"],
    "trustScore": 7150,
    "totalTransactions": 500,
    "successfulTransactions": 475,
    "totalVolume": "5000.0000000",
    "registeredAt": 1723567890,
    "stake": "500.0000000",
    "status": "active"
  },
  "score": {
    "total": 7150,
    "tier": "established",
    "breakdown": {
      "successRate": 3800,
      "volume": 1200,
      "age": 400,
      "attestations": 1000,
      "stake": 750
    }
  }
}
```

**Response (400)**:

```json
{
  "error": "Missing required parameter: address"
}
```
