use crate::types::{ClaimType, Resolution};
use soroban_sdk::{Address, Env, Symbol};

pub fn emit_claim_filed(
    env: &Env,
    claim_id: u64,
    claimant: &Address,
    agent_id: u64,
    claim_type: &ClaimType,
) {
    env.events().publish(
        (Symbol::new(env, "claim_filed"),),
        (claim_id, claimant.clone(), agent_id, claim_type.clone()),
    );
}

pub fn emit_claim_responded(env: &Env, claim_id: u64, agent_id: u64) {
    env.events()
        .publish((Symbol::new(env, "claim_responded"),), (claim_id, agent_id));
}

pub fn emit_claim_resolved(
    env: &Env,
    claim_id: u64,
    agent_id: u64,
    resolution: &Resolution,
    slash_percent: u32,
) {
    env.events().publish(
        (Symbol::new(env, "claim_resolved"),),
        (claim_id, agent_id, resolution.clone(), slash_percent),
    );
}
