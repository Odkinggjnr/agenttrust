use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Copy, Debug, PartialEq)]
#[repr(u32)]
pub enum AgentRegistryError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    AgentNotFound = 3,
    NotOwner = 4,
    NotAdmin = 5,
    InsufficientStake = 6,
    AgentAlreadyExists = 7,
    AttestationNotFound = 8,
    NotAttester = 9,
    AgentSuspended = 10,
    AgentDeregistering = 11,
    InvalidMetadataUri = 12,
    InvalidCapabilities = 13,
}
