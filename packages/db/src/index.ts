export const AGENTPROOF_CORE_MIGRATION_ID = "0001_agentproof_core" as const;

export const AGENTPROOF_MIGRATIONS = [
  {
    id: AGENTPROOF_CORE_MIGRATION_ID,
    path: "packages/db/migrations/0001_agentproof_core.sql"
  }
] as const;

export const AGENTPROOF_TABLES = [
  "agents",
  "scan_runs",
  "check_results",
  "endpoints",
  "endpoint_samples",
  "attestations",
  "indexer_checkpoints",
  "contract_evidence"
] as const;

export const AGENTPROOF_QUEUE_NAMES = {
  indexCeloErc8004: "index:celo:erc8004",
  indexCeloAgentProofAttestor: "index:celo:agentproof-attestor",
  scanAgent: "scan:agent",
  scanEndpoint: "scan:endpoint",
  scanX402: "scan:x402",
  scanMcp: "scan:mcp",
  scanA2a: "scan:a2a",
  scanSelf: "scan:self",
  scanContracts: "scan:contracts",
  reportPublish: "report:publish",
  reportAttest: "report:attest",
  reportRefreshStale: "report:refresh-stale"
} as const;

export type AgentProofTableName = (typeof AGENTPROOF_TABLES)[number];
export type AgentProofQueueName =
  (typeof AGENTPROOF_QUEUE_NAMES)[keyof typeof AGENTPROOF_QUEUE_NAMES];

export type AgentProofChainKey = "celo" | "celo-sepolia";

export interface ScanAgentJob {
  readonly chain: AgentProofChainKey;
  readonly agentId?: string;
  readonly metadataUrl?: string;
  readonly registry?: `0x${string}`;
  readonly probeEndpoints?: boolean;
  readonly maxEndpointProbes?: number;
  readonly requestedBy?: string;
}

export interface PublishReportJob {
  readonly reportHash: `0x${string}`;
  readonly reportUri: string;
}
