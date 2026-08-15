use crate::types::TrustTier;
use crate::{ReputationEngineContract, ReputationEngineContractClient};
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{Address, BytesN, Env};

fn setup_env() -> (Env, Address, ReputationEngineContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(ReputationEngineContract, ());
    let client = ReputationEngineContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let registry = Address::generate(&env);

    client.initialize(&admin, &registry);

    (env, admin, client)
}

fn make_receipt_hash(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[0u8; 32])
}

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(ReputationEngineContract, ());
    let client = ReputationEngineContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let registry = Address::generate(&env);

    client.initialize(&admin, &registry);

    // Double init should fail
    let result = client.try_initialize(&admin, &registry);
    assert!(result.is_err());
}

#[test]
fn test_record_successful_transaction() {
    let (env, admin, client) = setup_env();
    let counterparty = Address::generate(&env);
    let receipt_hash = make_receipt_hash(&env);

    let record_id = client.record_transaction(
        &admin,
        &0u64,
        &counterparty,
        &1_000_0000000i128, // 1000 XLM in stroops
        &true,
        &receipt_hash,
    );

    assert_eq!(record_id, 0);

    // Verify the score data was updated
    let score = client.get_score(&0u64);
    assert_eq!(score.score, 0); // Score not yet calculated, stays at initial 0
}

#[test]
fn test_record_failed_transaction() {
    let (env, admin, client) = setup_env();
    let counterparty = Address::generate(&env);
    let receipt_hash = make_receipt_hash(&env);

    let record_id = client.record_transaction(
        &admin,
        &0u64,
        &counterparty,
        &500_0000000i128, // 500 XLM
        &false,
        &receipt_hash,
    );

    assert_eq!(record_id, 0);

    // Record another successful one
    let record_id2 = client.record_transaction(
        &admin,
        &0u64,
        &counterparty,
        &500_0000000i128,
        &true,
        &receipt_hash,
    );

    assert_eq!(record_id2, 1);

    // Calculate score - should show 50% success rate
    let breakdown = client.calculate_score(&0u64);
    // success_rate = (1 * 4000) / 2 = 2000
    assert_eq!(breakdown.success_rate_component, 2000);
}

#[test]
fn test_calculate_score_new_agent() {
    let (env, admin, client) = setup_env();
    let counterparty = Address::generate(&env);
    let receipt_hash = make_receipt_hash(&env);

    // Record a single small transaction
    client.record_transaction(
        &admin,
        &0u64,
        &counterparty,
        &10_0000000i128, // 10 XLM
        &true,
        &receipt_hash,
    );

    let breakdown = client.calculate_score(&0u64);

    // Success rate: 100% -> 4000
    assert_eq!(breakdown.success_rate_component, 4000);

    // Volume: log10(10 + 1) ~ log10(11) = 1 digit => 1 * 400 = 400
    assert_eq!(breakdown.volume_component, 400);

    // Age: 0 days (same timestamp) -> 0
    assert_eq!(breakdown.age_component, 0);

    // Attestations: 0
    assert_eq!(breakdown.attestation_component, 0);

    // Stake: 0
    assert_eq!(breakdown.stake_component, 0);

    // Total = 4000 + 400 = 4400 -> Emerging tier (success rate alone pushes past Unverified)
    assert_eq!(breakdown.total, 4400);

    let score = client.get_score(&0u64);
    assert_eq!(score.tier, TrustTier::Emerging);
}

#[test]
fn test_calculate_score_high_activity_agent() {
    let (env, admin, client) = setup_env();
    let counterparty = Address::generate(&env);
    let receipt_hash = make_receipt_hash(&env);

    // Record many successful transactions with high volume
    for _ in 0..50 {
        client.record_transaction(
            &admin,
            &0u64,
            &counterparty,
            &10_000_0000000i128, // 10,000 XLM each
            &true,
            &receipt_hash,
        );
    }

    // Advance time by 365 days
    env.ledger().with_mut(|li| {
        li.timestamp += 365 * 86_400;
    });

    // Manually set attestation_count and stake on the AgentScoreData
    // by using adjust mechanics: first calculate to get a baseline,
    // then we test the breakdown pieces
    let breakdown = client.calculate_score(&0u64);

    // Success rate: 50/50 = 100% -> 4000
    assert_eq!(breakdown.success_rate_component, 4000);

    // Volume: 50 * 10000 = 500,000 XLM. log10(500001) = 5 -> 5 * 400 = 2000
    assert_eq!(breakdown.volume_component, 2000);

    // Age: 365 days * 2 = 730, capped at 1000 -> 730
    assert_eq!(breakdown.age_component, 730);

    // Total should be reasonably high (success + volume + age)
    assert!(breakdown.total > 5000);
}

#[test]
fn test_apply_decay() {
    let (env, admin, client) = setup_env();
    let counterparty = Address::generate(&env);
    let receipt_hash = make_receipt_hash(&env);

    // Record a transaction to create agent data
    client.record_transaction(
        &admin,
        &0u64,
        &counterparty,
        &1_000_0000000i128,
        &true,
        &receipt_hash,
    );

    // Calculate score first to set current_score
    let breakdown = client.calculate_score(&0u64);
    let initial_score = breakdown.total;

    // Advance time by 4 weeks
    env.ledger().with_mut(|li| {
        li.timestamp += 4 * 604_800;
    });

    // Apply decay
    let result = client.apply_decay(&0u64);

    // Score should have decayed: score * (98/100)^4
    // Each week: score = score * 98 / 100
    let mut expected = initial_score;
    for _ in 0..4 {
        expected = expected * 98 / 100;
    }
    assert_eq!(result.score, expected);
    assert!(result.score < initial_score);
}

#[test]
fn test_get_tier_boundaries() {
    // Unverified: 0-2000
    assert_eq!(ReputationEngineContract::get_tier(0), TrustTier::Unverified);
    assert_eq!(
        ReputationEngineContract::get_tier(2000),
        TrustTier::Unverified
    );

    // Emerging: 2001-5000
    assert_eq!(
        ReputationEngineContract::get_tier(2001),
        TrustTier::Emerging
    );
    assert_eq!(
        ReputationEngineContract::get_tier(5000),
        TrustTier::Emerging
    );

    // Established: 5001-7500
    assert_eq!(
        ReputationEngineContract::get_tier(5001),
        TrustTier::Established
    );
    assert_eq!(
        ReputationEngineContract::get_tier(7500),
        TrustTier::Established
    );

    // Trusted: 7501-9000
    assert_eq!(ReputationEngineContract::get_tier(7501), TrustTier::Trusted);
    assert_eq!(ReputationEngineContract::get_tier(9000), TrustTier::Trusted);

    // Elite: 9001-10000
    assert_eq!(ReputationEngineContract::get_tier(9001), TrustTier::Elite);
    assert_eq!(ReputationEngineContract::get_tier(10000), TrustTier::Elite);
}

#[test]
fn test_get_history_with_limit() {
    let (env, admin, client) = setup_env();
    let counterparty = Address::generate(&env);
    let receipt_hash = make_receipt_hash(&env);

    // Record 5 transactions
    for i in 0..5 {
        client.record_transaction(
            &admin,
            &0u64,
            &counterparty,
            &((i as i128 + 1) * 100_0000000i128),
            &true,
            &receipt_hash,
        );
    }

    // Get last 3
    let history = client.get_history(&0u64, &3u32);
    assert_eq!(history.len(), 3);

    // Should be the last 3 records (ids 2, 3, 4)
    assert_eq!(history.get(0).unwrap().id, 2);
    assert_eq!(history.get(1).unwrap().id, 3);
    assert_eq!(history.get(2).unwrap().id, 4);

    // Get all
    let history_all = client.get_history(&0u64, &10u32);
    assert_eq!(history_all.len(), 5);
}

#[test]
fn test_adjust_score_up() {
    let (env, admin, client) = setup_env();
    let counterparty = Address::generate(&env);
    let receipt_hash = make_receipt_hash(&env);

    // Create agent data
    client.record_transaction(
        &admin,
        &0u64,
        &counterparty,
        &100_0000000i128,
        &true,
        &receipt_hash,
    );
    client.calculate_score(&0u64);

    // Adjust up by 1000
    let result = client.adjust_score(&admin, &0u64, &1000u32, &true);

    let score_after = client.get_score(&0u64);
    assert_eq!(score_after.score, result.score);
    assert!(result.score >= 1000);
}

#[test]
fn test_adjust_score_down() {
    let (env, admin, client) = setup_env();
    let counterparty = Address::generate(&env);
    let receipt_hash = make_receipt_hash(&env);

    // Create agent data and set a score
    client.record_transaction(
        &admin,
        &0u64,
        &counterparty,
        &100_0000000i128,
        &true,
        &receipt_hash,
    );
    client.calculate_score(&0u64);

    // Adjust up first to have a nonzero score to subtract from
    client.adjust_score(&admin, &0u64, &5000u32, &true);

    // Now adjust down by 2000
    let result = client.adjust_score(&admin, &0u64, &2000u32, &false);

    let score_after = client.get_score(&0u64);
    assert_eq!(score_after.score, result.score);
}

#[test]
fn test_score_capping_max() {
    let (env, admin, client) = setup_env();
    let counterparty = Address::generate(&env);
    let receipt_hash = make_receipt_hash(&env);

    // Create agent data
    client.record_transaction(
        &admin,
        &0u64,
        &counterparty,
        &100_0000000i128,
        &true,
        &receipt_hash,
    );
    client.calculate_score(&0u64);

    // Adjust up by a huge amount
    let result = client.adjust_score(&admin, &0u64, &20000u32, &true);
    assert_eq!(result.score, 10_000);
    assert_eq!(result.tier, TrustTier::Elite);
}

#[test]
fn test_score_capping_min() {
    let (env, admin, client) = setup_env();
    let counterparty = Address::generate(&env);
    let receipt_hash = make_receipt_hash(&env);

    // Create agent data
    client.record_transaction(
        &admin,
        &0u64,
        &counterparty,
        &100_0000000i128,
        &true,
        &receipt_hash,
    );
    client.calculate_score(&0u64);

    // Adjust down by more than current score
    let result = client.adjust_score(&admin, &0u64, &20000u32, &false);
    assert_eq!(result.score, 0);
    assert_eq!(result.tier, TrustTier::Unverified);
}

#[test]
fn test_not_initialized_error() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(ReputationEngineContract, ());
    let client = ReputationEngineContractClient::new(&env, &contract_id);

    // Should fail because not initialized
    let result = client.try_get_score(&0u64);
    assert!(result.is_err());
}

#[test]
fn test_agent_not_found_error() {
    let (_env, _admin, client) = setup_env();

    // No agent data exists for agent_id 999
    let result = client.try_get_score(&999u64);
    assert!(result.is_err());
}

#[test]
fn test_decay_no_activity() {
    let (env, admin, client) = setup_env();
    let counterparty = Address::generate(&env);
    let receipt_hash = make_receipt_hash(&env);

    // Create agent and set score
    client.record_transaction(
        &admin,
        &0u64,
        &counterparty,
        &1_000_0000000i128,
        &true,
        &receipt_hash,
    );
    client.calculate_score(&0u64);
    client.adjust_score(&admin, &0u64, &8000u32, &true);

    let before = client.get_score(&0u64);

    // Advance 10 weeks
    env.ledger().with_mut(|li| {
        li.timestamp += 10 * 604_800;
    });

    let after = client.apply_decay(&0u64);

    // Should have decayed significantly over 10 weeks
    let mut expected = before.score;
    for _ in 0..10 {
        expected = expected * 98 / 100;
    }
    assert_eq!(after.score, expected);
    assert!(after.score < before.score);
}

#[test]
fn test_multiple_agents() {
    let (env, admin, client) = setup_env();
    let counterparty = Address::generate(&env);
    let receipt_hash = make_receipt_hash(&env);

    // Record transactions for two different agents
    client.record_transaction(
        &admin,
        &0u64,
        &counterparty,
        &1_000_0000000i128,
        &true,
        &receipt_hash,
    );

    client.record_transaction(
        &admin,
        &1u64,
        &counterparty,
        &500_0000000i128,
        &false,
        &receipt_hash,
    );

    let breakdown0 = client.calculate_score(&0u64);
    let breakdown1 = client.calculate_score(&1u64);

    // Agent 0 has 100% success, agent 1 has 0%
    assert_eq!(breakdown0.success_rate_component, 4000);
    assert_eq!(breakdown1.success_rate_component, 0);
}

#[test]
fn test_get_score_breakdown() {
    let (env, admin, client) = setup_env();
    let counterparty = Address::generate(&env);
    let receipt_hash = make_receipt_hash(&env);

    // Record a transaction
    client.record_transaction(
        &admin,
        &0u64,
        &counterparty,
        &100_0000000i128,
        &true,
        &receipt_hash,
    );

    let breakdown = client.get_score_breakdown(&0u64);

    assert_eq!(breakdown.success_rate_component, 4000);
    assert_eq!(
        breakdown.total,
        breakdown.success_rate_component
            + breakdown.volume_component
            + breakdown.age_component
            + breakdown.attestation_component
            + breakdown.stake_component
    );
}
