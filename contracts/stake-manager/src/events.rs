use crate::types::SlashReason;
use soroban_sdk::{Env, Symbol};

pub fn emit_stake_deposited(env: &Env, agent_id: u64, amount: i128, new_total: i128) {
    env.events().publish(
        (Symbol::new(env, "stake_deposited"),),
        (agent_id, amount, new_total),
    );
}

pub fn emit_withdrawal_requested(
    env: &Env,
    withdrawal_id: u64,
    agent_id: u64,
    amount: i128,
    unlock_at: u64,
) {
    env.events().publish(
        (Symbol::new(env, "withdrawal_requested"),),
        (withdrawal_id, agent_id, amount, unlock_at),
    );
}

pub fn emit_withdrawal_completed(env: &Env, withdrawal_id: u64, agent_id: u64, amount: i128) {
    env.events().publish(
        (Symbol::new(env, "withdrawal_completed"),),
        (withdrawal_id, agent_id, amount),
    );
}

pub fn emit_withdrawal_cancelled(env: &Env, withdrawal_id: u64, agent_id: u64) {
    env.events().publish(
        (Symbol::new(env, "withdrawal_cancelled"),),
        (withdrawal_id, agent_id),
    );
}

pub fn emit_stake_slashed(env: &Env, agent_id: u64, amount: i128, reason: &SlashReason) {
    env.events().publish(
        (Symbol::new(env, "stake_slashed"),),
        (agent_id, amount, reason.clone()),
    );
}
