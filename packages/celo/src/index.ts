import { createPublicClient, http, type Address, type Chain } from "viem";
import { celo, celoSepolia } from "viem/chains";

export type PreflightChainKey = "celo" | "celo-sepolia";

export interface CeloNetworkConfig {
  readonly key: PreflightChainKey;
  readonly chain: Chain;
  readonly rpcUrl: string;
  readonly explorerBaseUrl: string;
  readonly identityRegistry: Address;
  readonly reputationRegistry: Address;
}

export const CELO_MAINNET_IDENTITY_REGISTRY =
  "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const satisfies Address;
export const CELO_MAINNET_REPUTATION_REGISTRY =
  "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63" as const satisfies Address;
export const CELO_SEPOLIA_IDENTITY_REGISTRY =
  "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const satisfies Address;
export const CELO_SEPOLIA_REPUTATION_REGISTRY =
  "0x8004B663056A597Dffe9eCcC1965A193B7388713" as const satisfies Address;

export const CELO_NETWORKS = {
  celo: {
    key: "celo",
    chain: celo,
    rpcUrl: process.env.CELO_MAINNET_RPC_URL ??
      process.env.CELO_RPC_URL ??
      "https://forno.celo.org",
    explorerBaseUrl: "https://celoscan.io",
    identityRegistry: CELO_MAINNET_IDENTITY_REGISTRY,
    reputationRegistry: CELO_MAINNET_REPUTATION_REGISTRY
  },
  "celo-sepolia": {
    key: "celo-sepolia",
    chain: celoSepolia,
    rpcUrl:
      process.env.CELO_SEPOLIA_RPC_URL ??
      process.env.CELO_TESTNET_RPC_URL ??
      "https://forno.celo-sepolia.celo-testnet.org",
    explorerBaseUrl: "https://sepolia.celoscan.io",
    identityRegistry: CELO_SEPOLIA_IDENTITY_REGISTRY,
    reputationRegistry: CELO_SEPOLIA_REPUTATION_REGISTRY
  }
} as const satisfies Record<PreflightChainKey, CeloNetworkConfig>;

export function getCeloNetwork(key: PreflightChainKey): CeloNetworkConfig {
  return CELO_NETWORKS[key];
}

export function createCeloPublicClient(key: PreflightChainKey) {
  const network = getCeloNetwork(key);

  return createPublicClient({
    chain: network.chain,
    transport: http(network.rpcUrl)
  });
}

export function formatExplorerTxUrl(
  key: PreflightChainKey,
  txHash: `0x${string}`
): string {
  return `${getCeloNetwork(key).explorerBaseUrl}/tx/${txHash}`;
}
