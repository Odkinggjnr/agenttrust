use soroban_sdk::{Address, BytesN, Env, Symbol};

pub fn emit_receipt_verified(
    env: &Env,
    verification_id: u64,
    agent_id: u64,
    receipt_hash: &BytesN<32>,
    amount: i128,
) {
    env.events().publish(
        (Symbol::new(env, "receipt_verified"),),
        (verification_id, agent_id, receipt_hash.clone(), amount),
    );
}

pub fn emit_facilitator_added(env: &Env, facilitator: &Address) {
    env.events().publish(
        (Symbol::new(env, "facilitator_added"),),
        facilitator.clone(),
    );
}

pub fn emit_facilitator_removed(env: &Env, facilitator: &Address) {
    env.events().publish(
        (Symbol::new(env, "facilitator_removed"),),
        facilitator.clone(),
    );
}
