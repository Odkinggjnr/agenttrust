export const STROOPS_PER_XLM = 10_000_000;

export const MAX_SCORE = 10_000;

export const TIER_THRESHOLDS = {
  unverified: 0,
  emerging: 2_001,
  established: 5_001,
  trusted: 7_501,
  elite: 9_001,
} as const;

export const MIN_STAKE_XLM = 100;
export const MIN_STAKE_STROOPS = MIN_STAKE_XLM * STROOPS_PER_XLM;

export const WITHDRAWAL_COOLDOWN_SECONDS = 604_800; // 7 days
export const WITHDRAWAL_COOLDOWN_DAYS = 7;

export const DECAY_RATE_PERCENT = 2;
export const DECAY_PERIOD_SECONDS = 604_800; // 1 week

export const SLASH_RATE_DISPUTE = 0.1; // 10%
export const SLASH_RATE_FRAUD = 0.5; // 50%

export const STELLAR_NETWORKS = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    rpcUrl: "https://soroban-testnet.stellar.org",
    horizonUrl: "https://horizon-testnet.stellar.org",
  },
  mainnet: {
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    rpcUrl: "https://soroban-rpc.stellar.org",
    horizonUrl: "https://horizon.stellar.org",
  },
} as const;

export const SCORE_WEIGHTS = {
  successRate: 0.4,
  volume: 0.2,
  accountAge: 0.1,
  attestations: 0.15,
  stake: 0.15,
} as const;
