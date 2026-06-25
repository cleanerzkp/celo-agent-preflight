export interface PreflightTarget {
  readonly chain: "celo" | "celo-sepolia";
  readonly agentId?: string;
  readonly metadataUrl?: string;
  readonly registry?: string;
}

export interface PreflightEngineInfo {
  readonly name: "celo-agent-preflight";
  readonly version: "0.1.0";
}

export const preflightEngineInfo: PreflightEngineInfo = {
  name: "celo-agent-preflight",
  version: "0.1.0"
};
