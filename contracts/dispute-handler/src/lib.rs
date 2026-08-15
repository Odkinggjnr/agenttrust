#![no_std]

mod errors;
mod events;
mod storage;
mod types;

#[cfg(test)]
mod test;

use errors::DisputeError;
use events::{emit_claim_filed, emit_claim_resolved, emit_claim_responded};
use storage::DataKey;
use types::{
    Claim, ClaimStatus, ClaimType, OptionalHash, OptionalResolution, OptionalTimestamp, Resolution,
};

use soroban_sdk::{contract, contractimpl, Address, BytesN, Env, Vec};

fn status_to_u32(status: &ClaimStatus) -> u32 {
    match status {
        ClaimStatus::Open => 0,
        ClaimStatus::Responded => 1,
        ClaimStatus::Resolved => 2,
    }
}

#[contract]
pub struct DisputeHandlerContract;

#[contractimpl]
impl DisputeHandlerContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        reputation_contract: Address,
        stake_contract: Address,
    ) -> Result<(), DisputeError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(DisputeError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::ReputationContract, &reputation_contract);
        env.storage()
            .instance()
            .set(&DataKey::StakeContract, &stake_contract);
        env.storage().instance().set(&DataKey::ClaimCount, &0u64);
        Ok(())
    }

    pub fn file_claim(
        env: Env,
        claimant: Address,
        agent_id: u64,
        transaction_hash: BytesN<32>,
        claim_type: ClaimType,
        evidence_hash: BytesN<32>,
    ) -> Result<u64, DisputeError> {
        Self::require_initialized(&env)?;
        claimant.require_auth();

        let claim_count: u64 = env.storage().instance().get(&DataKey::ClaimCount).unwrap();
        let claim_id = claim_count;

        let claim = Claim {
            id: claim_id,
            claimant: claimant.clone(),
            agent_id,
            transaction_hash,
            claim_type: claim_type.clone(),
            evidence_hash,
            response_hash: OptionalHash::None,
            status: ClaimStatus::Open,
            resolution: OptionalResolution::None,
            filed_at: env.ledger().timestamp(),
            resolved_at: OptionalTimestamp::None,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Claim(claim_id), &claim);

        let mut agent_claims: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentClaims(agent_id))
            .unwrap_or(Vec::new(&env));
        agent_claims.push_back(claim_id);
        env.storage()
            .persistent()
            .set(&DataKey::AgentClaims(agent_id), &agent_claims);

        let status_key = status_to_u32(&ClaimStatus::Open);
        let mut status_claims: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::ClaimsByStatus(status_key))
            .unwrap_or(Vec::new(&env));
        status_claims.push_back(claim_id);
        env.storage()
            .persistent()
            .set(&DataKey::ClaimsByStatus(status_key), &status_claims);

        env.storage()
            .instance()
            .set(&DataKey::ClaimCount, &(claim_count + 1));

        emit_claim_filed(&env, claim_id, &claimant, agent_id, &claim_type);

        Ok(claim_id)
    }

    pub fn respond_to_claim(
        env: Env,
        claim_id: u64,
        responder: Address,
        response_hash: BytesN<32>,
    ) -> Result<(), DisputeError> {
        Self::require_initialized(&env)?;
        responder.require_auth();

        let mut claim: Claim = Self::get_claim_internal(&env, claim_id)?;

        if claim.status == ClaimStatus::Resolved {
            return Err(DisputeError::ClaimAlreadyResolved);
        }
        if claim.status != ClaimStatus::Open {
            return Err(DisputeError::ClaimNotOpen);
        }

        Self::remove_from_status_list(&env, claim_id, &ClaimStatus::Open);

        claim.response_hash = OptionalHash::Some(response_hash);
        claim.status = ClaimStatus::Responded;

        env.storage()
            .persistent()
            .set(&DataKey::Claim(claim_id), &claim);

        let status_key = status_to_u32(&ClaimStatus::Responded);
        let mut status_claims: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::ClaimsByStatus(status_key))
            .unwrap_or(Vec::new(&env));
        status_claims.push_back(claim_id);
        env.storage()
            .persistent()
            .set(&DataKey::ClaimsByStatus(status_key), &status_claims);

        emit_claim_responded(&env, claim_id, claim.agent_id);

        Ok(())
    }

    pub fn resolve_claim(
        env: Env,
        claim_id: u64,
        caller: Address,
        resolution: Resolution,
    ) -> Result<(), DisputeError> {
        Self::require_initialized(&env)?;
        let admin: Address = Self::get_admin(&env)?;
        if caller != admin {
            return Err(DisputeError::NotAuthorized);
        }
        caller.require_auth();

        let mut claim: Claim = Self::get_claim_internal(&env, claim_id)?;

        if claim.status == ClaimStatus::Resolved {
            return Err(DisputeError::ClaimAlreadyResolved);
        }

        Self::remove_from_status_list(&env, claim_id, &claim.status);

        let slash_percent: u32 = match resolution {
            Resolution::AgainstAgent => match claim.claim_type {
                ClaimType::Fraud => 50,
                _ => 10,
            },
            Resolution::ForAgent | Resolution::Dismissed => 0,
        };

        claim.resolution = OptionalResolution::Some(resolution.clone());
        claim.status = ClaimStatus::Resolved;
        claim.resolved_at = OptionalTimestamp::Some(env.ledger().timestamp());

        env.storage()
            .persistent()
            .set(&DataKey::Claim(claim_id), &claim);

        let status_key = status_to_u32(&ClaimStatus::Resolved);
        let mut status_claims: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::ClaimsByStatus(status_key))
            .unwrap_or(Vec::new(&env));
        status_claims.push_back(claim_id);
        env.storage()
            .persistent()
            .set(&DataKey::ClaimsByStatus(status_key), &status_claims);

        emit_claim_resolved(&env, claim_id, claim.agent_id, &resolution, slash_percent);

        Ok(())
    }

    pub fn get_claims(env: Env, agent_id: u64) -> Result<Vec<Claim>, DisputeError> {
        Self::require_initialized(&env)?;

        let claim_ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentClaims(agent_id))
            .unwrap_or(Vec::new(&env));

        let mut claims: Vec<Claim> = Vec::new(&env);
        for i in 0..claim_ids.len() {
            let cid = claim_ids.get(i).unwrap();
            if let Some(claim) = env
                .storage()
                .persistent()
                .get::<DataKey, Claim>(&DataKey::Claim(cid))
            {
                claims.push_back(claim);
            }
        }

        Ok(claims)
    }

    pub fn get_claim(env: Env, claim_id: u64) -> Result<Claim, DisputeError> {
        Self::require_initialized(&env)?;
        Self::get_claim_internal(&env, claim_id)
    }

    pub fn get_claims_by_status(env: Env, status: ClaimStatus) -> Result<Vec<Claim>, DisputeError> {
        Self::require_initialized(&env)?;

        let status_key = status_to_u32(&status);
        let claim_ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::ClaimsByStatus(status_key))
            .unwrap_or(Vec::new(&env));

        let mut claims: Vec<Claim> = Vec::new(&env);
        for i in 0..claim_ids.len() {
            let cid = claim_ids.get(i).unwrap();
            if let Some(claim) = env
                .storage()
                .persistent()
                .get::<DataKey, Claim>(&DataKey::Claim(cid))
            {
                claims.push_back(claim);
            }
        }

        Ok(claims)
    }

    // ---- Internal helpers ----

    fn require_initialized(env: &Env) -> Result<(), DisputeError> {
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(DisputeError::NotInitialized);
        }
        Ok(())
    }

    fn get_admin(env: &Env) -> Result<Address, DisputeError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(DisputeError::NotInitialized)
    }

    fn get_claim_internal(env: &Env, claim_id: u64) -> Result<Claim, DisputeError> {
        env.storage()
            .persistent()
            .get(&DataKey::Claim(claim_id))
            .ok_or(DisputeError::ClaimNotFound)
    }

    fn remove_from_status_list(env: &Env, claim_id: u64, status: &ClaimStatus) {
        let status_key = status_to_u32(status);
        let old_list: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::ClaimsByStatus(status_key))
            .unwrap_or(Vec::new(env));

        let mut new_list: Vec<u64> = Vec::new(env);
        for i in 0..old_list.len() {
            let cid = old_list.get(i).unwrap();
            if cid != claim_id {
                new_list.push_back(cid);
            }
        }

        env.storage()
            .persistent()
            .set(&DataKey::ClaimsByStatus(status_key), &new_list);
    }
}
