use soroban_sdk::{contracttype, Address, BytesN, String, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Agent {
    pub id: u64,
    pub owner: Address,
    pub agent_address: Address,
    pub metadata_uri: String,
    pub capabilities: Vec<Symbol>,
    pub trust_score: u32,
    pub total_transactions: u64,
    pub successful_transactions: u64,
    pub total_volume: i128,
    pub registered_at: u64,
    pub stake: i128,
    pub status: AgentStatus,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum AgentStatus {
    Active,
    Suspended,
    Deregistering(u64),
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Attestation {
    pub id: u64,
    pub agent_id: u64,
    pub attester: Address,
    pub attestation_type: AttestationType,
    pub data_hash: BytesN<32>,
    pub timestamp: u64,
    pub revoked: bool,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum AttestationType {
    TransactionSuccess,
    TransactionFailure,
    QualityReview,
    SecurityAudit,
    PeerEndorsement,
}
