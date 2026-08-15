#![no_std]

mod errors;
mod events;
mod storage;
mod types;

#[cfg(test)]
mod test;

use errors::StakeError;
use events::{
    emit_stake_deposited, emit_stake_slashed, emit_withdrawal_cancelled, emit_withdrawal_completed,
    emit_withdrawal_requested,
};
use storage::DataKey;
use types::{PendingWithdrawal, SlashReason, StakeInfo};

use soroban_sdk::{contract, contractimpl, token, Address, Env, Vec};

const MIN_STAKE: i128 = 100_0000000; // 100 XLM in stroops
const COOLDOWN_PERIOD: u64 = 604800; // 7 days in seconds
#[allow(dead_code)]
const SLASH_DISPUTE_LOSS: u32 = 10; // 10% slash for dispute loss
#[allow(dead_code)]
const SLASH_FRAUD: u32 = 50; // 50% slash for confirmed fraud

#[contract]
pub struct StakeManagerContract;

#[contractimpl]
impl StakeManagerContract {
    /// Initialize the contract with an admin and the XLM token contract (SAC) address.
    pub fn initialize(env: Env, admin: Address, token_contract: Address) -> Result<(), StakeError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(StakeError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::TokenContract, &token_contract);
        env.storage()
            .instance()
            .set(&DataKey::WithdrawalCount, &0u64);
        env.storage()
            .persistent()
            .set(&DataKey::TreasuryBalance, &0i128);
        Ok(())
    }

    /// Deposit stake for an agent. The depositor must authorize the transfer.
    pub fn deposit_stake(
        env: Env,
        agent_id: u64,
        depositor: Address,
        amount: i128,
    ) -> Result<i128, StakeError> {
        Self::require_initialized(&env)?;
        depositor.require_auth();

        if amount <= 0 {
            return Err(StakeError::InvalidAmount);
        }

        // The first depositor becomes the stake owner. Keeping a single owner
        // prevents another account from depositing against the same numeric
        // agent ID and later withdrawing funds it did not provide.
        if let Some(owner) = env
            .storage()
            .persistent()
            .get::<DataKey, Address>(&DataKey::StakeOwner(agent_id))
        {
            if owner != depositor {
                return Err(StakeError::NotStakeOwner);
            }
        } else {
            env.storage()
                .persistent()
                .set(&DataKey::StakeOwner(agent_id), &depositor);
        }

        // Transfer tokens from depositor to this contract
        let token_address: Address = Self::get_token_contract(&env)?;
        let token_client = token::TokenClient::new(&env, &token_address);
        let contract_address = env.current_contract_address();
        token_client.transfer(&depositor, &contract_address, &amount);

        // Update agent's stake balance
        let current_stake: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::AgentStake(agent_id))
            .unwrap_or(0);
        let new_total = current_stake + amount;

        env.storage()
            .persistent()
            .set(&DataKey::AgentStake(agent_id), &new_total);

        emit_stake_deposited(&env, agent_id, amount, new_total);

        Ok(new_total)
    }

    /// Request a withdrawal of staked tokens. Subject to a cooldown period.
    /// The caller must be the agent owner.
    /// If withdrawing all stake, the agent is effectively deregistering.
    /// Otherwise, the remaining stake must be >= MIN_STAKE.
    pub fn request_withdrawal(
        env: Env,
        agent_id: u64,
        caller: Address,
        amount: i128,
    ) -> Result<u64, StakeError> {
        Self::require_initialized(&env)?;
        caller.require_auth();

        if amount <= 0 {
            return Err(StakeError::InvalidAmount);
        }

        let current_stake: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::AgentStake(agent_id))
            .ok_or(StakeError::AgentNotFound)?;

        let owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::StakeOwner(agent_id))
            .ok_or(StakeError::AgentNotFound)?;
        if owner != caller {
            return Err(StakeError::NotStakeOwner);
        }

        // Calculate the total pending withdrawal amount for this agent
        let pending_amount = Self::get_pending_amount(&env, agent_id);
        let available = current_stake - pending_amount;

        if amount > available {
            return Err(StakeError::InsufficientStake);
        }

        // Check minimum stake constraint: remaining available after this withdrawal
        let remaining = available - amount;
        if remaining > 0 && remaining < MIN_STAKE {
            // Not withdrawing all, but remaining would be below minimum
            return Err(StakeError::BelowMinimumStake);
        }

        // Generate withdrawal ID
        let withdrawal_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::WithdrawalCount)
            .unwrap();
        let withdrawal_id = withdrawal_count;

        let now = env.ledger().timestamp();
        let unlock_at = now + COOLDOWN_PERIOD;

        let withdrawal = PendingWithdrawal {
            id: withdrawal_id,
            agent_id,
            requester: caller.clone(),
            amount,
            requested_at: now,
            unlock_at,
        };

        // Store the withdrawal
        env.storage()
            .persistent()
            .set(&DataKey::PendingWithdrawal(withdrawal_id), &withdrawal);

        // Add withdrawal ID to agent's withdrawal list
        let mut agent_withdrawals: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentWithdrawals(agent_id))
            .unwrap_or(Vec::new(&env));
        agent_withdrawals.push_back(withdrawal_id);
        env.storage()
            .persistent()
            .set(&DataKey::AgentWithdrawals(agent_id), &agent_withdrawals);

        // Increment withdrawal counter
        env.storage()
            .instance()
            .set(&DataKey::WithdrawalCount, &(withdrawal_count + 1));

        emit_withdrawal_requested(&env, withdrawal_id, agent_id, amount, unlock_at);

        Ok(withdrawal_id)
    }

    /// Complete a withdrawal after the cooldown period has passed.
    pub fn complete_withdrawal(
        env: Env,
        withdrawal_id: u64,
        caller: Address,
    ) -> Result<(), StakeError> {
        Self::require_initialized(&env)?;
        caller.require_auth();

        let withdrawal: PendingWithdrawal = env
            .storage()
            .persistent()
            .get(&DataKey::PendingWithdrawal(withdrawal_id))
            .ok_or(StakeError::WithdrawalNotFound)?;

        // Only the original requester can complete
        if withdrawal.requester != caller {
            return Err(StakeError::NotRequester);
        }

        // Check cooldown
        let now = env.ledger().timestamp();
        if now < withdrawal.unlock_at {
            return Err(StakeError::CooldownNotComplete);
        }

        // Transfer tokens back to caller
        let token_address: Address = Self::get_token_contract(&env)?;
        let token_client = token::TokenClient::new(&env, &token_address);
        let contract_address = env.current_contract_address();
        token_client.transfer(&contract_address, &caller, &withdrawal.amount);

        // Reduce agent's total stake
        let current_stake: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::AgentStake(withdrawal.agent_id))
            .unwrap_or(0);
        let new_stake = current_stake - withdrawal.amount;
        env.storage()
            .persistent()
            .set(&DataKey::AgentStake(withdrawal.agent_id), &new_stake);
        if new_stake == 0 {
            env.storage()
                .persistent()
                .remove(&DataKey::StakeOwner(withdrawal.agent_id));
        }

        // Remove withdrawal from storage
        Self::remove_withdrawal(&env, withdrawal_id, withdrawal.agent_id);

        emit_withdrawal_completed(&env, withdrawal_id, withdrawal.agent_id, withdrawal.amount);

        Ok(())
    }

    /// Cancel a pending withdrawal and restore the stake balance.
    pub fn cancel_withdrawal(
        env: Env,
        withdrawal_id: u64,
        caller: Address,
    ) -> Result<(), StakeError> {
        Self::require_initialized(&env)?;
        caller.require_auth();

        let withdrawal: PendingWithdrawal = env
            .storage()
            .persistent()
            .get(&DataKey::PendingWithdrawal(withdrawal_id))
            .ok_or(StakeError::WithdrawalNotFound)?;

        if withdrawal.requester != caller {
            return Err(StakeError::NotRequester);
        }

        // Remove withdrawal (stake is not reduced since it was only pending)
        Self::remove_withdrawal(&env, withdrawal_id, withdrawal.agent_id);

        emit_withdrawal_cancelled(&env, withdrawal_id, withdrawal.agent_id);

        Ok(())
    }

    /// Slash an agent's stake. Only admin or dispute-handler contract can call.
    /// Slashed tokens are sent to the protocol treasury balance.
    pub fn slash(
        env: Env,
        agent_id: u64,
        amount: i128,
        reason: SlashReason,
        caller: Address,
    ) -> Result<(), StakeError> {
        Self::require_initialized(&env)?;
        caller.require_auth();

        // Verify caller is admin or dispute handler
        let admin: Address = Self::get_admin(&env)?;
        let is_admin = caller == admin;
        let is_dispute_handler = env
            .storage()
            .instance()
            .get::<DataKey, Address>(&DataKey::DisputeHandler)
            .map(|dh| dh == caller)
            .unwrap_or(false);

        if !is_admin && !is_dispute_handler {
            return Err(StakeError::NotAuthorized);
        }

        if amount <= 0 {
            return Err(StakeError::InvalidAmount);
        }

        let current_stake: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::AgentStake(agent_id))
            .ok_or(StakeError::AgentNotFound)?;

        // Slash cannot exceed current stake
        let slash_amount = if amount > current_stake {
            current_stake
        } else {
            amount
        };

        let new_stake = current_stake - slash_amount;
        env.storage()
            .persistent()
            .set(&DataKey::AgentStake(agent_id), &new_stake);

        // Add slashed tokens to treasury
        let treasury: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::TreasuryBalance)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::TreasuryBalance, &(treasury + slash_amount));

        emit_stake_slashed(&env, agent_id, slash_amount, &reason);

        Ok(())
    }

    /// Get stake information for an agent.
    pub fn get_stake(env: Env, agent_id: u64) -> Result<StakeInfo, StakeError> {
        Self::require_initialized(&env)?;

        let total_stake: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::AgentStake(agent_id))
            .ok_or(StakeError::AgentNotFound)?;

        let pending_withdrawal_amount = Self::get_pending_amount(&env, agent_id);
        let available_stake = total_stake - pending_withdrawal_amount;

        Ok(StakeInfo {
            agent_id,
            total_stake,
            available_stake,
            pending_withdrawal_amount,
        })
    }

    /// Get all pending withdrawals for an agent.
    pub fn get_pending_withdrawals(
        env: Env,
        agent_id: u64,
    ) -> Result<Vec<PendingWithdrawal>, StakeError> {
        Self::require_initialized(&env)?;

        let withdrawal_ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentWithdrawals(agent_id))
            .unwrap_or(Vec::new(&env));

        let mut withdrawals: Vec<PendingWithdrawal> = Vec::new(&env);
        for i in 0..withdrawal_ids.len() {
            let wid = withdrawal_ids.get(i).unwrap();
            if let Some(w) = env
                .storage()
                .persistent()
                .get::<DataKey, PendingWithdrawal>(&DataKey::PendingWithdrawal(wid))
            {
                withdrawals.push_back(w);
            }
        }

        Ok(withdrawals)
    }

    /// Set the dispute-handler contract address. Admin only.
    pub fn set_dispute_handler(
        env: Env,
        caller: Address,
        contract_id: Address,
    ) -> Result<(), StakeError> {
        Self::require_initialized(&env)?;
        caller.require_auth();

        let admin: Address = Self::get_admin(&env)?;
        if caller != admin {
            return Err(StakeError::NotAuthorized);
        }

        env.storage()
            .instance()
            .set(&DataKey::DisputeHandler, &contract_id);

        Ok(())
    }

    // ---- Internal helpers ----

    fn require_initialized(env: &Env) -> Result<(), StakeError> {
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(StakeError::NotInitialized);
        }
        Ok(())
    }

    fn get_admin(env: &Env) -> Result<Address, StakeError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(StakeError::NotInitialized)
    }

    fn get_token_contract(env: &Env) -> Result<Address, StakeError> {
        env.storage()
            .instance()
            .get(&DataKey::TokenContract)
            .ok_or(StakeError::NotInitialized)
    }

    /// Calculate total pending withdrawal amount for an agent.
    fn get_pending_amount(env: &Env, agent_id: u64) -> i128 {
        let withdrawal_ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentWithdrawals(agent_id))
            .unwrap_or(Vec::new(env));

        let mut total: i128 = 0;
        for i in 0..withdrawal_ids.len() {
            let wid = withdrawal_ids.get(i).unwrap();
            if let Some(w) = env
                .storage()
                .persistent()
                .get::<DataKey, PendingWithdrawal>(&DataKey::PendingWithdrawal(wid))
            {
                total += w.amount;
            }
        }
        total
    }

    /// Remove a withdrawal from persistent storage and from the agent's withdrawal list.
    fn remove_withdrawal(env: &Env, withdrawal_id: u64, agent_id: u64) {
        env.storage()
            .persistent()
            .remove(&DataKey::PendingWithdrawal(withdrawal_id));

        let withdrawal_ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentWithdrawals(agent_id))
            .unwrap_or(Vec::new(env));

        let mut new_ids: Vec<u64> = Vec::new(env);
        for i in 0..withdrawal_ids.len() {
            let wid = withdrawal_ids.get(i).unwrap();
            if wid != withdrawal_id {
                new_ids.push_back(wid);
            }
        }
        env.storage()
            .persistent()
            .set(&DataKey::AgentWithdrawals(agent_id), &new_ids);
    }
}
