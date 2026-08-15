#![cfg(test)]

use crate::types::{AgentStatus, AttestationType};
use crate::{AgentRegistryContract, AgentRegistryContractClient};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{symbol_short, Address, BytesN, Env, String, Symbol, Vec};

fn setup_env() -> (Env, AgentRegistryContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(AgentRegistryContract, ());
    let client = AgentRegistryContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);
    (env, client, admin)
}

fn register_test_agent(env: &Env, client: &AgentRegistryContractClient) -> (Address, Address, u64) {
    let owner = Address::generate(env);
    let agent_address = Address::generate(env);
    let metadata_uri = String::from_str(env, "https://example.com/agent/metadata.json");
    let mut capabilities: Vec<Symbol> = Vec::new(env);
    capabilities.push_back(symbol_short!("payments"));
    capabilities.push_back(symbol_short!("trading"));
    let initial_stake: i128 = 200_0000000; // 200 XLM

    let agent_id = client.register_agent(
        &owner,
        &agent_address,
        &metadata_uri,
        &capabilities,
        &initial_stake,
    );
    (owner, agent_address, agent_id)
}

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(AgentRegistryContract, ());
    let client = AgentRegistryContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_initialize_twice_fails() {
    let (env, client, _admin) = setup_env();
    let admin2 = Address::generate(&env);
    client.initialize(&admin2);
}

#[test]
fn test_register_agent() {
    let (env, client, _admin) = setup_env();
    let (owner, agent_address, agent_id) = register_test_agent(&env, &client);

    assert_eq!(agent_id, 0);

    let agent = client.get_agent(&agent_id);
    assert_eq!(agent.id, 0);
    assert_eq!(agent.owner, owner);
    assert_eq!(agent.agent_address, agent_address);
    assert_eq!(agent.trust_score, 0);
    assert_eq!(agent.total_transactions, 0);
    assert_eq!(agent.successful_transactions, 0);
    assert_eq!(agent.total_volume, 0);
    assert_eq!(agent.stake, 200_0000000);
    assert_eq!(agent.status, AgentStatus::Active);
    assert_eq!(agent.capabilities.len(), 2);
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_register_agent_insufficient_stake() {
    let (env, client, _admin) = setup_env();
    let owner = Address::generate(&env);
    let agent_address = Address::generate(&env);
    let metadata_uri = String::from_str(&env, "https://example.com/agent/metadata.json");
    let capabilities: Vec<Symbol> = Vec::new(&env);
    let initial_stake: i128 = 50_0000000; // 50 XLM, below minimum

    client.register_agent(
        &owner,
        &agent_address,
        &metadata_uri,
        &capabilities,
        &initial_stake,
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_register_agent_duplicate_address() {
    let (env, client, _admin) = setup_env();
    let (_owner, agent_address, _agent_id) = register_test_agent(&env, &client);

    // Try to register again with the same agent_address
    let owner2 = Address::generate(&env);
    let metadata_uri = String::from_str(&env, "https://example.com/agent2/metadata.json");
    let capabilities: Vec<Symbol> = Vec::new(&env);
    let initial_stake: i128 = 200_0000000;

    client.register_agent(
        &owner2,
        &agent_address,
        &metadata_uri,
        &capabilities,
        &initial_stake,
    );
}

#[test]
fn test_update_metadata_owner() {
    let (env, client, _admin) = setup_env();
    let (owner, _agent_address, agent_id) = register_test_agent(&env, &client);

    let new_uri = String::from_str(&env, "https://example.com/agent/metadata_v2.json");
    client.update_metadata(&agent_id, &owner, &new_uri);

    let agent = client.get_agent(&agent_id);
    assert_eq!(agent.metadata_uri, new_uri);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_update_metadata_non_owner_fails() {
    let (env, client, _admin) = setup_env();
    let (_owner, _agent_address, agent_id) = register_test_agent(&env, &client);

    let non_owner = Address::generate(&env);
    let new_uri = String::from_str(&env, "https://example.com/agent/hacked.json");
    client.update_metadata(&agent_id, &non_owner, &new_uri);
}

#[test]
fn test_add_attestation() {
    let (env, client, _admin) = setup_env();
    let (_owner, _agent_address, agent_id) = register_test_agent(&env, &client);

    let attester = Address::generate(&env);
    let data_hash = BytesN::from_array(&env, &[1u8; 32]);

    let attestation_id = client.add_attestation(
        &agent_id,
        &attester,
        &AttestationType::PeerEndorsement,
        &data_hash,
    );
    assert_eq!(attestation_id, 0);
}

#[test]
fn test_revoke_attestation_by_attester() {
    let (env, client, _admin) = setup_env();
    let (_owner, _agent_address, agent_id) = register_test_agent(&env, &client);

    let attester = Address::generate(&env);
    let data_hash = BytesN::from_array(&env, &[2u8; 32]);

    let attestation_id = client.add_attestation(
        &agent_id,
        &attester,
        &AttestationType::SecurityAudit,
        &data_hash,
    );

    client.revoke_attestation(&attestation_id, &attester);
}

#[test]
#[should_panic(expected = "Error(Contract, #9)")]
fn test_revoke_attestation_non_attester_fails() {
    let (env, client, _admin) = setup_env();
    let (_owner, _agent_address, agent_id) = register_test_agent(&env, &client);

    let attester = Address::generate(&env);
    let non_attester = Address::generate(&env);
    let data_hash = BytesN::from_array(&env, &[3u8; 32]);

    let attestation_id = client.add_attestation(
        &agent_id,
        &attester,
        &AttestationType::QualityReview,
        &data_hash,
    );

    client.revoke_attestation(&attestation_id, &non_attester);
}

#[test]
fn test_set_capabilities() {
    let (env, client, _admin) = setup_env();
    let (owner, _agent_address, agent_id) = register_test_agent(&env, &client);

    let mut new_caps: Vec<Symbol> = Vec::new(&env);
    new_caps.push_back(symbol_short!("defi"));
    new_caps.push_back(symbol_short!("nft"));
    new_caps.push_back(symbol_short!("oracle"));

    client.set_capabilities(&agent_id, &owner, &new_caps);

    let agent = client.get_agent(&agent_id);
    assert_eq!(agent.capabilities.len(), 3);
    assert_eq!(agent.capabilities.get(0).unwrap(), symbol_short!("defi"));
}

#[test]
fn test_get_agent_by_address() {
    let (env, client, _admin) = setup_env();
    let (owner, agent_address, agent_id) = register_test_agent(&env, &client);

    let agent = client.get_agent_by_address(&agent_address);
    assert_eq!(agent.id, agent_id);
    assert_eq!(agent.owner, owner);
    assert_eq!(agent.agent_address, agent_address);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_get_agent_not_found() {
    let (_env, client, _admin) = setup_env();
    client.get_agent(&999);
}

#[test]
fn test_deregister_agent() {
    let (env, client, _admin) = setup_env();
    let (owner, _agent_address, agent_id) = register_test_agent(&env, &client);

    client.deregister(&agent_id, &owner);

    let agent = client.get_agent(&agent_id);
    match agent.status {
        AgentStatus::Deregistering(_) => {} // expected
        _ => panic!("Expected Deregistering status"),
    }
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_deregister_agent_non_owner_fails() {
    let (env, client, _admin) = setup_env();
    let (_owner, _agent_address, agent_id) = register_test_agent(&env, &client);

    let non_owner = Address::generate(&env);
    client.deregister(&agent_id, &non_owner);
}

#[test]
fn test_suspend_agent_admin() {
    let (env, client, _admin) = setup_env();
    let (_owner, _agent_address, agent_id) = register_test_agent(&env, &client);

    client.suspend_agent(&agent_id);

    let agent = client.get_agent(&agent_id);
    assert_eq!(agent.status, AgentStatus::Suspended);
}

#[test]
#[should_panic(expected = "Error(Contract, #10)")]
fn test_update_metadata_on_suspended_agent_fails() {
    let (env, client, _admin) = setup_env();
    let (owner, _agent_address, agent_id) = register_test_agent(&env, &client);

    client.suspend_agent(&agent_id);

    let new_uri = String::from_str(&env, "https://example.com/suspended.json");
    client.update_metadata(&agent_id, &owner, &new_uri);
}

#[test]
fn test_update_trust_score() {
    let (env, client, _admin) = setup_env();
    let (_owner, _agent_address, agent_id) = register_test_agent(&env, &client);

    client.update_trust_score(&agent_id, &850);

    let agent = client.get_agent(&agent_id);
    assert_eq!(agent.trust_score, 850);
}

#[test]
fn test_update_transaction_stats() {
    let (env, client, _admin) = setup_env();
    let (_owner, _agent_address, agent_id) = register_test_agent(&env, &client);

    client.update_transaction_stats(&agent_id, &true, &500_0000000);
    client.update_transaction_stats(&agent_id, &true, &300_0000000);
    client.update_transaction_stats(&agent_id, &false, &100_0000000);

    let agent = client.get_agent(&agent_id);
    assert_eq!(agent.total_transactions, 3);
    assert_eq!(agent.successful_transactions, 2);
    assert_eq!(agent.total_volume, 900_0000000);
}

#[test]
fn test_search_agents() {
    let (env, client, _admin) = setup_env();

    // Register first agent with "payments" capability
    let (_owner1, _addr1, agent_id1) = register_test_agent(&env, &client);

    // Register second agent with "defi" capability
    let owner2 = Address::generate(&env);
    let agent_address2 = Address::generate(&env);
    let metadata_uri2 = String::from_str(&env, "https://example.com/agent2/metadata.json");
    let mut caps2: Vec<Symbol> = Vec::new(&env);
    caps2.push_back(symbol_short!("defi"));
    let agent_id2 = client.register_agent(
        &owner2,
        &agent_address2,
        &metadata_uri2,
        &caps2,
        &200_0000000,
    );

    // Set trust scores
    client.update_trust_score(&agent_id1, &500);
    client.update_trust_score(&agent_id2, &700);

    // Search for "payments" capability with min_score 0
    let results = client.search_agents(&symbol_short!("payments"), &0);
    assert_eq!(results.len(), 1);
    assert_eq!(results.get(0).unwrap().id, agent_id1);

    // Search for "defi" capability with min_score 600
    let results = client.search_agents(&symbol_short!("defi"), &600);
    assert_eq!(results.len(), 1);
    assert_eq!(results.get(0).unwrap().id, agent_id2);

    // Search for "defi" with min_score 800 should find nothing
    let results = client.search_agents(&symbol_short!("defi"), &800);
    assert_eq!(results.len(), 0);
}

#[test]
fn test_multiple_agents_registration() {
    let (env, client, _admin) = setup_env();

    let (_owner1, _addr1, id1) = register_test_agent(&env, &client);

    let owner2 = Address::generate(&env);
    let agent_address2 = Address::generate(&env);
    let metadata_uri2 = String::from_str(&env, "https://example.com/agent2.json");
    let capabilities2: Vec<Symbol> = Vec::new(&env);
    let id2 = client.register_agent(
        &owner2,
        &agent_address2,
        &metadata_uri2,
        &capabilities2,
        &100_0000000,
    );

    assert_eq!(id1, 0);
    assert_eq!(id2, 1);

    let agent1 = client.get_agent(&id1);
    let agent2 = client.get_agent(&id2);
    assert_eq!(agent1.id, 0);
    assert_eq!(agent2.id, 1);
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")]
fn test_update_metadata_on_deregistering_agent_fails() {
    let (env, client, _admin) = setup_env();
    let (owner, _agent_address, agent_id) = register_test_agent(&env, &client);

    client.deregister(&agent_id, &owner);

    let new_uri = String::from_str(&env, "https://example.com/deregistering.json");
    client.update_metadata(&agent_id, &owner, &new_uri);
}

#[test]
fn test_multiple_attestations_for_agent() {
    let (env, client, _admin) = setup_env();
    let (_owner, _agent_address, agent_id) = register_test_agent(&env, &client);

    let attester1 = Address::generate(&env);
    let attester2 = Address::generate(&env);
    let hash1 = BytesN::from_array(&env, &[10u8; 32]);
    let hash2 = BytesN::from_array(&env, &[20u8; 32]);
    let hash3 = BytesN::from_array(&env, &[30u8; 32]);

    let att_id1 = client.add_attestation(
        &agent_id,
        &attester1,
        &AttestationType::TransactionSuccess,
        &hash1,
    );
    let att_id2 = client.add_attestation(
        &agent_id,
        &attester2,
        &AttestationType::PeerEndorsement,
        &hash2,
    );
    let att_id3 = client.add_attestation(
        &agent_id,
        &attester1,
        &AttestationType::TransactionFailure,
        &hash3,
    );

    assert_eq!(att_id1, 0);
    assert_eq!(att_id2, 1);
    assert_eq!(att_id3, 2);

    let all = client.get_attestations(&agent_id, &10);
    assert_eq!(all.len(), 3);
    assert_eq!(all.get(0).unwrap().id, att_id1);
    assert_eq!(all.get(2).unwrap().id, att_id3);

    let recent = client.get_attestations(&agent_id, &2);
    assert_eq!(recent.len(), 2);
    assert_eq!(recent.get(0).unwrap().id, att_id2);
    assert_eq!(recent.get(1).unwrap().id, att_id3);
}
