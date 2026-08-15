import { getNetwork, NETWORKS } from "./stellar";

interface PasskeyKit {
  networkPassphrase: string;
  rpcUrl: string;
  initialized: boolean;
}

let passkeyKit: PasskeyKit | null = null;

export function initPasskeyKit(): PasskeyKit {
  const network = getNetwork();
  const config = NETWORKS[network];

  passkeyKit = {
    networkPassphrase: config.networkPassphrase,
    rpcUrl: config.rpcUrl,
    initialized: true,
  };

  console.log("Passkey kit initialized for network:", network);
  return passkeyKit;
}

export async function createPasskey(name: string): Promise<string> {
  if (!passkeyKit?.initialized) {
    initPasskeyKit();
  }

  console.log(`Creating passkey with name: ${name}`);

  // In production, this would use the WebAuthn API via passkey-kit to:
  // 1. Generate a new credential
  // 2. Deploy a smart wallet contract
  // 3. Return the contract's public key (Stellar address)
  // For now, generate a mock Stellar address
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let address = "G";
  for (let i = 1; i < 56; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }

  console.log(`Passkey created. Mock address: ${address}`);
  return address;
}

export async function signWithPasskey(xdr: string): Promise<string> {
  if (!passkeyKit?.initialized) {
    initPasskeyKit();
  }

  console.log("Signing transaction XDR with passkey");

  // In production, this would:
  // 1. Prompt the user for biometric authentication
  // 2. Sign the transaction using the stored passkey credential
  // 3. Return the signed XDR
  // For now, return the input XDR as-is (mock signed)
  return xdr;
}

export async function getPasskeyAddress(): Promise<string | null> {
  if (!passkeyKit?.initialized) {
    console.log("Passkey kit not initialized, returning null");
    return null;
  }

  // In production, this would look up the address associated with the
  // stored passkey credential from the browser's credential store.
  // For now, check localStorage for a previously stored address.
  if (typeof window !== "undefined") {
    return localStorage.getItem("agenttrust_passkey_address");
  }

  return null;
}
