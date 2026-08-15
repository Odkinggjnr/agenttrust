use soroban_sdk::{contracttype, Address, BytesN, String};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct ReceiptData {
    pub payer: Address,
    pub payee: Address,
    pub amount: i128,
    pub resource: String,
    pub timestamp: u64,
    pub facilitator: Address,
    pub facilitator_sig: BytesN<64>,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct VerifiedReceipt {
    pub id: u64,
    pub agent_id: u64,
    pub receipt_hash: BytesN<32>,
    pub payer: Address,
    pub payee: Address,
    pub amount: i128,
    pub resource: String,
    pub verified_at: u64,
    pub success: bool,
}
