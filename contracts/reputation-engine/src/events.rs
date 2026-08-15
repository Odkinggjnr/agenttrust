use soroban_sdk::{Env, Symbol};

pub fn emit_transaction_recorded(env: &Env, record_id: u64, agent_id: u64, success: bool) {
    env.events().publish(
        (Symbol::new(env, "tx_recorded"),),
        (record_id, agent_id, success),
    );
}

pub fn emit_score_calculated(env: &Env, agent_id: u64, new_score: u32) {
    env.events().publish(
        (Symbol::new(env, "score_calculated"),),
        (agent_id, new_score),
    );
}

pub fn emit_score_decayed(env: &Env, agent_id: u64, old_score: u32, new_score: u32) {
    env.events().publish(
        (Symbol::new(env, "score_decayed"),),
        (agent_id, old_score, new_score),
    );
}

pub fn emit_score_adjusted(env: &Env, agent_id: u64, adjustment: u32, positive: bool) {
    env.events().publish(
        (Symbol::new(env, "score_adjusted"),),
        (agent_id, adjustment, positive),
    );
}
