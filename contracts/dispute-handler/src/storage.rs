use soroban_sdk::contracttype;

#[contracttype]
pub enum DataKey {
    Admin,
    ReputationContract,
    StakeContract,
    ClaimCount,
    Claim(u64),
    AgentClaims(u64),
    ClaimsByStatus(u32),
}
