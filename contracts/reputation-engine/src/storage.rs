use soroban_sdk::contracttype;

#[contracttype]
pub enum DataKey {
    Admin,
    RegistryContract,
    RecordCount,
    Record(u64),
    AgentRecords(u64),
    AgentScoreData(u64),
    LastActivity(u64),
}
