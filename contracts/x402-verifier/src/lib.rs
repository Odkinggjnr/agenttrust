#![no_std]

mod errors;
mod events;
mod storage;
mod types;

#[cfg(test)]
mod test;

use errors::VerifierError;
use events::{emit_facilitator_added, emit_facilitator_removed, emit_receipt_verified};
use storage::DataKey;
use types::{ReceiptData, VerifiedReceipt};

use soroban_sdk::{contract, contractimpl, xdr::ToXdr, Address, BytesN, Env, Vec};

#[contract]
pub struct X402VerifierContract;

/// Compute a SHA-256 hash of the complete receipt.
///
/// Hashing only amount and timestamp allows unrelated payments made in the
/// same second for the same amount to collide and be rejected as duplicates.
fn compute_receipt_hash(env: &Env, receipt: &ReceiptData) -> BytesN<32> {
    env.crypto().sha256(&receipt.clone().to_xdr(env)).into()
}

#[contractimpl]
impl X402VerifierContract {
    // ----------------------------------------------------------------
    // Initialization
    // ----------------------------------------------------------------

    /// Initialize the contract with an admin and linked contract addresses.
    pub fn initialize(
        env: Env,
        admin: Address,
        reputation_contract: Address,
        registry_contract: Address,
    ) -> Result<(), VerifierError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(VerifierError::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::ReputationContract, &reputation_contract);
        env.storage()
            .instance()
            .set(&DataKey::RegistryContract, &registry_contract);
        env.storage()
            .instance()
            .set(&DataKey::VerificationCount, &0u64);

        // Initialize empty facilitator list
        let facilitators: Vec<Address> = Vec::new(&env);
        env.storage()
            .instance()
            .set(&DataKey::Facilitators, &facilitators);

        Ok(())
    }

    // ----------------------------------------------------------------
    // Receipt verification
    // ----------------------------------------------------------------

    /// Verify an x402 payment receipt and record it on-chain.
    ///
    /// The caller must be the admin or a registered facilitator. The receipt
    /// is validated for structure (amount > 0, timestamp reasonable), hashed
    /// to prevent double-counting, then stored. A `ReceiptVerified` event is
    /// emitted and the new verification ID is returned.
    pub fn verify_receipt(
        env: Env,
        caller: Address,
        agent_id: u64,
        receipt_data: ReceiptData,
    ) -> Result<u64, VerifierError> {
        Self::require_initialized(&env)?;
        caller.require_auth();

        // Caller must be admin or facilitator
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if caller != admin && !Self::is_facilitator_internal(&env, &caller) {
            return Err(VerifierError::NotAuthorized);
        }

        // Validate receipt structure
        if receipt_data.amount <= 0 {
            return Err(VerifierError::InvalidAmount);
        }

        // Timestamp must be non-zero and not unreasonably far in the future.
        // Allow up to 1 hour (3600 s) of clock drift beyond the current ledger
        // timestamp.
        let ledger_ts = env.ledger().timestamp();
        if receipt_data.timestamp == 0 || receipt_data.timestamp > ledger_ts + 3600 {
            return Err(VerifierError::InvalidTimestamp);
        }

        // Compute hash and check for duplicates
        let receipt_hash = compute_receipt_hash(&env, &receipt_data);

        if env
            .storage()
            .persistent()
            .has(&DataKey::ReceiptExists(receipt_hash.clone()))
        {
            return Err(VerifierError::ReceiptAlreadyVerified);
        }

        // Assign a new verification ID
        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::VerificationCount)
            .unwrap();
        let verification_id = count;

        // Build the verified receipt record
        let verified = VerifiedReceipt {
            id: verification_id,
            agent_id,
            receipt_hash: receipt_hash.clone(),
            payer: receipt_data.payer.clone(),
            payee: receipt_data.payee.clone(),
            amount: receipt_data.amount,
            resource: receipt_data.resource,
            verified_at: ledger_ts,
            success: true,
        };

        // Persist the receipt and mark the hash as seen
        env.storage()
            .persistent()
            .set(&DataKey::VerifiedReceipt(verification_id), &verified);
        env.storage()
            .persistent()
            .set(&DataKey::ReceiptExists(receipt_hash.clone()), &true);

        // Append to the per-agent verification list
        let mut agent_verifications: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentVerifications(agent_id))
            .unwrap_or(Vec::new(&env));
        agent_verifications.push_back(verification_id);
        env.storage()
            .persistent()
            .set(&DataKey::AgentVerifications(agent_id), &agent_verifications);

        // Increment global counter
        env.storage()
            .instance()
            .set(&DataKey::VerificationCount, &(count + 1));

        // Emit event
        emit_receipt_verified(
            &env,
            verification_id,
            agent_id,
            &receipt_hash,
            receipt_data.amount,
        );

        Ok(verification_id)
    }

    // ----------------------------------------------------------------
    // Queries
    // ----------------------------------------------------------------

    /// Return up to `limit` verified receipts for the given agent.
    pub fn get_verified_transactions(
        env: Env,
        agent_id: u64,
        limit: u32,
    ) -> Result<Vec<VerifiedReceipt>, VerifierError> {
        Self::require_initialized(&env)?;

        let ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentVerifications(agent_id))
            .unwrap_or(Vec::new(&env));

        let mut results: Vec<VerifiedReceipt> = Vec::new(&env);
        let total = ids.len();
        let take = if (limit as u32) < total {
            limit as u32
        } else {
            total
        };

        for i in 0..take {
            let vid = ids.get(i).unwrap();
            let receipt: VerifiedReceipt = env
                .storage()
                .persistent()
                .get(&DataKey::VerifiedReceipt(vid))
                .unwrap();
            results.push_back(receipt);
        }

        Ok(results)
    }

    /// Check whether a receipt hash has already been verified.
    pub fn is_valid_receipt(env: Env, receipt_hash: BytesN<32>) -> Result<bool, VerifierError> {
        Self::require_initialized(&env)?;

        Ok(env
            .storage()
            .persistent()
            .has(&DataKey::ReceiptExists(receipt_hash)))
    }

    // ----------------------------------------------------------------
    // Facilitator management
    // ----------------------------------------------------------------

    /// Add an authorized x402 facilitator (admin only).
    pub fn add_facilitator(
        env: Env,
        caller: Address,
        facilitator: Address,
    ) -> Result<(), VerifierError> {
        Self::require_initialized(&env)?;
        caller.require_auth();
        Self::require_admin(&env, &caller)?;

        let mut facilitators: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Facilitators)
            .unwrap();

        // Check for duplicate
        for i in 0..facilitators.len() {
            if facilitators.get(i).unwrap() == facilitator {
                return Err(VerifierError::FacilitatorAlreadyExists);
            }
        }

        facilitators.push_back(facilitator.clone());
        env.storage()
            .instance()
            .set(&DataKey::Facilitators, &facilitators);

        emit_facilitator_added(&env, &facilitator);

        Ok(())
    }

    /// Remove a facilitator (admin only).
    pub fn remove_facilitator(
        env: Env,
        caller: Address,
        facilitator: Address,
    ) -> Result<(), VerifierError> {
        Self::require_initialized(&env)?;
        caller.require_auth();
        Self::require_admin(&env, &caller)?;

        let facilitators: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Facilitators)
            .unwrap();

        let mut found = false;
        let mut new_facilitators: Vec<Address> = Vec::new(&env);

        for i in 0..facilitators.len() {
            let f = facilitators.get(i).unwrap();
            if f == facilitator {
                found = true;
            } else {
                new_facilitators.push_back(f);
            }
        }

        if !found {
            return Err(VerifierError::FacilitatorNotFound);
        }

        env.storage()
            .instance()
            .set(&DataKey::Facilitators, &new_facilitators);

        emit_facilitator_removed(&env, &facilitator);

        Ok(())
    }

    /// Check whether an address is a registered facilitator.
    pub fn is_facilitator(env: Env, address: Address) -> Result<bool, VerifierError> {
        Self::require_initialized(&env)?;
        Ok(Self::is_facilitator_internal(&env, &address))
    }

    // ----------------------------------------------------------------
    // Internal helpers
    // ----------------------------------------------------------------

    fn require_initialized(env: &Env) -> Result<(), VerifierError> {
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(VerifierError::NotInitialized);
        }
        Ok(())
    }

    fn require_admin(env: &Env, caller: &Address) -> Result<(), VerifierError> {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if *caller != admin {
            return Err(VerifierError::NotAuthorized);
        }
        Ok(())
    }

    fn is_facilitator_internal(env: &Env, address: &Address) -> bool {
        let facilitators: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Facilitators)
            .unwrap_or(Vec::new(env));

        for i in 0..facilitators.len() {
            if facilitators.get(i).unwrap() == *address {
                return true;
            }
        }
        false
    }
}
