#![cfg(test)]

use crate::errors::VerifierError;
use crate::types::ReceiptData;
use crate::{X402VerifierContract, X402VerifierContractClient};

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    xdr::ToXdr,
    Address, BytesN, Env, String,
};

fn setup_env() -> (
    Env,
    X402VerifierContractClient<'static>,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);

    let contract_id = env.register(X402VerifierContract, ());
    let client = X402VerifierContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let reputation = Address::generate(&env);
    let registry = Address::generate(&env);

    (env, client, admin, reputation, registry)
}

fn make_receipt(env: &Env, amount: i128, timestamp: u64) -> ReceiptData {
    ReceiptData {
        payer: Address::generate(env),
        payee: Address::generate(env),
        amount,
        resource: String::from_str(env, "api/v1/data"),
        timestamp,
        facilitator: Address::generate(env),
        facilitator_sig: BytesN::from_array(env, &[0u8; 64]),
    }
}

// ----------------------------------------------------------------
// Initialization
// ----------------------------------------------------------------

#[test]
fn test_initialize() {
    let (_, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);
}

#[test]
fn test_initialize_twice_fails() {
    let (_, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let result = client.try_initialize(&admin, &reputation, &registry);
    assert_eq!(result, Err(Ok(VerifierError::AlreadyInitialized)));
}

// ----------------------------------------------------------------
// Facilitator management
// ----------------------------------------------------------------

#[test]
fn test_add_facilitator() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let facilitator = Address::generate(&env);
    client.add_facilitator(&admin, &facilitator);

    assert!(client.is_facilitator(&facilitator));
}

#[test]
fn test_add_facilitator_non_admin_fails() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let non_admin = Address::generate(&env);
    let facilitator = Address::generate(&env);

    let result = client.try_add_facilitator(&non_admin, &facilitator);
    assert_eq!(result, Err(Ok(VerifierError::NotAuthorized)));
}

#[test]
fn test_add_facilitator_duplicate_fails() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let facilitator = Address::generate(&env);
    client.add_facilitator(&admin, &facilitator);

    let result = client.try_add_facilitator(&admin, &facilitator);
    assert_eq!(result, Err(Ok(VerifierError::FacilitatorAlreadyExists)));
}

#[test]
fn test_remove_facilitator() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let facilitator = Address::generate(&env);
    client.add_facilitator(&admin, &facilitator);
    assert!(client.is_facilitator(&facilitator));

    client.remove_facilitator(&admin, &facilitator);
    assert!(!client.is_facilitator(&facilitator));
}

#[test]
fn test_remove_facilitator_not_found_fails() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let facilitator = Address::generate(&env);
    let result = client.try_remove_facilitator(&admin, &facilitator);
    assert_eq!(result, Err(Ok(VerifierError::FacilitatorNotFound)));
}

#[test]
fn test_is_facilitator_returns_false_for_unknown() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let unknown = Address::generate(&env);
    assert!(!client.is_facilitator(&unknown));
}

// ----------------------------------------------------------------
// Receipt verification
// ----------------------------------------------------------------

#[test]
fn test_verify_receipt_as_admin() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let ts = env.ledger().timestamp();
    let receipt = make_receipt(&env, 1_000_000, ts);

    let vid = client.verify_receipt(&admin, &1u64, &receipt);
    assert_eq!(vid, 0);
}

#[test]
fn test_verify_receipt_as_facilitator() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let facilitator = Address::generate(&env);
    client.add_facilitator(&admin, &facilitator);

    let ts = env.ledger().timestamp();
    let receipt = make_receipt(&env, 500_000, ts);

    let vid = client.verify_receipt(&facilitator, &2u64, &receipt);
    assert_eq!(vid, 0);
}

#[test]
fn test_verify_receipt_unauthorized_fails() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let random = Address::generate(&env);
    let ts = env.ledger().timestamp();
    let receipt = make_receipt(&env, 500_000, ts);

    let result = client.try_verify_receipt(&random, &1u64, &receipt);
    assert_eq!(result, Err(Ok(VerifierError::NotAuthorized)));
}

#[test]
fn test_verify_duplicate_receipt_fails() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let ts = env.ledger().timestamp();
    let receipt = make_receipt(&env, 1_000_000, ts);

    let duplicate = receipt.clone();

    client.verify_receipt(&admin, &1u64, &receipt);
    let result = client.try_verify_receipt(&admin, &1u64, &duplicate);
    assert_eq!(result, Err(Ok(VerifierError::ReceiptAlreadyVerified)));
}

#[test]
fn test_distinct_receipts_with_same_amount_and_timestamp_are_allowed() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let ts = env.ledger().timestamp();
    let first = make_receipt(&env, 1_000_000, ts);
    let second = make_receipt(&env, 1_000_000, ts);

    assert_eq!(client.verify_receipt(&admin, &1u64, &first), 0);
    assert_eq!(client.verify_receipt(&admin, &2u64, &second), 1);
}

#[test]
fn test_verify_receipt_zero_amount_fails() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let ts = env.ledger().timestamp();
    let receipt = make_receipt(&env, 0, ts);

    let result = client.try_verify_receipt(&admin, &1u64, &receipt);
    assert_eq!(result, Err(Ok(VerifierError::InvalidAmount)));
}

#[test]
fn test_verify_receipt_negative_amount_fails() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let ts = env.ledger().timestamp();
    let receipt = make_receipt(&env, -500, ts);

    let result = client.try_verify_receipt(&admin, &1u64, &receipt);
    assert_eq!(result, Err(Ok(VerifierError::InvalidAmount)));
}

#[test]
fn test_verify_receipt_zero_timestamp_fails() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let receipt = make_receipt(&env, 1_000, 0);

    let result = client.try_verify_receipt(&admin, &1u64, &receipt);
    assert_eq!(result, Err(Ok(VerifierError::InvalidTimestamp)));
}

#[test]
fn test_verify_receipt_future_timestamp_fails() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    // Ledger timestamp is 0 in test env by default; a value well above
    // 0 + 3600 should be rejected.
    let receipt = make_receipt(&env, 1_000, 999_999_999);

    let result = client.try_verify_receipt(&admin, &1u64, &receipt);
    assert_eq!(result, Err(Ok(VerifierError::InvalidTimestamp)));
}

// ----------------------------------------------------------------
// Queries
// ----------------------------------------------------------------

#[test]
fn test_get_verified_transactions() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let ts = env.ledger().timestamp();
    let agent_id = 42u64;

    // Verify three receipts for the same agent
    let r1 = make_receipt(&env, 100, ts);
    let r2 = make_receipt(&env, 200, ts + 1);
    let r3 = make_receipt(&env, 300, ts + 2);

    client.verify_receipt(&admin, &agent_id, &r1);
    client.verify_receipt(&admin, &agent_id, &r2);
    client.verify_receipt(&admin, &agent_id, &r3);

    // Fetch all
    let all = client.get_verified_transactions(&agent_id, &10u32);
    assert_eq!(all.len(), 3);
    assert_eq!(all.get(0).unwrap().amount, 100);
    assert_eq!(all.get(1).unwrap().amount, 200);
    assert_eq!(all.get(2).unwrap().amount, 300);

    // Fetch with limit
    let limited = client.get_verified_transactions(&agent_id, &2u32);
    assert_eq!(limited.len(), 2);
}

#[test]
fn test_get_verified_transactions_empty() {
    let (_, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let txs = client.get_verified_transactions(&99u64, &10u32);
    assert_eq!(txs.len(), 0);
}

#[test]
fn test_is_valid_receipt_verified() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let ts = env.ledger().timestamp();
    let receipt = make_receipt(&env, 5_000, ts);

    // Compute the expected hash the same way the contract does
    let expected_hash: BytesN<32> = env.crypto().sha256(&receipt.clone().to_xdr(&env)).into();

    // Before verification
    assert!(!client.is_valid_receipt(&expected_hash));

    // After verification
    client.verify_receipt(&admin, &1u64, &receipt);
    assert!(client.is_valid_receipt(&expected_hash));
}

#[test]
fn test_is_valid_receipt_unknown_hash() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let random_hash = BytesN::from_array(&env, &[42u8; 32]);
    assert!(!client.is_valid_receipt(&random_hash));
}

// ----------------------------------------------------------------
// Sequential verification IDs
// ----------------------------------------------------------------

#[test]
fn test_verification_ids_increment() {
    let (env, client, admin, reputation, registry) = setup_env();
    client.initialize(&admin, &reputation, &registry);

    let ts = env.ledger().timestamp();

    let id0 = client.verify_receipt(&admin, &1u64, &make_receipt(&env, 100, ts));
    let id1 = client.verify_receipt(&admin, &1u64, &make_receipt(&env, 200, ts + 1));
    let id2 = client.verify_receipt(&admin, &2u64, &make_receipt(&env, 300, ts + 2));

    assert_eq!(id0, 0);
    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
}
