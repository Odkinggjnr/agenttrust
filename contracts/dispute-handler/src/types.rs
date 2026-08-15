use soroban_sdk::{contracttype, Address, BytesN};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum ClaimType {
    NonDelivery,
    PoorQuality,
    Fraud,
    Overcharge,
    Other,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum ClaimStatus {
    Open,
    Responded,
    Resolved,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum Resolution {
    AgainstAgent,
    ForAgent,
    Dismissed,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum OptionalHash {
    None,
    Some(BytesN<32>),
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum OptionalResolution {
    None,
    Some(Resolution),
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum OptionalTimestamp {
    None,
    Some(u64),
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Claim {
    pub id: u64,
    pub claimant: Address,
    pub agent_id: u64,
    pub transaction_hash: BytesN<32>,
    pub claim_type: ClaimType,
    pub evidence_hash: BytesN<32>,
    pub response_hash: OptionalHash,
    pub status: ClaimStatus,
    pub resolution: OptionalResolution,
    pub filed_at: u64,
    pub resolved_at: OptionalTimestamp,
}
