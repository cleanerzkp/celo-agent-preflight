import type { PreflightChainKey } from "@celo-agent-preflight/celo";
import type {
  SafeFetchOptions,
  SafeFetchResult
} from "@celo-agent-preflight/erc8004";
import type { Address } from "viem";

export interface RegistryReadClient {
  readonly getBlockNumber: () => Promise<bigint>;
  readonly readContract: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface PreflightTarget {
  readonly chain: PreflightChainKey;
  readonly agentId?: string;
  readonly metadataUrl?: string;
  readonly registry?: Address;
}

export interface PreflightEngineInfo {
  readonly name: "celo-agent-preflight";
  readonly version: "0.1.0";
}

export interface RunPreflightOptions extends SafeFetchOptions {
  readonly client?: RegistryReadClient;
  readonly commit?: string;
  readonly generatedAt?: string | Date;
  readonly ipfsGatewayBaseUrl?: string;
  readonly maxEndpointProbes?: number;
  readonly probeEndpoints?: boolean;
  readonly fetchText?: (
    url: string,
    options?: SafeFetchOptions
  ) => Promise<SafeFetchResult>;
}

export const preflightEngineInfo: PreflightEngineInfo = {
  name: "celo-agent-preflight",
  version: "0.1.0"
};
