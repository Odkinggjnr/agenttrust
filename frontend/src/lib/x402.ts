export interface X402Receipt {
  payer: string;
  payee: string;
  amount: string;
  resource: string;
  timestamp: number;
  facilitator: string;
  facilitatorSignature: string;
}

export function parseReceipt(data: unknown): X402Receipt {
  if (!data || typeof data !== "object") {
    throw new Error("Receipt data must be a non-null object");
  }

  const obj = data as Record<string, unknown>;

  const requiredFields: (keyof X402Receipt)[] = [
    "payer",
    "payee",
    "amount",
    "resource",
    "timestamp",
    "facilitator",
    "facilitatorSignature",
  ];

  for (const field of requiredFields) {
    if (!(field in obj)) {
      throw new Error(`Missing required receipt field: ${field}`);
    }
  }

  if (typeof obj.payer !== "string" || !obj.payer) {
    throw new Error("Receipt payer must be a non-empty string");
  }
  if (typeof obj.payee !== "string" || !obj.payee) {
    throw new Error("Receipt payee must be a non-empty string");
  }
  if (typeof obj.amount !== "string" || !obj.amount) {
    throw new Error("Receipt amount must be a non-empty string");
  }
  if (typeof obj.resource !== "string" || !obj.resource) {
    throw new Error("Receipt resource must be a non-empty string");
  }
  if (typeof obj.timestamp !== "number" || !Number.isFinite(obj.timestamp)) {
    throw new Error("Receipt timestamp must be a finite number");
  }
  if (typeof obj.facilitator !== "string" || !obj.facilitator) {
    throw new Error("Receipt facilitator must be a non-empty string");
  }
  if (typeof obj.facilitatorSignature !== "string" || !obj.facilitatorSignature) {
    throw new Error("Receipt facilitatorSignature must be a non-empty string");
  }

  return {
    payer: obj.payer,
    payee: obj.payee,
    amount: obj.amount,
    resource: obj.resource,
    timestamp: obj.timestamp,
    facilitator: obj.facilitator,
    facilitatorSignature: obj.facilitatorSignature,
  };
}

export function validateReceipt(receipt: X402Receipt): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!receipt.payer || receipt.payer.length < 10) {
    errors.push("Payer address is missing or too short");
  }

  if (!receipt.payee || receipt.payee.length < 10) {
    errors.push("Payee address is missing or too short");
  }

  if (receipt.payer === receipt.payee) {
    errors.push("Payer and payee cannot be the same address");
  }

  const amount = parseFloat(receipt.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push("Amount must be a positive number");
  }

  if (!receipt.resource) {
    errors.push("Resource identifier is required");
  }

  const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 3600;
  const oneHourAhead = now + 3600;

  if (receipt.timestamp < oneHourAgo) {
    errors.push("Receipt timestamp is more than 1 hour in the past");
  }

  if (receipt.timestamp > oneHourAhead) {
    errors.push("Receipt timestamp is more than 1 hour in the future");
  }

  if (!receipt.facilitator) {
    errors.push("Facilitator address is required");
  }

  if (!receipt.facilitatorSignature) {
    errors.push("Facilitator signature is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function formatReceiptForContract(receipt: X402Receipt): {
  payer: Buffer;
  payee: Buffer;
  amount: bigint;
  resource: Buffer;
  timestamp: bigint;
  facilitator: Buffer;
  signature: Buffer;
} {
  // Convert string addresses and values to contract-compatible types
  // Soroban contracts expect Buffers for addresses and byte arrays,
  // and BigInts for numeric values
  return {
    payer: Buffer.from(receipt.payer),
    payee: Buffer.from(receipt.payee),
    amount: BigInt(Math.round(parseFloat(receipt.amount) * 10_000_000)), // Convert to stroops
    resource: Buffer.from(receipt.resource),
    timestamp: BigInt(receipt.timestamp),
    facilitator: Buffer.from(receipt.facilitator),
    signature: Buffer.from(receipt.facilitatorSignature, "hex"),
  };
}
