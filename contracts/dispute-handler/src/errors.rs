use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Copy, Debug, PartialEq)]
#[repr(u32)]
pub enum DisputeError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    ClaimNotFound = 4,
    ClaimAlreadyResolved = 5,
    ClaimNotOpen = 6,
    NotClaimant = 7,
    InvalidEvidence = 8,
    AgentNotFound = 9,
    NotAgentOwner = 10,
}
