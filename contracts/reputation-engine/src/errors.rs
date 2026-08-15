use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq)]
#[repr(u32)]
pub enum ReputationError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    AgentNotFound = 4,
    InvalidAmount = 5,
    InvalidAdjustment = 6,
    RecordNotFound = 7,
}
