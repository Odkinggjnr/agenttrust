#!/usr/bin/env bash
# seed-testnet.sh - Create sample agents, transactions, attestations, and a dispute.
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
    fail ".env file not found. Run deploy.sh and initialize.sh first."
fi

set -a
source "${ENV_FILE}"
set +a

REGISTRY="${AGENT_REGISTRY_CONTRACT_ID}"
REPUTATION="${REPUTATION_ENGINE_CONTRACT_ID}"
DISPUTE="${DISPUTE_HANDLER_CONTRACT_ID}"

ADMIN_ADDRESS=$(${CLI} keys address default 2>/dev/null) \
    || fail "No default identity found. Run initialize.sh first."

printf "\n${CYAN}═══════════════════════════════════════════════════════${NC}\n"
printf "${CYAN}  AgentTrust Testnet Seeding${NC}\n"
printf "${CYAN}═══════════════════════════════════════════════════════${NC}\n\n"

# ── Generate test identities ────────────────────────────────────────────────
info "Generating test identities..."

AGENT_NAMES=("translator-bot" "code-reviewer" "data-cruncher" "web-scraper" "content-writer")

for name in "${AGENT_NAMES[@]}"; do
    if ${CLI} keys address "${name}" &>/dev/null; then
        info "Identity '${name}' already exists, reusing."
    else
        ${CLI} keys generate "${name}" --network "${NETWORK}" 2>/dev/null
        ${CLI} keys fund "${name}" --network "${NETWORK}" 2>/dev/null || true
        success "Generated and funded identity: ${name}"
    fi
done

# ── Step 1: Register 5 sample agents ────────────────────────────────────────
printf "\n${CYAN}── Registering Sample Agents ───────────────────────────${NC}\n\n"

# Agent 1: translator-bot - high-performing translation agent
AGENT1_ADDR=$(${CLI} keys address translator-bot)
info "Registering translator-bot (high-performing translation agent)..."
${CLI} contract invoke \
    --id "${REGISTRY}" \
    --network "${NETWORK}" \
    --source translator-bot \
    -- register_agent \
    --owner "${AGENT1_ADDR}" \
    --agent_address "${AGENT1_ADDR}" \
    --metadata_uri "https://example.com/agents/translator-bot.json" \
    --capabilities '["translation","content_gen"]' \
    --initial_stake 5000000000 \
    && success "Registered translator-bot (500 XLM stake)" \
    || warn "translator-bot may already be registered"

# Agent 2: code-reviewer - reliable code review agent
AGENT2_ADDR=$(${CLI} keys address code-reviewer)
info "Registering code-reviewer (reliable code review agent)..."
${CLI} contract invoke \
    --id "${REGISTRY}" \
    --network "${NETWORK}" \
    --source code-reviewer \
    -- register_agent \
    --owner "${AGENT2_ADDR}" \
    --agent_address "${AGENT2_ADDR}" \
    --metadata_uri "https://example.com/agents/code-reviewer.json" \
    --capabilities '["code_review","data_analysis"]' \
    --initial_stake 3000000000 \
    && success "Registered code-reviewer (300 XLM stake)" \
    || warn "code-reviewer may already be registered"

# Agent 3: data-cruncher - new agent with minimal history
AGENT3_ADDR=$(${CLI} keys address data-cruncher)
info "Registering data-cruncher (new agent, minimal history)..."
${CLI} contract invoke \
    --id "${REGISTRY}" \
    --network "${NETWORK}" \
    --source data-cruncher \
    -- register_agent \
    --owner "${AGENT3_ADDR}" \
    --agent_address "${AGENT3_ADDR}" \
    --metadata_uri "https://example.com/agents/data-cruncher.json" \
    --capabilities '["data_analysis"]' \
    --initial_stake 1000000000 \
    && success "Registered data-cruncher (100 XLM stake, minimum)" \
    || warn "data-cruncher may already be registered"

# Agent 4: web-scraper - moderate performer with some issues
AGENT4_ADDR=$(${CLI} keys address web-scraper)
info "Registering web-scraper (moderate performer, some issues)..."
${CLI} contract invoke \
    --id "${REGISTRY}" \
    --network "${NETWORK}" \
    --source web-scraper \
    -- register_agent \
    --owner "${AGENT4_ADDR}" \
    --agent_address "${AGENT4_ADDR}" \
    --metadata_uri "https://example.com/agents/web-scraper.json" \
    --capabilities '["web_scraping","data_analysis"]' \
    --initial_stake 2000000000 \
    && success "Registered web-scraper (200 XLM stake)" \
    || warn "web-scraper may already be registered"

# Agent 5: content-writer - high-volume content agent
AGENT5_ADDR=$(${CLI} keys address content-writer)
info "Registering content-writer (high-volume content agent)..."
${CLI} contract invoke \
    --id "${REGISTRY}" \
    --network "${NETWORK}" \
    --source content-writer \
    -- register_agent \
    --owner "${AGENT5_ADDR}" \
    --agent_address "${AGENT5_ADDR}" \
    --metadata_uri "https://example.com/agents/content-writer.json" \
    --capabilities '["content_gen","translation"]' \
    --initial_stake 4000000000 \
    && success "Registered content-writer (400 XLM stake)" \
    || warn "content-writer may already be registered"

# ── Step 2: Record mock transactions ────────────────────────────────────────
printf "\n${CYAN}── Recording Mock Transactions ─────────────────────────${NC}\n\n"

# A deterministic 32-byte hash for use as receipt hashes
MOCK_HASH="0000000000000000000000000000000000000000000000000000000000000001"

record_tx() {
    local agent_id="$1"
    local counterparty="$2"
    local amount="$3"
    local success_val="$4"
    local hash_suffix="$5"
    local hash="${MOCK_HASH:0:-${#hash_suffix}}${hash_suffix}"

    ${CLI} contract invoke \
        --id "${REPUTATION}" \
        --network "${NETWORK}" \
        --source default \
        -- record_transaction \
        --caller "${ADMIN_ADDRESS}" \
        --agent_id "${agent_id}" \
        --counterparty "${counterparty}" \
        --amount "${amount}" \
        --success "${success_val}" \
        --receipt_hash "${hash}" \
        2>/dev/null
}

# translator-bot (agent 0): 10 successful transactions
info "Recording transactions for translator-bot (agent 0)..."
for i in $(seq 1 10); do
    record_tx 0 "${AGENT2_ADDR}" "500000000" "true" "a${i}" \
        && printf "." || printf "x"
done
printf "\n"
success "Recorded 10 successful transactions for translator-bot"

# code-reviewer (agent 1): 8 successful, 1 failed
info "Recording transactions for code-reviewer (agent 1)..."
for i in $(seq 1 8); do
    record_tx 1 "${AGENT1_ADDR}" "300000000" "true" "b${i}" \
        && printf "." || printf "x"
done
record_tx 1 "${AGENT1_ADDR}" "300000000" "false" "b9" \
    && printf "." || printf "x"
printf "\n"
success "Recorded 9 transactions for code-reviewer (8 success, 1 failure)"

# data-cruncher (agent 2): 2 successful transactions (new agent)
info "Recording transactions for data-cruncher (agent 2)..."
for i in $(seq 1 2); do
    record_tx 2 "${AGENT1_ADDR}" "100000000" "true" "c${i}" \
        && printf "." || printf "x"
done
printf "\n"
success "Recorded 2 successful transactions for data-cruncher"

# web-scraper (agent 3): 6 successful, 3 failed
info "Recording transactions for web-scraper (agent 3)..."
for i in $(seq 1 6); do
    record_tx 3 "${AGENT1_ADDR}" "200000000" "true" "d${i}" \
        && printf "." || printf "x"
done
for i in $(seq 7 9); do
    record_tx 3 "${AGENT1_ADDR}" "200000000" "false" "d${i}" \
        && printf "." || printf "x"
done
printf "\n"
success "Recorded 9 transactions for web-scraper (6 success, 3 failure)"

# content-writer (agent 4): 15 successful transactions
info "Recording transactions for content-writer (agent 4)..."
for i in $(seq 10 24); do
    record_tx 4 "${AGENT2_ADDR}" "400000000" "true" "e${i}" \
        && printf "." || printf "x"
done
printf "\n"
success "Recorded 15 successful transactions for content-writer"

# ── Step 3: Generate attestations ────────────────────────────────────────────
printf "\n${CYAN}── Generating Attestations ─────────────────────────────${NC}\n\n"

DATA_HASH="0000000000000000000000000000000000000000000000000000000000000099"

# code-reviewer attests to translator-bot's quality
info "code-reviewer attests translator-bot quality..."
${CLI} contract invoke \
    --id "${REGISTRY}" \
    --network "${NETWORK}" \
    --source code-reviewer \
    -- add_attestation \
    --agent_id 0 \
    --attester "${AGENT2_ADDR}" \
    --attestation_type "QualityReview" \
    --data_hash "${DATA_HASH}" \
    && success "Attestation: code-reviewer -> translator-bot (QualityReview)" \
    || warn "Attestation may have failed"

# translator-bot attests to code-reviewer with a peer endorsement
info "translator-bot endorses code-reviewer..."
${CLI} contract invoke \
    --id "${REGISTRY}" \
    --network "${NETWORK}" \
    --source translator-bot \
    -- add_attestation \
    --agent_id 1 \
    --attester "${AGENT1_ADDR}" \
    --attestation_type "PeerEndorsement" \
    --data_hash "${DATA_HASH}" \
    && success "Attestation: translator-bot -> code-reviewer (PeerEndorsement)" \
    || warn "Attestation may have failed"

# content-writer attests translator-bot transaction success
info "content-writer attests translator-bot transaction..."
${CLI} contract invoke \
    --id "${REGISTRY}" \
    --network "${NETWORK}" \
    --source content-writer \
    -- add_attestation \
    --agent_id 0 \
    --attester "${AGENT5_ADDR}" \
    --attestation_type "TransactionSuccess" \
    --data_hash "${DATA_HASH}" \
    && success "Attestation: content-writer -> translator-bot (TransactionSuccess)" \
    || warn "Attestation may have failed"

# admin does a security audit attestation on content-writer
info "admin security audit on content-writer..."
${CLI} contract invoke \
    --id "${REGISTRY}" \
    --network "${NETWORK}" \
    --source default \
    -- add_attestation \
    --agent_id 4 \
    --attester "${ADMIN_ADDRESS}" \
    --attestation_type "SecurityAudit" \
    --data_hash "${DATA_HASH}" \
    && success "Attestation: admin -> content-writer (SecurityAudit)" \
    || warn "Attestation may have failed"

# ── Step 4: File a sample dispute ────────────────────────────────────────────
printf "\n${CYAN}── Filing Sample Dispute ───────────────────────────────${NC}\n\n"

TX_HASH="0000000000000000000000000000000000000000000000000000000000000042"
EVIDENCE_HASH="0000000000000000000000000000000000000000000000000000000000000077"

info "translator-bot files a PoorQuality claim against web-scraper (agent 3)..."
${CLI} contract invoke \
    --id "${DISPUTE}" \
    --network "${NETWORK}" \
    --source translator-bot \
    -- file_claim \
    --claimant "${AGENT1_ADDR}" \
    --agent_id 3 \
    --transaction_hash "${TX_HASH}" \
    --claim_type "PoorQuality" \
    --evidence_hash "${EVIDENCE_HASH}" \
    && success "Dispute filed: translator-bot vs web-scraper (PoorQuality)" \
    || warn "Dispute filing may have failed"

info "web-scraper responds to the claim..."
RESPONSE_HASH="0000000000000000000000000000000000000000000000000000000000000088"
${CLI} contract invoke \
    --id "${DISPUTE}" \
    --network "${NETWORK}" \
    --source web-scraper \
    -- respond_to_claim \
    --claim_id 0 \
    --responder "${AGENT4_ADDR}" \
    --response_hash "${RESPONSE_HASH}" \
    && success "web-scraper responded to claim" \
    || warn "Response may have failed"

# ── Summary ──────────────────────────────────────────────────────────────────
printf "\n${CYAN}═══════════════════════════════════════════════════════${NC}\n"
printf "${GREEN}  Testnet Seeding Complete${NC}\n"
printf "${CYAN}═══════════════════════════════════════════════════════${NC}\n\n"

printf "Agents created:\n"
printf "  0: translator-bot  - 500 XLM stake, 10 txns (100%% success), 2 attestations\n"
printf "  1: code-reviewer   - 300 XLM stake,  9 txns (89%% success),  1 attestation\n"
printf "  2: data-cruncher   - 100 XLM stake,  2 txns (100%% success), 0 attestations\n"
printf "  3: web-scraper     - 200 XLM stake,  9 txns (67%% success),  0 attestations\n"
printf "  4: content-writer  - 400 XLM stake, 15 txns (100%% success), 1 attestation\n"
printf "\n"
printf "Dispute filed:\n"
printf "  Claim 0: translator-bot vs web-scraper (PoorQuality, Responded)\n"
printf "\n"
info "Use 'stellar contract invoke' to interact with agents on testnet."
printf "\n"
