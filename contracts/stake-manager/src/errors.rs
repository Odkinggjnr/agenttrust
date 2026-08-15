use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Copy, Debug, PartialEq)]
#[repr(u32)]
pub enum StakeError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    InsufficientStake = 4,
    BelowMinimumStake = 5,
    WithdrawalNotFound = 6,
    CooldownNotComplete = 7,
    InvalidAmount = 8,
    AgentNotFound = 9,
    NotRequester = 10,
    NotStakeOwner = 11,
}
