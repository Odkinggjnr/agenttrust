use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct StakeInfo {
    pub agent_id: u64,
    pub total_stake: i128,
    pub available_stake: i128,
    pub pending_withdrawal_amount: i128,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct PendingWithdrawal {
    pub id: u64,
    pub agent_id: u64,
    pub requester: Address,
    pub amount: i128,
    pub requested_at: u64,
    pub unlock_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum SlashReason {
    DisputeLoss,
    ConfirmedFraud,
    AdminAction,
}
