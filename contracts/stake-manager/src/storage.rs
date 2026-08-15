use soroban_sdk::contracttype;

#[contracttype]
pub enum DataKey {
    Admin,
    TokenContract,
    DisputeHandler,
    WithdrawalCount,
    AgentStake(u64),
    StakeOwner(u64),
    PendingWithdrawal(u64),
    AgentWithdrawals(u64),
    TreasuryBalance,
}
