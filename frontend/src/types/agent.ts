export interface Agent {
  id: number;
  owner: string;
  agentAddress: string;
  metadataUri: string;
  capabilities: string[];
  trustScore: number;
  totalTransactions: number;
  successfulTransactions: number;
  totalVolume: string;
  registeredAt: number;
  stake: string;
  status: AgentStatus;
}

export type AgentStatus = "active" | "suspended" | "deregistering";

export interface Attestation {
  id: number;
  agentId: number;
  attester: string;
  attestationType: AttestationType;
  dataHash: string;
  timestamp: number;
  revoked: boolean;
}

export type AttestationType =
  | "transaction_success"
  | "transaction_failure"
  | "quality_review"
  | "security_audit"
  | "peer_endorsement";

export interface Capability {
  id: string;
  name: string;
  category: CapabilityCategory;
  description: string;
}

export type CapabilityCategory = "text" | "image" | "data" | "payment";

export const CAPABILITIES: Capability[] = [
  { id: "text-generation", name: "Text Generation", category: "text", description: "Generate natural language text and content" },
  { id: "text-analysis", name: "Text Analysis", category: "text", description: "Analyze and extract insights from text" },
  { id: "translation", name: "Translation", category: "text", description: "Translate between languages" },
  { id: "image-generation", name: "Image Generation", category: "image", description: "Generate images from prompts" },
  { id: "image-recognition", name: "Image Recognition", category: "image", description: "Identify objects and scenes in images" },
  { id: "data-retrieval", name: "Data Retrieval", category: "data", description: "Fetch and aggregate data from sources" },
  { id: "data-analysis", name: "Data Analysis", category: "data", description: "Analyze datasets and produce insights" },
  { id: "web-scraping", name: "Web Scraping", category: "data", description: "Extract structured data from web pages" },
  { id: "payment-processing", name: "Payment Processing", category: "payment", description: "Process payments and transfers" },
  { id: "invoicing", name: "Invoicing", category: "payment", description: "Generate and manage invoices" },
];
