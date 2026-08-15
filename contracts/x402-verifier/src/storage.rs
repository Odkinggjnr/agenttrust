use soroban_sdk::{contracttype, BytesN};

#[contracttype]
pub enum DataKey {
    Admin,
    ReputationContract,
    RegistryContract,
    VerificationCount,
    VerifiedReceipt(u64),
    ReceiptExists(BytesN<32>),
    AgentVerifications(u64),
    Facilitators,
}
