#![cfg(test)]

use crate::types::{ClaimStatus, ClaimType, OptionalHash, OptionalResolution, Resolution};
use crate::{DisputeHandlerContract, DisputeHandlerContractClient};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, BytesN, Env};

fn setup_env() -> (
    Env,
    DisputeHandlerContractClient<'static>,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DisputeHandlerContract, ());
    let client = DisputeHandlerContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let reputation_contract = Address::generate(&env);
    let stake_contract = Address::generate(&env);
    client.initialize(&admin, &reputation_contract, &stake_contract);
    (env, client, admin, reputation_contract, stake_contract)
}

fn file_test_claim(
    env: &Env,
    client: &DisputeHandlerContractClient,
    claim_type: &ClaimType,
) -> (Address, u64, u64) {
    let claimant = Address::generate(env);
    let agent_id: u64 = 42;
    let tx_hash = BytesN::from_array(env, &[1u8; 32]);
    let evidence_hash = BytesN::from_array(env, &[2u8; 32]);

    let claim_id = client.file_claim(&claimant, &agent_id, &tx_hash, claim_type, &evidence_hash);

    (claimant, agent_id, claim_id)
}

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DisputeHandlerContract, ());
    let client = DisputeHandlerContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let reputation_contract = Address::generate(&env);
    let stake_contract = Address::generate(&env);
    client.initialize(&admin, &reputation_contract, &stake_contract);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_initialize_twice_fails() {
    let (env, client, _admin, _rep, _stake) = setup_env();
    let admin2 = Address::generate(&env);
    let rep2 = Address::generate(&env);
    let stake2 = Address::generate(&env);
    client.initialize(&admin2, &rep2, &stake2);
}

#[test]
fn test_file_claim() {
    let (env, client, _admin, _rep, _stake) = setup_env();
    let (claimant, agent_id, claim_id) = file_test_claim(&env, &client, &ClaimType::NonDelivery);

    assert_eq!(claim_id, 0);

    let claim = client.get_claim(&claim_id);
    assert_eq!(claim.id, 0);
    assert_eq!(claim.claimant, claimant);
    assert_eq!(claim.agent_id, agent_id);
    assert_eq!(claim.claim_type, ClaimType::NonDelivery);
    assert_eq!(claim.status, ClaimStatus::Open);
    assert_eq!(claim.response_hash, OptionalHash::None);
    assert_eq!(claim.resolution, OptionalResolution::None);
}

#[test]
fn test_respond_to_claim() {
    let (env, client, _admin, _rep, _stake) = setup_env();
    let (_claimant, _agent_id, claim_id) = file_test_claim(&env, &client, &ClaimType::PoorQuality);

    let responder = Address::generate(&env);
    let response_hash = BytesN::from_array(&env, &[3u8; 32]);

    client.respond_to_claim(&claim_id, &responder, &response_hash);

    let claim = client.get_claim(&claim_id);
    assert_eq!(claim.status, ClaimStatus::Responded);
    assert_eq!(
        claim.response_hash,
        OptionalHash::Some(BytesN::from_array(&env, &[3u8; 32]))
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_respond_to_already_responded_claim_fails() {
    let (env, client, _admin, _rep, _stake) = setup_env();
    let (_claimant, _agent_id, claim_id) = file_test_claim(&env, &client, &ClaimType::Overcharge);

    let responder = Address::generate(&env);
    let response_hash = BytesN::from_array(&env, &[3u8; 32]);

    client.respond_to_claim(&claim_id, &responder, &response_hash);

    let responder2 = Address::generate(&env);
    let response_hash2 = BytesN::from_array(&env, &[4u8; 32]);
    client.respond_to_claim(&claim_id, &responder2, &response_hash2);
}

#[test]
fn test_resolve_claim_against_agent() {
    let (env, client, admin, _rep, _stake) = setup_env();
    let (_claimant, _agent_id, claim_id) = file_test_claim(&env, &client, &ClaimType::NonDelivery);

    client.resolve_claim(&claim_id, &admin, &Resolution::AgainstAgent);

    let claim = client.get_claim(&claim_id);
    assert_eq!(claim.status, ClaimStatus::Resolved);
    assert_eq!(
        claim.resolution,
        OptionalResolution::Some(Resolution::AgainstAgent)
    );
    match claim.resolved_at {
        crate::types::OptionalTimestamp::Some(_) => {}
        crate::types::OptionalTimestamp::None => panic!("Expected resolved_at to be set"),
    }
}

#[test]
fn test_resolve_claim_for_agent() {
    let (env, client, admin, _rep, _stake) = setup_env();
    let (_claimant, _agent_id, claim_id) = file_test_claim(&env, &client, &ClaimType::PoorQuality);

    client.resolve_claim(&claim_id, &admin, &Resolution::ForAgent);

    let claim = client.get_claim(&claim_id);
    assert_eq!(claim.status, ClaimStatus::Resolved);
    assert_eq!(
        claim.resolution,
        OptionalResolution::Some(Resolution::ForAgent)
    );
}

#[test]
fn test_dismiss_claim() {
    let (env, client, admin, _rep, _stake) = setup_env();
    let (_claimant, _agent_id, claim_id) = file_test_claim(&env, &client, &ClaimType::Other);

    client.resolve_claim(&claim_id, &admin, &Resolution::Dismissed);

    let claim = client.get_claim(&claim_id);
    assert_eq!(claim.status, ClaimStatus::Resolved);
    assert_eq!(
        claim.resolution,
        OptionalResolution::Some(Resolution::Dismissed)
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_resolve_already_resolved_claim_fails() {
    let (env, client, admin, _rep, _stake) = setup_env();
    let (_claimant, _agent_id, claim_id) = file_test_claim(&env, &client, &ClaimType::NonDelivery);

    client.resolve_claim(&claim_id, &admin, &Resolution::ForAgent);
    client.resolve_claim(&claim_id, &admin, &Resolution::AgainstAgent);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_resolve_by_non_admin_fails() {
    let (env, client, _admin, _rep, _stake) = setup_env();
    let (_claimant, _agent_id, claim_id) = file_test_claim(&env, &client, &ClaimType::NonDelivery);

    let non_admin = Address::generate(&env);
    client.resolve_claim(&claim_id, &non_admin, &Resolution::AgainstAgent);
}

#[test]
fn test_get_claims_by_agent() {
    let (env, client, _admin, _rep, _stake) = setup_env();

    let claimant1 = Address::generate(&env);
    let claimant2 = Address::generate(&env);
    let agent_id: u64 = 7;
    let tx_hash1 = BytesN::from_array(&env, &[10u8; 32]);
    let tx_hash2 = BytesN::from_array(&env, &[11u8; 32]);
    let evidence1 = BytesN::from_array(&env, &[20u8; 32]);
    let evidence2 = BytesN::from_array(&env, &[21u8; 32]);

    client.file_claim(
        &claimant1,
        &agent_id,
        &tx_hash1,
        &ClaimType::NonDelivery,
        &evidence1,
    );
    client.file_claim(
        &claimant2,
        &agent_id,
        &tx_hash2,
        &ClaimType::Overcharge,
        &evidence2,
    );

    let claims = client.get_claims(&agent_id);
    assert_eq!(claims.len(), 2);
    assert_eq!(claims.get(0).unwrap().claimant, claimant1);
    assert_eq!(claims.get(1).unwrap().claimant, claimant2);
}

#[test]
fn test_get_claim_by_id() {
    let (env, client, _admin, _rep, _stake) = setup_env();
    let (claimant, agent_id, claim_id) = file_test_claim(&env, &client, &ClaimType::Fraud);

    let claim = client.get_claim(&claim_id);
    assert_eq!(claim.id, claim_id);
    assert_eq!(claim.claimant, claimant);
    assert_eq!(claim.agent_id, agent_id);
    assert_eq!(claim.claim_type, ClaimType::Fraud);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_get_nonexistent_claim_fails() {
    let (_env, client, _admin, _rep, _stake) = setup_env();
    client.get_claim(&999);
}

#[test]
fn test_fraud_claim_resolve_against_agent() {
    let (env, client, admin, _rep, _stake) = setup_env();
    let (_claimant, _agent_id, claim_id) = file_test_claim(&env, &client, &ClaimType::Fraud);

    client.resolve_claim(&claim_id, &admin, &Resolution::AgainstAgent);

    let claim = client.get_claim(&claim_id);
    assert_eq!(claim.status, ClaimStatus::Resolved);
    assert_eq!(claim.claim_type, ClaimType::Fraud);
    assert_eq!(
        claim.resolution,
        OptionalResolution::Some(Resolution::AgainstAgent)
    );
}

#[test]
fn test_get_claims_by_status() {
    let (env, client, admin, _rep, _stake) = setup_env();

    let (_c1, _a1, id1) = file_test_claim(&env, &client, &ClaimType::NonDelivery);
    let (_c2, _a2, id2) = file_test_claim(&env, &client, &ClaimType::PoorQuality);
    let (_c3, _a3, id3) = file_test_claim(&env, &client, &ClaimType::Fraud);

    let open_claims = client.get_claims_by_status(&ClaimStatus::Open);
    assert_eq!(open_claims.len(), 3);

    let responder = Address::generate(&env);
    let response_hash = BytesN::from_array(&env, &[5u8; 32]);
    client.respond_to_claim(&id1, &responder, &response_hash);

    let open_claims = client.get_claims_by_status(&ClaimStatus::Open);
    assert_eq!(open_claims.len(), 2);

    let responded_claims = client.get_claims_by_status(&ClaimStatus::Responded);
    assert_eq!(responded_claims.len(), 1);
    assert_eq!(responded_claims.get(0).unwrap().id, id1);

    client.resolve_claim(&id2, &admin, &Resolution::Dismissed);

    let resolved_claims = client.get_claims_by_status(&ClaimStatus::Resolved);
    assert_eq!(resolved_claims.len(), 1);
    assert_eq!(resolved_claims.get(0).unwrap().id, id2);

    let open_claims = client.get_claims_by_status(&ClaimStatus::Open);
    assert_eq!(open_claims.len(), 1);
    assert_eq!(open_claims.get(0).unwrap().id, id3);
}

#[test]
fn test_respond_then_resolve() {
    let (env, client, admin, _rep, _stake) = setup_env();
    let (_claimant, _agent_id, claim_id) = file_test_claim(&env, &client, &ClaimType::Overcharge);

    let responder = Address::generate(&env);
    let response_hash = BytesN::from_array(&env, &[6u8; 32]);
    client.respond_to_claim(&claim_id, &responder, &response_hash);

    let claim = client.get_claim(&claim_id);
    assert_eq!(claim.status, ClaimStatus::Responded);

    client.resolve_claim(&claim_id, &admin, &Resolution::ForAgent);

    let claim = client.get_claim(&claim_id);
    assert_eq!(claim.status, ClaimStatus::Resolved);
    assert_eq!(
        claim.resolution,
        OptionalResolution::Some(Resolution::ForAgent)
    );
    assert_eq!(
        claim.response_hash,
        OptionalHash::Some(BytesN::from_array(&env, &[6u8; 32]))
    );
}

#[test]
fn test_multiple_claims_different_agents() {
    let (env, client, _admin, _rep, _stake) = setup_env();

    let claimant = Address::generate(&env);
    let agent_a: u64 = 1;
    let agent_b: u64 = 2;
    let tx_hash1 = BytesN::from_array(&env, &[10u8; 32]);
    let tx_hash2 = BytesN::from_array(&env, &[11u8; 32]);
    let evidence = BytesN::from_array(&env, &[20u8; 32]);

    client.file_claim(
        &claimant,
        &agent_a,
        &tx_hash1,
        &ClaimType::NonDelivery,
        &evidence,
    );
    client.file_claim(&claimant, &agent_b, &tx_hash2, &ClaimType::Fraud, &evidence);

    let claims_a = client.get_claims(&agent_a);
    assert_eq!(claims_a.len(), 1);

    let claims_b = client.get_claims(&agent_b);
    assert_eq!(claims_b.len(), 1);
    assert_eq!(claims_b.get(0).unwrap().claim_type, ClaimType::Fraud);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_respond_to_resolved_claim_fails() {
    let (env, client, admin, _rep, _stake) = setup_env();
    let (_claimant, _agent_id, claim_id) = file_test_claim(&env, &client, &ClaimType::NonDelivery);

    client.resolve_claim(&claim_id, &admin, &Resolution::Dismissed);

    let responder = Address::generate(&env);
    let response_hash = BytesN::from_array(&env, &[7u8; 32]);
    client.respond_to_claim(&claim_id, &responder, &response_hash);
}
