export type Erc8004ServiceType =
  | "a2a"
  | "mcp"
  | "oasf"
  | "did"
  | "ens"
  | "email"
  | "x402"
  | "wallet"
  | "other";

export interface Erc8004ServiceEndpoint {
  readonly type: Erc8004ServiceType | string;
  readonly url?: string;
  readonly address?: string;
  readonly chainId?: number;
}

export interface Erc8004RegistrationRef {
  readonly agentRegistry: string;
  readonly agentId: string;
}

export interface NormalizedAgentMetadata {
  readonly type?: string;
  readonly name?: string;
  readonly description?: string;
  readonly image?: string;
  readonly active?: boolean;
  readonly services: readonly Erc8004ServiceEndpoint[];
  readonly registrations: readonly Erc8004RegistrationRef[];
  readonly supportedTrust: readonly string[];
  readonly x402Support?: boolean;
  readonly sourceShape: "services" | "endpoints" | "mixed" | "unknown";
}

export interface ExpectedAgentRegistration {
  readonly agentRegistry: string;
  readonly agentId: string;
}

export interface MetadataIssue {
  readonly id: string;
  readonly severity: "warn" | "fail";
  readonly message: string;
}

export interface MetadataValidationResult {
  readonly metadata: NormalizedAgentMetadata;
  readonly issues: readonly MetadataIssue[];
}
