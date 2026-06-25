import type { Address } from "viem";

export const CELO_X402_TOKENS = {
  USDC: {
    address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as Address,
    decimals: 6
  },
  USDT: {
    address: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e" as Address,
    decimals: 6
  },
  USDm: {
    address: "0x765DE816845861e75A25fCA122bb6898B8B1282a" as Address,
    decimals: 18
  }
} as const;

export type X402ProbeMode = "probe-only" | "owned-settlement-demo";

export interface X402ProbeSummary {
  readonly mode: X402ProbeMode;
  readonly endpoint: string;
  readonly statusCode?: number;
  readonly paymentRequired: boolean;
  readonly network?: "celo" | "celo-sepolia" | string;
}
