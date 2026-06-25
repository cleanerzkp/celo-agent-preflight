export type SelfAgentIdStatus =
  | "verified"
  | "claimed"
  | "missing"
  | "not_applicable"
  | "error";

export interface SelfAgentIdEvidence {
  readonly status: SelfAgentIdStatus;
  readonly agentId?: string;
  readonly wallet?: string;
  readonly evidenceUrl?: string;
  readonly checkedAt: string;
}
