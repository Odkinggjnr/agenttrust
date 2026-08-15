use soroban_sdk::{Address, Env, Symbol};

pub fn emit_agent_registered(env: &Env, agent_id: u64, owner: &Address, agent_address: &Address) {
    env.events().publish(
        (Symbol::new(env, "agent_registered"),),
        (agent_id, owner.clone(), agent_address.clone()),
    );
}

pub fn emit_metadata_updated(env: &Env, agent_id: u64) {
    env.events()
        .publish((Symbol::new(env, "metadata_updated"),), agent_id);
}

pub fn emit_attestation_added(env: &Env, attestation_id: u64, agent_id: u64, attester: &Address) {
    env.events().publish(
        (Symbol::new(env, "attestation_added"),),
        (attestation_id, agent_id, attester.clone()),
    );
}

pub fn emit_attestation_revoked(env: &Env, attestation_id: u64) {
    env.events()
        .publish((Symbol::new(env, "attestation_revoked"),), attestation_id);
}

pub fn emit_capabilities_updated(env: &Env, agent_id: u64) {
    env.events()
        .publish((Symbol::new(env, "capabilities_updated"),), agent_id);
}

pub fn emit_agent_suspended(env: &Env, agent_id: u64) {
    env.events()
        .publish((Symbol::new(env, "agent_suspended"),), agent_id);
}

pub fn emit_agent_deregistered(env: &Env, agent_id: u64) {
    env.events()
        .publish((Symbol::new(env, "agent_deregistered"),), agent_id);
}
