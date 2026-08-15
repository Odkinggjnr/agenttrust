#![no_std]

mod errors;
mod events;
mod storage;
mod types;

#[cfg(test)]
mod test;

use errors::ReputationError;
use events::{
    emit_score_adjusted, emit_score_calculated, emit_score_decayed, emit_transaction_recorded,
};
use storage::DataKey;
use types::{AgentScoreData, ScoreBreakdown, ScoreResult, TransactionRecord, TrustTier};

use soroban_sdk::{contract, contractimpl, Address, BytesN, Env, Vec};

const ONE_WEEK: u64 = 604_800;
const MAX_RECORDS_PER_AGENT: u32 = 1_000;

#[contract]
pub struct ReputationEngineContract;

#[contractimpl]
impl ReputationEngineContract {
    /// Initialize the contract with an admin and the agent-registry contract address.
    pub fn initialize(
        env: Env,
        admin: Address,
        registry_contract_id: Address,
    ) -> Result<(), ReputationError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ReputationError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::RegistryContract, &registry_contract_id);
        env.storage().instance().set(&DataKey::RecordCount, &0u64);
        Ok(())
    }

    /// Record a completed transaction for an agent.
    /// Caller must be authorized (admin or x402-verifier).
    pub fn record_transaction(
        env: Env,
        caller: Address,
        agent_id: u64,
        counterparty: Address,
        amount: i128,
        success: bool,
        receipt_hash: BytesN<32>,
    ) -> Result<u64, ReputationError> {
        Self::require_initialized(&env)?;
        caller.require_auth();

        // Verify caller is admin
        let admin: Address = Self::get_admin(&env)?;
        if caller != admin {
            return Err(ReputationError::NotAuthorized);
        }

        if amount < 0 {
            return Err(ReputationError::InvalidAmount);
        }

        let record_count: u64 = env.storage().instance().get(&DataKey::RecordCount).unwrap();
        let record_id = record_count;
        let timestamp = env.ledger().timestamp();

        let record = TransactionRecord {
            id: record_id,
            agent_id,
            counterparty,
            amount,
            success,
            receipt_hash,
            timestamp,
        };

        // Store the record
        env.storage()
            .persistent()
            .set(&DataKey::Record(record_id), &record);

        // Update agent's record list
        let mut agent_records: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentRecords(agent_id))
            .unwrap_or(Vec::new(&env));

        agent_records.push_back(record_id);

        // Trim to last MAX_RECORDS_PER_AGENT records
        if agent_records.len() > MAX_RECORDS_PER_AGENT {
            let excess = agent_records.len() - MAX_RECORDS_PER_AGENT;
            let mut trimmed: Vec<u64> = Vec::new(&env);
            for i in excess..agent_records.len() {
                trimmed.push_back(agent_records.get(i).unwrap());
            }
            agent_records = trimmed;
        }

        env.storage()
            .persistent()
            .set(&DataKey::AgentRecords(agent_id), &agent_records);

        // Update local AgentScoreData cache
        let mut score_data: AgentScoreData = env
            .storage()
            .persistent()
            .get(&DataKey::AgentScoreData(agent_id))
            .unwrap_or(AgentScoreData {
                total_transactions: 0,
                successful_transactions: 0,
                total_volume: 0,
                attestation_count: 0,
                stake: 0,
                registered_at: timestamp,
                last_transaction_at: 0,
                current_score: 0,
            });

        score_data.total_transactions += 1;
        if success {
            score_data.successful_transactions += 1;
        }
        score_data.total_volume += amount;
        score_data.last_transaction_at = timestamp;

        env.storage()
            .persistent()
            .set(&DataKey::AgentScoreData(agent_id), &score_data);

        // Update last activity timestamp
        env.storage()
            .persistent()
            .set(&DataKey::LastActivity(agent_id), &timestamp);

        // Increment record count
        env.storage()
            .instance()
            .set(&DataKey::RecordCount, &(record_count + 1));

        emit_transaction_recorded(&env, record_id, agent_id, success);

        Ok(record_id)
    }

    /// Calculate the trust score for an agent using weighted factors.
    pub fn calculate_score(env: Env, agent_id: u64) -> Result<ScoreBreakdown, ReputationError> {
        Self::require_initialized(&env)?;

        let score_data: AgentScoreData = env
            .storage()
            .persistent()
            .get(&DataKey::AgentScoreData(agent_id))
            .ok_or(ReputationError::AgentNotFound)?;

        let breakdown = Self::compute_breakdown(&env, &score_data);

        // Update the cached score
        let mut updated_data = score_data;
        updated_data.current_score = breakdown.total;
        env.storage()
            .persistent()
            .set(&DataKey::AgentScoreData(agent_id), &updated_data);

        emit_score_calculated(&env, agent_id, breakdown.total);

        Ok(breakdown)
    }

    /// Apply decay to an agent's score based on inactivity.
    /// 2% decay per week of inactivity.
    pub fn apply_decay(env: Env, agent_id: u64) -> Result<ScoreResult, ReputationError> {
        Self::require_initialized(&env)?;

        let mut score_data: AgentScoreData = env
            .storage()
            .persistent()
            .get(&DataKey::AgentScoreData(agent_id))
            .ok_or(ReputationError::AgentNotFound)?;

        let now = env.ledger().timestamp();
        let last_activity: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::LastActivity(agent_id))
            .unwrap_or(score_data.registered_at);

        let old_score = score_data.current_score;

        if now > last_activity {
            let elapsed = now - last_activity;
            let weeks = elapsed / ONE_WEEK;

            if weeks > 0 {
                let mut new_score = score_data.current_score;
                for _ in 0..weeks {
                    new_score = new_score * 98 / 100;
                }
                score_data.current_score = new_score;

                env.storage()
                    .persistent()
                    .set(&DataKey::AgentScoreData(agent_id), &score_data);

                emit_score_decayed(&env, agent_id, old_score, new_score);
            }
        }

        let tier = Self::get_tier(score_data.current_score);
        Ok(ScoreResult {
            score: score_data.current_score,
            tier,
        })
    }

    /// Get the current score and tier for an agent.
    pub fn get_score(env: Env, agent_id: u64) -> Result<ScoreResult, ReputationError> {
        Self::require_initialized(&env)?;

        let score_data: AgentScoreData = env
            .storage()
            .persistent()
            .get(&DataKey::AgentScoreData(agent_id))
            .ok_or(ReputationError::AgentNotFound)?;

        let tier = Self::get_tier(score_data.current_score);
        Ok(ScoreResult {
            score: score_data.current_score,
            tier,
        })
    }

    /// Get the full score breakdown with all components for an agent.
    pub fn get_score_breakdown(env: Env, agent_id: u64) -> Result<ScoreBreakdown, ReputationError> {
        Self::require_initialized(&env)?;

        let score_data: AgentScoreData = env
            .storage()
            .persistent()
            .get(&DataKey::AgentScoreData(agent_id))
            .ok_or(ReputationError::AgentNotFound)?;

        Ok(Self::compute_breakdown(&env, &score_data))
    }

    /// Get recent transaction history for an agent, up to `limit` entries.
    pub fn get_history(
        env: Env,
        agent_id: u64,
        limit: u32,
    ) -> Result<Vec<TransactionRecord>, ReputationError> {
        Self::require_initialized(&env)?;

        let agent_records: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentRecords(agent_id))
            .unwrap_or(Vec::new(&env));

        let mut results: Vec<TransactionRecord> = Vec::new(&env);
        let len = agent_records.len();
        let start = if len > limit { len - limit } else { 0 };

        for i in start..len {
            let record_id = agent_records.get(i).unwrap();
            if let Some(record) = env
                .storage()
                .persistent()
                .get::<DataKey, TransactionRecord>(&DataKey::Record(record_id))
            {
                results.push_back(record);
            }
        }

        Ok(results)
    }

    /// Map a score to a TrustTier.
    pub fn get_tier(score: u32) -> TrustTier {
        if score <= 2000 {
            TrustTier::Unverified
        } else if score <= 5000 {
            TrustTier::Emerging
        } else if score <= 7500 {
            TrustTier::Established
        } else if score <= 9000 {
            TrustTier::Trusted
        } else {
            TrustTier::Elite
        }
    }

    /// Adjust an agent's score. Called by dispute-handler.
    /// If positive is true, adds adjustment to score (capped at 10000).
    /// If positive is false, subtracts adjustment from score (min 0).
    pub fn adjust_score(
        env: Env,
        caller: Address,
        agent_id: u64,
        adjustment: u32,
        positive: bool,
    ) -> Result<ScoreResult, ReputationError> {
        Self::require_initialized(&env)?;
        caller.require_auth();

        let admin: Address = Self::get_admin(&env)?;
        if caller != admin {
            return Err(ReputationError::NotAuthorized);
        }

        if adjustment == 0 {
            return Err(ReputationError::InvalidAdjustment);
        }

        let mut score_data: AgentScoreData = env
            .storage()
            .persistent()
            .get(&DataKey::AgentScoreData(agent_id))
            .ok_or(ReputationError::AgentNotFound)?;

        if positive {
            score_data.current_score = score_data.current_score.saturating_add(adjustment);
            if score_data.current_score > 10_000 {
                score_data.current_score = 10_000;
            }
        } else {
            score_data.current_score = score_data.current_score.saturating_sub(adjustment);
        }

        env.storage()
            .persistent()
            .set(&DataKey::AgentScoreData(agent_id), &score_data);

        emit_score_adjusted(&env, agent_id, adjustment, positive);

        let tier = Self::get_tier(score_data.current_score);
        Ok(ScoreResult {
            score: score_data.current_score,
            tier,
        })
    }

    // ---- Internal helpers ----

    fn require_initialized(env: &Env) -> Result<(), ReputationError> {
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(ReputationError::NotInitialized);
        }
        Ok(())
    }

    fn get_admin(env: &Env) -> Result<Address, ReputationError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ReputationError::NotInitialized)
    }

    /// Integer approximation of log10: counts the number of digits minus 1.
    /// log10(0) = 0, log10(1) = 0, log10(10) = 1, log10(999) = 2, log10(1000) = 3.
    fn integer_log10(mut n: i128) -> u32 {
        if n <= 0 {
            return 0;
        }
        let mut digits: u32 = 0;
        while n >= 10 {
            n /= 10;
            digits += 1;
        }
        digits
    }

    /// Compute the full score breakdown from AgentScoreData.
    fn compute_breakdown(env: &Env, data: &AgentScoreData) -> ScoreBreakdown {
        // Success rate (40% weight): (successful / total) * 4000
        let success_rate_component: u32 = if data.total_transactions == 0 {
            0
        } else {
            let rate = (data.successful_transactions * 4000) / data.total_transactions;
            rate as u32
        };

        // Volume (20% weight): min(2000, log10(volume_in_xlm + 1) * 400)
        // Volume is in stroops (1 XLM = 10^7 stroops), so convert
        let volume_xlm = data.total_volume / 10_000_000;
        let log_val = Self::integer_log10(volume_xlm + 1);
        let volume_component: u32 = {
            let raw = log_val * 400;
            if raw > 2000 {
                2000
            } else {
                raw
            }
        };

        // Age (10% weight): min(1000, days_since_registration * 2)
        let now = env.ledger().timestamp();
        let age_seconds = if now > data.registered_at {
            now - data.registered_at
        } else {
            0
        };
        let days = age_seconds / 86_400;
        let age_component: u32 = {
            let raw = (days as u32) * 2;
            if raw > 1000 {
                1000
            } else {
                raw
            }
        };

        // Attestations (15% weight): min(1500, attestation_count * 100)
        let attestation_component: u32 = {
            let raw = data.attestation_count * 100;
            if raw > 1500 {
                1500
            } else {
                raw
            }
        };

        // Stake (15% weight): min(1500, (stake_xlm / 100) * 150)
        // Stake is in stroops
        let stake_xlm = data.stake / 10_000_000;
        let stake_component: u32 = {
            let raw = (stake_xlm as u32 / 100) * 150;
            if raw > 1500 {
                1500
            } else {
                raw
            }
        };

        // Total capped at 10000
        let mut total = success_rate_component
            + volume_component
            + age_component
            + attestation_component
            + stake_component;
        if total > 10_000 {
            total = 10_000;
        }

        ScoreBreakdown {
            success_rate_component,
            volume_component,
            age_component,
            attestation_component,
            stake_component,
            total,
        }
    }
}
