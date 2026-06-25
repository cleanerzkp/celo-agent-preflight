export type ReadyListStatus =
  | "ready"
  | "ready_with_warnings"
  | "not_ready"
  | "stale"
  | "unverified";

export interface ReadyListEntry {
  readonly chainId: number;
  readonly registry: string;
  readonly agentId: string;
  readonly owner?: string;
  readonly status: ReadyListStatus;
  readonly score: number;
  readonly latestReportHash: `0x${string}`;
  readonly latestReportUrl: string;
  readonly attestationTx?: `0x${string}`;
  readonly lastScanAt: string;
}
