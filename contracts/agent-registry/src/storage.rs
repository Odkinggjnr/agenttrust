use soroban_sdk::{contracttype, Address};

#[contracttype]
pub enum DataKey {
    Admin,
    AgentCount,
    AttestationCount,
    Agent(u64),
    AgentByAddress(Address),
    Attestation(u64),
    AgentAttestations(u64),
}
