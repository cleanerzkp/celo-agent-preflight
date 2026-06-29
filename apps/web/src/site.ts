/**
 * Single source of truth for site identity, links, and onchain references.
 * Consumed by the header, footer, root metadata, OG images, and sitemap so
 * the product name and verifiable addresses never drift again.
 */

function clean(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.includes("YOUR_ORG") || trimmed.includes("localhost")) {
    return undefined;
  }
  return trimmed;
}

const ERC8004_IDENTITY_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
const ERC8004_REPUTATION_REGISTRY = "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";

export const SITE = {
  name: "Celo Agent Preflight",
  shortName: "Preflight",
  tagline: "Verify an AI agent before you trust it.",
  description:
    "Celo-native preflight checks for AI agents: verify identity, live endpoints, payment routes, and onchain activity, then get a hash-verifiable report. Built on ERC-8004, MCP/A2A, x402, and Self.",
  url:
    clean(process.env.NEXT_PUBLIC_SITE_URL) ??
    clean(process.env.NEXT_PUBLIC_APP_URL) ??
    "https://celo-agent-preflight.vercel.app",
  schemaVersion: "preflight.report.v0.1",
  chain: { name: "Celo mainnet", id: 42220 },
  contracts: {
    erc8004Identity: ERC8004_IDENTITY_REGISTRY,
    erc8004Reputation: ERC8004_REPUTATION_REGISTRY,
  },
  links: {
    github: clean(process.env.NEXT_PUBLIC_GITHUB_REPO_URL),
    docs: clean(process.env.NEXT_PUBLIC_DOCS_URL),
    reportsApi: "/api/agents",
  },
  external: {
    celo: "https://celo.org",
    celoBuild: "https://www.celo.org/build",
    self: "https://docs.self.xyz",
    x402: "https://github.com/coinbase/x402",
    mcp: "https://modelcontextprotocol.io",
    a2a: "https://a2aproject.github.io/A2A/",
  },
} as const;

export function celoscanAddress(address: string): string {
  return `https://celoscan.io/address/${address}`;
}

export function celoscanTx(txHash: string, chainId?: number): string {
  if (chainId === 11142220) {
    return `https://sepolia.celoscan.io/tx/${txHash}`;
  }
  return `https://celoscan.io/tx/${txHash}`;
}

export function shortHash(value: string, lead = 8, tail = 6): string {
  if (value.length <= lead + tail + 1) {
    return value;
  }
  return `${value.slice(0, lead)}...${value.slice(-tail)}`;
}
