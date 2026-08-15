use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Copy, Debug, PartialEq)]
#[repr(u32)]
pub enum VerifierError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    InvalidReceipt = 4,
    ReceiptAlreadyVerified = 5,
    InvalidAmount = 6,
    InvalidTimestamp = 7,
    NotFacilitator = 8,
    AgentNotFound = 9,
    FacilitatorAlreadyExists = 10,
    FacilitatorNotFound = 11,
}
