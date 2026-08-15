#![cfg(test)]

use crate::errors::StakeError;
use crate::types::SlashReason;
use crate::{StakeManagerContract, StakeManagerContractClient};
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::token::{StellarAssetClient, TokenClient};
use soroban_sdk::{Address, Env};

/// Helper to set up the test environment with a token, admin, and initialized contract.
fn setup() -> (
    Env,
    StakeManagerContractClient<'static>,
    Address,
    Address,
    TokenClient<'static>,
) {
    let env = Env::default();
    env.mock_all_auths();

    // Set initial ledger timestamp
    // Keep the SDK-provided protocol and TTL defaults in sync with the host.
    // Overriding the full LedgerInfo made these tests fail after SDK upgrades.
    env.ledger().set_timestamp(1000);

    let admin = Address::generate(&env);

    // Create a test token (Stellar Asset Contract)
    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = token_contract.address();
    let sac_client = StellarAssetClient::new(&env, &token_address);
    let token_client = TokenClient::new(&env, &token_address);

    // Deploy the stake-manager contract
    let contract_id = env.register(StakeManagerContract, ());
    let client = StakeManagerContractClient::new(&env, &contract_id);

    // Initialize the contract
    client.initialize(&admin, &token_address);

    // Mint tokens to the test addresses later as needed
    // We keep sac_client alive through the token_admin
    // For minting, we'll use sac_client in individual tests

    // Store sac_client reference via a helper — but since we need it in tests,
    // let's just return what we need and re-create sac_client in tests.
    let _ = sac_client;

    (env, client, admin, token_address, token_client)
}

/// Helper to mint tokens to an address using the SAC admin interface.
fn mint_tokens(env: &Env, token_address: &Address, to: &Address, amount: i128) {
    let sac_client = StellarAssetClient::new(env, token_address);
    sac_client.mint(to, &amount);
}

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_address = Address::generate(&env);

    let contract_id = env.register(StakeManagerContract, ());
    let client = StakeManagerContractClient::new(&env, &contract_id);

    client.initialize(&admin, &token_address);

    // Double init should fail
    let result = client.try_initialize(&admin, &token_address);
    assert_eq!(result, Err(Ok(StakeError::AlreadyInitialized)));
}

#[test]
fn test_deposit_stake() {
    let (env, client, _admin, token_address, token_client) = setup();
    let depositor = Address::generate(&env);
    let agent_id: u64 = 1;
    let amount: i128 = 200_0000000; // 200 XLM

    // Mint tokens to depositor
    mint_tokens(&env, &token_address, &depositor, amount);

    // Deposit
    let new_total = client.deposit_stake(&agent_id, &depositor, &amount);
    assert_eq!(new_total, amount);

    // Verify depositor balance decreased
    assert_eq!(token_client.balance(&depositor), 0);

    // Verify contract balance increased
    assert_eq!(token_client.balance(&client.address), amount);
}

#[test]
fn test_deposit_additional_stake() {
    let (env, client, _admin, token_address, _token_client) = setup();
    let depositor = Address::generate(&env);
    let agent_id: u64 = 1;
    let first_deposit: i128 = 200_0000000;
    let second_deposit: i128 = 150_0000000;

    // Mint enough tokens
    mint_tokens(
        &env,
        &token_address,
        &depositor,
        first_deposit + second_deposit,
    );

    // First deposit
    let total_after_first = client.deposit_stake(&agent_id, &depositor, &first_deposit);
    assert_eq!(total_after_first, first_deposit);

    // Second deposit accumulates
    let total_after_second = client.deposit_stake(&agent_id, &depositor, &second_deposit);
    assert_eq!(total_after_second, first_deposit + second_deposit);

    // Verify stake info
    let stake_info = client.get_stake(&agent_id);
    assert_eq!(stake_info.total_stake, first_deposit + second_deposit);
    assert_eq!(stake_info.available_stake, first_deposit + second_deposit);
    assert_eq!(stake_info.pending_withdrawal_amount, 0);
}

#[test]
fn test_different_depositor_cannot_take_over_agent_stake() {
    let (env, client, _admin, token_address, _token_client) = setup();
    let owner = Address::generate(&env);
    let attacker = Address::generate(&env);
    let agent_id = 1u64;
    let amount = 200_0000000i128;

    mint_tokens(&env, &token_address, &owner, amount);
    mint_tokens(&env, &token_address, &attacker, amount);
    client.deposit_stake(&agent_id, &owner, &amount);

    assert_eq!(
        client.try_deposit_stake(&agent_id, &attacker, &amount),
        Err(Ok(StakeError::NotStakeOwner))
    );
    assert_eq!(
        client.try_request_withdrawal(&agent_id, &attacker, &amount),
        Err(Ok(StakeError::NotStakeOwner))
    );
}

#[test]
fn test_deposit_invalid_amount() {
    let (env, client, _admin, _token_address, _token_client) = setup();
    let depositor = Address::generate(&env);
    let agent_id: u64 = 1;

    let result = client.try_deposit_stake(&agent_id, &depositor, &0);
    assert_eq!(result, Err(Ok(StakeError::InvalidAmount)));

    let result = client.try_deposit_stake(&agent_id, &depositor, &-100);
    assert_eq!(result, Err(Ok(StakeError::InvalidAmount)));
}

#[test]
fn test_request_withdrawal() {
    let (env, client, _admin, token_address, _token_client) = setup();
    let depositor = Address::generate(&env);
    let agent_id: u64 = 1;
    let deposit_amount: i128 = 300_0000000; // 300 XLM
    let withdrawal_amount: i128 = 100_0000000; // 100 XLM

    mint_tokens(&env, &token_address, &depositor, deposit_amount);
    client.deposit_stake(&agent_id, &depositor, &deposit_amount);

    // Request withdrawal
    let withdrawal_id = client.request_withdrawal(&agent_id, &depositor, &withdrawal_amount);
    assert_eq!(withdrawal_id, 0);

    // Verify pending withdrawal exists with correct unlock time
    let pending = client.get_pending_withdrawals(&agent_id);
    assert_eq!(pending.len(), 1);
    let w = pending.get(0).unwrap();
    assert_eq!(w.amount, withdrawal_amount);
    assert_eq!(w.agent_id, agent_id);
    assert_eq!(w.requester, depositor);
    assert_eq!(w.requested_at, 1000); // initial ledger timestamp
    assert_eq!(w.unlock_at, 1000 + 604800); // timestamp + 7 days

    // Verify stake info shows pending amount
    let stake_info = client.get_stake(&agent_id);
    assert_eq!(stake_info.total_stake, deposit_amount);
    assert_eq!(stake_info.pending_withdrawal_amount, withdrawal_amount);
    assert_eq!(
        stake_info.available_stake,
        deposit_amount - withdrawal_amount
    );
}

#[test]
fn test_request_withdrawal_insufficient_stake() {
    let (env, client, _admin, token_address, _token_client) = setup();
    let depositor = Address::generate(&env);
    let agent_id: u64 = 1;
    let deposit_amount: i128 = 200_0000000;

    mint_tokens(&env, &token_address, &depositor, deposit_amount);
    client.deposit_stake(&agent_id, &depositor, &deposit_amount);

    // Try to withdraw more than deposited
    let result =
        client.try_request_withdrawal(&agent_id, &depositor, &(deposit_amount + 1_0000000));
    assert_eq!(result, Err(Ok(StakeError::InsufficientStake)));
}

#[test]
fn test_request_withdrawal_below_min_stake() {
    let (env, client, _admin, token_address, _token_client) = setup();
    let depositor = Address::generate(&env);
    let agent_id: u64 = 1;
    let deposit_amount: i128 = 200_0000000; // 200 XLM

    mint_tokens(&env, &token_address, &depositor, deposit_amount);
    client.deposit_stake(&agent_id, &depositor, &deposit_amount);

    // Try to withdraw 150 XLM, leaving only 50 XLM (below MIN_STAKE of 100 XLM)
    let result = client.try_request_withdrawal(&agent_id, &depositor, &150_0000000);
    assert_eq!(result, Err(Ok(StakeError::BelowMinimumStake)));
}

#[test]
fn test_request_withdrawal_all_allowed() {
    let (env, client, _admin, token_address, _token_client) = setup();
    let depositor = Address::generate(&env);
    let agent_id: u64 = 1;
    let deposit_amount: i128 = 200_0000000;

    mint_tokens(&env, &token_address, &depositor, deposit_amount);
    client.deposit_stake(&agent_id, &depositor, &deposit_amount);

    // Withdrawing ALL stake is allowed (deregistering)
    let withdrawal_id = client.request_withdrawal(&agent_id, &depositor, &deposit_amount);
    assert_eq!(withdrawal_id, 0);
}

#[test]
fn test_complete_withdrawal_after_cooldown() {
    let (env, client, _admin, token_address, token_client) = setup();
    let depositor = Address::generate(&env);
    let agent_id: u64 = 1;
    let deposit_amount: i128 = 300_0000000;
    let withdrawal_amount: i128 = 100_0000000;

    mint_tokens(&env, &token_address, &depositor, deposit_amount);
    client.deposit_stake(&agent_id, &depositor, &deposit_amount);

    let withdrawal_id = client.request_withdrawal(&agent_id, &depositor, &withdrawal_amount);

    // Advance time past cooldown (7 days + 1 second)
    env.ledger().set_timestamp(1000 + 604800 + 1);

    // Complete withdrawal
    client.complete_withdrawal(&withdrawal_id, &depositor);

    // Verify tokens returned to depositor
    assert_eq!(token_client.balance(&depositor), withdrawal_amount);

    // Verify stake reduced
    let stake_info = client.get_stake(&agent_id);
    assert_eq!(stake_info.total_stake, deposit_amount - withdrawal_amount);
    assert_eq!(stake_info.pending_withdrawal_amount, 0);

    // Verify no pending withdrawals
    let pending = client.get_pending_withdrawals(&agent_id);
    assert_eq!(pending.len(), 0);
}

#[test]
fn test_complete_withdrawal_before_cooldown_fails() {
    let (env, client, _admin, token_address, _token_client) = setup();
    let depositor = Address::generate(&env);
    let agent_id: u64 = 1;
    let deposit_amount: i128 = 300_0000000;
    let withdrawal_amount: i128 = 100_0000000;

    mint_tokens(&env, &token_address, &depositor, deposit_amount);
    client.deposit_stake(&agent_id, &depositor, &deposit_amount);

    let withdrawal_id = client.request_withdrawal(&agent_id, &depositor, &withdrawal_amount);

    // Try to complete before cooldown (only advance 1 day)
    env.ledger().set_timestamp(1000 + 86400); // 1 day, not 7

    let result = client.try_complete_withdrawal(&withdrawal_id, &depositor);
    assert_eq!(result, Err(Ok(StakeError::CooldownNotComplete)));
}

#[test]
fn test_cancel_withdrawal() {
    let (env, client, _admin, token_address, _token_client) = setup();
    let depositor = Address::generate(&env);
    let agent_id: u64 = 1;
    let deposit_amount: i128 = 300_0000000;
    let withdrawal_amount: i128 = 100_0000000;

    mint_tokens(&env, &token_address, &depositor, deposit_amount);
    client.deposit_stake(&agent_id, &depositor, &deposit_amount);

    let withdrawal_id = client.request_withdrawal(&agent_id, &depositor, &withdrawal_amount);

    // Cancel the withdrawal
    client.cancel_withdrawal(&withdrawal_id, &depositor);

    // Verify no pending withdrawals
    let pending = client.get_pending_withdrawals(&agent_id);
    assert_eq!(pending.len(), 0);

    // Verify stake is fully available again
    let stake_info = client.get_stake(&agent_id);
    assert_eq!(stake_info.total_stake, deposit_amount);
    assert_eq!(stake_info.available_stake, deposit_amount);
    assert_eq!(stake_info.pending_withdrawal_amount, 0);
}

#[test]
fn test_slash_dispute_loss() {
    let (env, client, admin, token_address, _token_client) = setup();
    let depositor = Address::generate(&env);
    let agent_id: u64 = 1;
    let deposit_amount: i128 = 1000_0000000; // 1000 XLM

    mint_tokens(&env, &token_address, &depositor, deposit_amount);
    client.deposit_stake(&agent_id, &depositor, &deposit_amount);

    // Slash 10% for dispute loss
    let slash_amount = deposit_amount / 10; // 100 XLM
    client.slash(&agent_id, &slash_amount, &SlashReason::DisputeLoss, &admin);

    // Verify stake reduced
    let stake_info = client.get_stake(&agent_id);
    assert_eq!(stake_info.total_stake, deposit_amount - slash_amount);
    assert_eq!(stake_info.available_stake, deposit_amount - slash_amount);
}

#[test]
fn test_slash_fraud() {
    let (env, client, admin, token_address, _token_client) = setup();
    let depositor = Address::generate(&env);
    let agent_id: u64 = 1;
    let deposit_amount: i128 = 1000_0000000; // 1000 XLM

    mint_tokens(&env, &token_address, &depositor, deposit_amount);
    client.deposit_stake(&agent_id, &depositor, &deposit_amount);

    // Slash 50% for confirmed fraud
    let slash_amount = deposit_amount / 2; // 500 XLM
    client.slash(
        &agent_id,
        &slash_amount,
        &SlashReason::ConfirmedFraud,
        &admin,
    );

    // Verify stake reduced by 50%
    let stake_info = client.get_stake(&agent_id);
    assert_eq!(stake_info.total_stake, deposit_amount - slash_amount);
}

#[test]
fn test_slash_unauthorized_fails() {
    let (env, client, _admin, token_address, _token_client) = setup();
    let depositor = Address::generate(&env);
    let random_caller = Address::generate(&env);
    let agent_id: u64 = 1;
    let deposit_amount: i128 = 1000_0000000;

    mint_tokens(&env, &token_address, &depositor, deposit_amount);
    client.deposit_stake(&agent_id, &depositor, &deposit_amount);

    // Try to slash from unauthorized address
    let result = client.try_slash(
        &agent_id,
        &100_0000000,
        &SlashReason::AdminAction,
        &random_caller,
    );
    assert_eq!(result, Err(Ok(StakeError::NotAuthorized)));
}

#[test]
fn test_slash_by_dispute_handler() {
    let (env, client, admin, token_address, _token_client) = setup();
    let depositor = Address::generate(&env);
    let dispute_handler = Address::generate(&env);
    let agent_id: u64 = 1;
    let deposit_amount: i128 = 1000_0000000;

    mint_tokens(&env, &token_address, &depositor, deposit_amount);
    client.deposit_stake(&agent_id, &depositor, &deposit_amount);

    // Set dispute handler
    client.set_dispute_handler(&admin, &dispute_handler);

    // Slash via dispute handler
    let slash_amount: i128 = 100_0000000;
    client.slash(
        &agent_id,
        &slash_amount,
        &SlashReason::DisputeLoss,
        &dispute_handler,
    );

    let stake_info = client.get_stake(&agent_id);
    assert_eq!(stake_info.total_stake, deposit_amount - slash_amount);
}

#[test]
fn test_get_stake_info_with_pending() {
    let (env, client, _admin, token_address, _token_client) = setup();
    let depositor = Address::generate(&env);
    let agent_id: u64 = 1;
    let deposit_amount: i128 = 500_0000000; // 500 XLM
    let withdrawal_1: i128 = 100_0000000; // 100 XLM
    let withdrawal_2: i128 = 150_0000000; // 150 XLM

    mint_tokens(&env, &token_address, &depositor, deposit_amount);
    client.deposit_stake(&agent_id, &depositor, &deposit_amount);

    // Request two withdrawals
    client.request_withdrawal(&agent_id, &depositor, &withdrawal_1);
    client.request_withdrawal(&agent_id, &depositor, &withdrawal_2);

    // Verify stake info
    let stake_info = client.get_stake(&agent_id);
    assert_eq!(stake_info.total_stake, deposit_amount);
    assert_eq!(
        stake_info.pending_withdrawal_amount,
        withdrawal_1 + withdrawal_2
    );
    assert_eq!(
        stake_info.available_stake,
        deposit_amount - withdrawal_1 - withdrawal_2
    );

    // Verify pending withdrawals list
    let pending = client.get_pending_withdrawals(&agent_id);
    assert_eq!(pending.len(), 2);
}

#[test]
fn test_set_dispute_handler_not_admin_fails() {
    let (env, client, _admin, _token_address, _token_client) = setup();
    let random_caller = Address::generate(&env);
    let dispute_handler = Address::generate(&env);

    let result = client.try_set_dispute_handler(&random_caller, &dispute_handler);
    assert_eq!(result, Err(Ok(StakeError::NotAuthorized)));
}

#[test]
fn test_agent_not_found() {
    let (_env, client, _admin, _token_address, _token_client) = setup();
    let nonexistent_agent: u64 = 999;

    let result = client.try_get_stake(&nonexistent_agent);
    assert_eq!(result, Err(Ok(StakeError::AgentNotFound)));
}

#[test]
fn test_withdrawal_not_found() {
    let (env, client, _admin, _token_address, _token_client) = setup();
    let caller = Address::generate(&env);
    let nonexistent_withdrawal: u64 = 999;

    let result = client.try_complete_withdrawal(&nonexistent_withdrawal, &caller);
    assert_eq!(result, Err(Ok(StakeError::WithdrawalNotFound)));
}
