use soroban_sdk::{contracttype, Address, BytesN};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct TransactionRecord {
    pub id: u64,
    pub agent_id: u64,
    pub counterparty: Address,
    pub amount: i128,
    pub success: bool,
    pub receipt_hash: BytesN<32>,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct ScoreBreakdown {
    pub success_rate_component: u32,
    pub volume_component: u32,
    pub age_component: u32,
    pub attestation_component: u32,
    pub stake_component: u32,
    pub total: u32,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum TrustTier {
    Unverified,
    Emerging,
    Established,
    Trusted,
    Elite,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct ScoreResult {
    pub score: u32,
    pub tier: TrustTier,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct AgentScoreData {
    pub total_transactions: u64,
    pub successful_transactions: u64,
    pub total_volume: i128,
    pub attestation_count: u32,
    pub stake: i128,
    pub registered_at: u64,
    pub last_transaction_at: u64,
    pub current_score: u32,
}
