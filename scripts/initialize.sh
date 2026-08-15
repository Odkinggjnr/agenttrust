#!/usr/bin/env bash
# initialize.sh - Initialize all deployed AgentTrust contracts.
set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { printf "${BLUE}[INFO]${NC}  %s\n" "$*"; }
success() { printf "${GREEN}[OK]${NC}    %s\n" "$*"; }
warn()    { printf "${YELLOW}[WARN]${NC}  %s\n" "$*"; }
fail()    { printf "${RED}[FAIL]${NC}  %s\n" "$*"; exit 1; }

# ── Configuration ───────────────────────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
NETWORK="testnet"

# Determine CLI binary
if command -v stellar &> /dev/null; then
    CLI="stellar"
elif command -v soroban &> /dev/null; then
    CLI="soroban"
else
    fail "Neither 'stellar' nor 'soroban' CLI found."
fi

# ── Load .env ───────────────────────────────────────────────────────────────
if [ ! -f "${ENV_FILE}" ]; then
    fail ".env file not found. Run ./scripts/deploy.sh first."
fi

set -a
source "${ENV_FILE}"
set +a

# Validate contract IDs
for var in AGENT_REGISTRY_CONTRACT_ID REPUTATION_ENGINE_CONTRACT_ID \
           STAKE_MANAGER_CONTRACT_ID DISPUTE_HANDLER_CONTRACT_ID \
           X402_VERIFIER_CONTRACT_ID; do
    if [ -z "${!var:-}" ]; then
        fail "${var} is empty in .env. Run ./scripts/deploy.sh first."
    fi
done

printf "\n${CYAN}═══════════════════════════════════════════════════════${NC}\n"
printf "${CYAN}  AgentTrust Contract Initialization${NC}\n"
printf "${CYAN}═══════════════════════════════════════════════════════${NC}\n\n"

# ── Admin identity ──────────────────────────────────────────────────────────
# Use default identity or create one
ADMIN_ADDRESS=$(${CLI} keys address default 2>/dev/null || true)

if [ -z "${ADMIN_ADDRESS}" ]; then
    info "No default identity found. Generating one..."
    ${CLI} keys generate default --network "${NETWORK}" 2>/dev/null
    ADMIN_ADDRESS=$(${CLI} keys address default)
    info "Funding default identity on testnet..."
    ${CLI} keys fund default --network "${NETWORK}" 2>/dev/null || true
    success "Created and funded admin identity: ${ADMIN_ADDRESS}"
else
    success "Using admin identity: ${ADMIN_ADDRESS}"
fi

# ── XLM token contract address (SAC on testnet) ────────────────────────────
# The native XLM Stellar Asset Contract address on testnet
XLM_SAC="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
info "Using XLM SAC address: ${XLM_SAC}"

# ── Step 1: Initialize agent-registry ────────────────────────────────────────
printf "\n${CYAN}── Initializing agent-registry ─────────────────────────${NC}\n\n"

info "Calling initialize(admin)..."
${CLI} contract invoke \
    --id "${AGENT_REGISTRY_CONTRACT_ID}" \
    --network "${NETWORK}" \
    --source default \
    -- initialize \
    --admin "${ADMIN_ADDRESS}" \
    && success "agent-registry initialized" \
    || warn "agent-registry may already be initialized"

# ── Step 2: Initialize reputation-engine ─────────────────────────────────────
printf "\n${CYAN}── Initializing reputation-engine ──────────────────────${NC}\n\n"

info "Calling initialize(admin, registry_contract_id)..."
${CLI} contract invoke \
    --id "${REPUTATION_ENGINE_CONTRACT_ID}" \
    --network "${NETWORK}" \
    --source default \
    -- initialize \
    --admin "${ADMIN_ADDRESS}" \
    --registry_contract_id "${AGENT_REGISTRY_CONTRACT_ID}" \
    && success "reputation-engine initialized" \
    || warn "reputation-engine may already be initialized"

# ── Step 3: Initialize stake-manager ─────────────────────────────────────────
printf "\n${CYAN}── Initializing stake-manager ──────────────────────────${NC}\n\n"

info "Calling initialize(admin, token_contract)..."
${CLI} contract invoke \
    --id "${STAKE_MANAGER_CONTRACT_ID}" \
    --network "${NETWORK}" \
    --source default \
    -- initialize \
    --admin "${ADMIN_ADDRESS}" \
    --token_contract "${XLM_SAC}" \
    && success "stake-manager initialized" \
    || warn "stake-manager may already be initialized"

# ── Step 4: Initialize dispute-handler ───────────────────────────────────────
printf "\n${CYAN}── Initializing dispute-handler ────────────────────────${NC}\n\n"

info "Calling initialize(admin, reputation_contract, stake_contract)..."
${CLI} contract invoke \
    --id "${DISPUTE_HANDLER_CONTRACT_ID}" \
    --network "${NETWORK}" \
    --source default \
    -- initialize \
    --admin "${ADMIN_ADDRESS}" \
    --reputation_contract "${REPUTATION_ENGINE_CONTRACT_ID}" \
    --stake_contract "${STAKE_MANAGER_CONTRACT_ID}" \
    && success "dispute-handler initialized" \
    || warn "dispute-handler may already be initialized"

# ── Step 5: Initialize x402-verifier ─────────────────────────────────────────
printf "\n${CYAN}── Initializing x402-verifier ──────────────────────────${NC}\n\n"

info "Calling initialize(admin, reputation_contract, registry_contract)..."
${CLI} contract invoke \
    --id "${X402_VERIFIER_CONTRACT_ID}" \
    --network "${NETWORK}" \
    --source default \
    -- initialize \
    --admin "${ADMIN_ADDRESS}" \
    --reputation_contract "${REPUTATION_ENGINE_CONTRACT_ID}" \
    --registry_contract "${AGENT_REGISTRY_CONTRACT_ID}" \
    && success "x402-verifier initialized" \
    || warn "x402-verifier may already be initialized"

# ── Step 6: Link contracts ───────────────────────────────────────────────────
printf "\n${CYAN}── Linking Contracts ───────────────────────────────────${NC}\n\n"

info "Setting dispute-handler on stake-manager..."
${CLI} contract invoke \
    --id "${STAKE_MANAGER_CONTRACT_ID}" \
    --network "${NETWORK}" \
    --source default \
    -- set_dispute_handler \
    --caller "${ADMIN_ADDRESS}" \
    --contract_id "${DISPUTE_HANDLER_CONTRACT_ID}" \
    && success "stake-manager linked to dispute-handler" \
    || warn "Failed to link dispute-handler (may need to check admin)"

# ── Summary ──────────────────────────────────────────────────────────────────
printf "\n${CYAN}═══════════════════════════════════════════════════════${NC}\n"
printf "${GREEN}  Initialization Complete${NC}\n"
printf "${CYAN}═══════════════════════════════════════════════════════${NC}\n\n"

printf "Admin address: ${ADMIN_ADDRESS}\n"
printf "\n"
printf "Contract links:\n"
printf "  reputation-engine -> agent-registry  (registry_contract_id)\n"
printf "  dispute-handler   -> reputation-engine (reputation_contract)\n"
printf "  dispute-handler   -> stake-manager   (stake_contract)\n"
printf "  x402-verifier     -> reputation-engine (reputation_contract)\n"
printf "  x402-verifier     -> agent-registry  (registry_contract)\n"
printf "  stake-manager     -> dispute-handler (dispute_handler)\n"
printf "\n"
info "Next step: Run ./scripts/seed-testnet.sh to create sample agents"
printf "\n"
