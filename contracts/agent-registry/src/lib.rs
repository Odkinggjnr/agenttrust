#![no_std]

mod errors;
mod events;
mod storage;
mod types;

#[cfg(test)]
mod test;

use errors::AgentRegistryError;
use events::{
    emit_agent_deregistered, emit_agent_registered, emit_agent_suspended, emit_attestation_added,
    emit_attestation_revoked, emit_capabilities_updated, emit_metadata_updated,
};
use storage::DataKey;
use types::{Agent, AgentStatus, Attestation, AttestationType};

use soroban_sdk::{contract, contractimpl, Address, BytesN, Env, String, Symbol, Vec};

const MIN_STAKE: i128 = 100_0000000; // 100 XLM in stroops

#[contract]
pub struct AgentRegistryContract;

#[contractimpl]
impl AgentRegistryContract {
    /// Initialize the contract with an admin address.
    pub fn initialize(env: Env, admin: Address) -> Result<(), AgentRegistryError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(AgentRegistryError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::AgentCount, &0u64);
        env.storage()
            .instance()
            .set(&DataKey::AttestationCount, &0u64);
        Ok(())
    }

    /// Register a new agent identity on-chain.
    pub fn register_agent(
        env: Env,
        owner: Address,
        agent_address: Address,
        metadata_uri: String,
        capabilities: Vec<Symbol>,
        initial_stake: i128,
    ) -> Result<u64, AgentRegistryError> {
        Self::require_initialized(&env)?;
        owner.require_auth();

        if initial_stake < MIN_STAKE {
            return Err(AgentRegistryError::InsufficientStake);
        }

        // Check if agent_address is already registered
        if env
            .storage()
            .persistent()
            .has(&DataKey::AgentByAddress(agent_address.clone()))
        {
            return Err(AgentRegistryError::AgentAlreadyExists);
        }

        let agent_count: u64 = env.storage().instance().get(&DataKey::AgentCount).unwrap();
        let agent_id = agent_count;

        let agent = Agent {
            id: agent_id,
            owner: owner.clone(),
            agent_address: agent_address.clone(),
            metadata_uri,
            capabilities,
            trust_score: 0,
            total_transactions: 0,
            successful_transactions: 0,
            total_volume: 0,
            registered_at: env.ledger().timestamp(),
            stake: initial_stake,
            status: AgentStatus::Active,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Agent(agent_id), &agent);
        env.storage()
            .persistent()
            .set(&DataKey::AgentByAddress(agent_address.clone()), &agent_id);

        // Initialize empty attestation list for this agent
        let empty_attestations: Vec<u64> = Vec::new(&env);
        env.storage()
            .persistent()
            .set(&DataKey::AgentAttestations(agent_id), &empty_attestations);

        env.storage()
            .instance()
            .set(&DataKey::AgentCount, &(agent_count + 1));

        emit_agent_registered(&env, agent_id, &owner, &agent_address);

        Ok(agent_id)
    }

    /// Update the metadata URI for an agent. Only the owner can call this.
    pub fn update_metadata(
        env: Env,
        agent_id: u64,
        caller: Address,
        new_metadata_uri: String,
    ) -> Result<(), AgentRegistryError> {
        Self::require_initialized(&env)?;
        caller.require_auth();

        let mut agent: Agent = Self::get_agent_internal(&env, agent_id)?;
        Self::check_agent_active(&agent)?;

        if agent.owner != caller {
            return Err(AgentRegistryError::NotOwner);
        }

        agent.metadata_uri = new_metadata_uri;
        env.storage()
            .persistent()
            .set(&DataKey::Agent(agent_id), &agent);

        emit_metadata_updated(&env, agent_id);
        Ok(())
    }

    /// Add a third-party attestation for an agent.
    pub fn add_attestation(
        env: Env,
        agent_id: u64,
        attester: Address,
        attestation_type: AttestationType,
        data_hash: BytesN<32>,
    ) -> Result<u64, AgentRegistryError> {
        Self::require_initialized(&env)?;
        attester.require_auth();

        let agent: Agent = Self::get_agent_internal(&env, agent_id)?;
        Self::check_agent_active(&agent)?;

        let attestation_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::AttestationCount)
            .unwrap();
        let attestation_id = attestation_count;

        let attestation = Attestation {
            id: attestation_id,
            agent_id,
            attester: attester.clone(),
            attestation_type,
            data_hash,
            timestamp: env.ledger().timestamp(),
            revoked: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Attestation(attestation_id), &attestation);

        // Add attestation_id to the agent's attestation list
        let mut agent_attestations: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentAttestations(agent_id))
            .unwrap_or(Vec::new(&env));
        agent_attestations.push_back(attestation_id);
        env.storage()
            .persistent()
            .set(&DataKey::AgentAttestations(agent_id), &agent_attestations);

        env.storage()
            .instance()
            .set(&DataKey::AttestationCount, &(attestation_count + 1));

        emit_attestation_added(&env, attestation_id, agent_id, &attester);

        Ok(attestation_id)
    }

    /// Revoke an attestation. Only the original attester can revoke.
    pub fn revoke_attestation(
        env: Env,
        attestation_id: u64,
        caller: Address,
    ) -> Result<(), AgentRegistryError> {
        Self::require_initialized(&env)?;
        caller.require_auth();

        let mut attestation: Attestation = env
            .storage()
            .persistent()
            .get(&DataKey::Attestation(attestation_id))
            .ok_or(AgentRegistryError::AttestationNotFound)?;

        if attestation.attester != caller {
            return Err(AgentRegistryError::NotAttester);
        }

        attestation.revoked = true;
        env.storage()
            .persistent()
            .set(&DataKey::Attestation(attestation_id), &attestation);

        emit_attestation_revoked(&env, attestation_id);
        Ok(())
    }

    /// Set capabilities for an agent. Only the owner can call this.
    pub fn set_capabilities(
        env: Env,
        agent_id: u64,
        caller: Address,
        capabilities: Vec<Symbol>,
    ) -> Result<(), AgentRegistryError> {
        Self::require_initialized(&env)?;
        caller.require_auth();

        let mut agent: Agent = Self::get_agent_internal(&env, agent_id)?;
        Self::check_agent_active(&agent)?;

        if agent.owner != caller {
            return Err(AgentRegistryError::NotOwner);
        }

        agent.capabilities = capabilities;
        env.storage()
            .persistent()
            .set(&DataKey::Agent(agent_id), &agent);

        emit_capabilities_updated(&env, agent_id);
        Ok(())
    }

    /// Get an agent by its ID.
    pub fn get_agent(env: Env, agent_id: u64) -> Result<Agent, AgentRegistryError> {
        Self::require_initialized(&env)?;
        Self::get_agent_internal(&env, agent_id)
    }

    /// Get an agent by its on-chain address.
    pub fn get_agent_by_address(
        env: Env,
        agent_address: Address,
    ) -> Result<Agent, AgentRegistryError> {
        Self::require_initialized(&env)?;
        let agent_id: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::AgentByAddress(agent_address))
            .ok_or(AgentRegistryError::AgentNotFound)?;
        Self::get_agent_internal(&env, agent_id)
    }

    /// Return up to `limit` attestations for an agent, newest entries last.
    pub fn get_attestations(
        env: Env,
        agent_id: u64,
        limit: u32,
    ) -> Result<Vec<Attestation>, AgentRegistryError> {
        Self::require_initialized(&env)?;
        Self::get_agent_internal(&env, agent_id)?;

        let ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentAttestations(agent_id))
            .unwrap_or(Vec::new(&env));
        let mut results = Vec::new(&env);
        let start = if ids.len() > limit {
            ids.len() - limit
        } else {
            0
        };

        for i in start..ids.len() {
            if let Some(attestation) = env
                .storage()
                .persistent()
                .get::<DataKey, Attestation>(&DataKey::Attestation(ids.get(i).unwrap()))
            {
                results.push_back(attestation);
            }
        }

        Ok(results)
    }

    /// Search agents by capability and minimum trust score.
    pub fn search_agents(
        env: Env,
        capability: Symbol,
        min_score: u32,
    ) -> Result<Vec<Agent>, AgentRegistryError> {
        Self::require_initialized(&env)?;
        let agent_count: u64 = env.storage().instance().get(&DataKey::AgentCount).unwrap();
        let mut results: Vec<Agent> = Vec::new(&env);

        for i in 0..agent_count {
            if let Some(agent) = env
                .storage()
                .persistent()
                .get::<DataKey, Agent>(&DataKey::Agent(i))
            {
                if agent.trust_score >= min_score && agent.status == AgentStatus::Active {
                    let caps = &agent.capabilities;
                    let mut has_cap = false;
                    for j in 0..caps.len() {
                        if caps.get(j).unwrap() == capability {
                            has_cap = true;
                            break;
                        }
                    }
                    if has_cap {
                        results.push_back(agent);
                    }
                }
            }
        }

        Ok(results)
    }

    /// Deregister an agent. Only the owner can call this.
    pub fn deregister(env: Env, agent_id: u64, caller: Address) -> Result<(), AgentRegistryError> {
        Self::require_initialized(&env)?;
        caller.require_auth();

        let mut agent: Agent = Self::get_agent_internal(&env, agent_id)?;
        Self::check_agent_active(&agent)?;

        if agent.owner != caller {
            return Err(AgentRegistryError::NotOwner);
        }

        agent.status = AgentStatus::Deregistering(env.ledger().timestamp());
        env.storage()
            .persistent()
            .set(&DataKey::Agent(agent_id), &agent);

        emit_agent_deregistered(&env, agent_id);
        Ok(())
    }

    /// Update the trust score for an agent. Called by the reputation engine.
    pub fn update_trust_score(
        env: Env,
        agent_id: u64,
        new_score: u32,
    ) -> Result<(), AgentRegistryError> {
        Self::require_initialized(&env)?;
        let admin: Address = Self::get_admin(&env)?;
        admin.require_auth();

        let mut agent: Agent = Self::get_agent_internal(&env, agent_id)?;
        agent.trust_score = new_score;
        env.storage()
            .persistent()
            .set(&DataKey::Agent(agent_id), &agent);

        Ok(())
    }

    /// Update transaction statistics for an agent. Called by the reputation engine.
    pub fn update_transaction_stats(
        env: Env,
        agent_id: u64,
        success: bool,
        amount: i128,
    ) -> Result<(), AgentRegistryError> {
        Self::require_initialized(&env)?;
        let admin: Address = Self::get_admin(&env)?;
        admin.require_auth();

        let mut agent: Agent = Self::get_agent_internal(&env, agent_id)?;
        agent.total_transactions += 1;
        if success {
            agent.successful_transactions += 1;
        }
        agent.total_volume += amount;
        env.storage()
            .persistent()
            .set(&DataKey::Agent(agent_id), &agent);

        Ok(())
    }

    /// Suspend an agent. Admin only.
    pub fn suspend_agent(env: Env, agent_id: u64) -> Result<(), AgentRegistryError> {
        Self::require_initialized(&env)?;
        let admin: Address = Self::get_admin(&env)?;
        admin.require_auth();

        let mut agent: Agent = Self::get_agent_internal(&env, agent_id)?;
        agent.status = AgentStatus::Suspended;
        env.storage()
            .persistent()
            .set(&DataKey::Agent(agent_id), &agent);

        emit_agent_suspended(&env, agent_id);
        Ok(())
    }

    // ---- Internal helpers ----

    fn require_initialized(env: &Env) -> Result<(), AgentRegistryError> {
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(AgentRegistryError::NotInitialized);
        }
        Ok(())
    }

    fn get_admin(env: &Env) -> Result<Address, AgentRegistryError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(AgentRegistryError::NotInitialized)
    }

    fn get_agent_internal(env: &Env, agent_id: u64) -> Result<Agent, AgentRegistryError> {
        env.storage()
            .persistent()
            .get(&DataKey::Agent(agent_id))
            .ok_or(AgentRegistryError::AgentNotFound)
    }

    fn check_agent_active(agent: &Agent) -> Result<(), AgentRegistryError> {
        match &agent.status {
            AgentStatus::Active => Ok(()),
            AgentStatus::Suspended => Err(AgentRegistryError::AgentSuspended),
            AgentStatus::Deregistering(_) => Err(AgentRegistryError::AgentDeregistering),
        }
    }
}
