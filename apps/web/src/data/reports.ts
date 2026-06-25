import type { ReadyListEntry } from "@celo-agent-preflight/readylist";
import {
  attachReportHash,
  type PreflightReport
} from "@celo-agent-preflight/report-schema";

const GENERATED_AT = "2026-06-25T00:00:00.000Z";
const IDENTITY_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
const AGENT_REGISTRY = `eip155:42220:${IDENTITY_REGISTRY}`;
const OWNER = "0x0000000000000000000000000000000000008004";
const AGENT_WALLET = "0x0000000000000000000000000000000000008005";

const reports = [
  attachReportHash({
    schemaVersion: "preflight.report.v0.1",
    generatedAt: GENERATED_AT,
    generator: {
      name: "celo-agent-preflight",
      version: "0.1.0",
      commit: "demo"
    },
    subject: {
      chainId: 42220,
      agentRegistry: AGENT_REGISTRY,
      agentId: "1",
      owner: OWNER,
      agentWallet: AGENT_WALLET,
      metadataURI: "https://agent.example/.well-known/agent.json",
      primaryUrl: "https://agent.example"
    },
    score: {
      value: 92,
      label: "ready"
    },
    checks: [
      {
        id: "erc8004.registry.read",
        category: "erc8004",
        title: "ERC-8004 registry record resolves",
        status: "pass",
        severity: "critical",
        scoreImpact: 0,
        summary: "Identity Registry owner, wallet, and metadata URI resolved at one block.",
        evidence: [
          {
            type: "chain",
            label: "identity registry",
            value: IDENTITY_REGISTRY,
            chainId: 42220,
            address: IDENTITY_REGISTRY,
            blockNumber: 33151234
          }
        ]
      },
      {
        id: "metadata.resolves",
        category: "metadata",
        title: "Metadata resolves to JSON",
        status: "pass",
        severity: "critical",
        scoreImpact: 0,
        summary: "Metadata URI resolved and parsed as JSON.",
        evidence: [
          {
            type: "http",
            label: "metadata document",
            value: "https://agent.example/.well-known/agent.json",
            statusCode: 200,
            fetchedAt: GENERATED_AT
          }
        ]
      },
      {
        id: "mcp.declared",
        category: "mcp",
        title: "MCP endpoint declared",
        status: "pass",
        severity: "medium",
        scoreImpact: 0,
        summary: "Metadata declares 1 MCP service.",
        evidence: [
          {
            type: "url",
            label: "mcp",
            value: "https://agent.example/mcp"
          }
        ]
      },
      {
        id: "x402.endpoint.probe",
        category: "x402",
        title: "x402 endpoint returns payment requirements",
        status: "warn",
        severity: "high",
        scoreImpact: -2,
        summary: "x402 endpoint is declared but settlement proof is pending.",
        remediation: "Return an x402 HTTP 402 response with Celo payment requirements.",
        evidence: [
          {
            type: "x402",
            label: "x402 endpoint",
            value: "https://agent.example/pay",
            statusCode: 402,
            fetchedAt: GENERATED_AT
          }
        ]
      }
    ]
  }),
  attachReportHash({
    schemaVersion: "preflight.report.v0.1",
    generatedAt: GENERATED_AT,
    generator: {
      name: "celo-agent-preflight",
      version: "0.1.0",
      commit: "demo"
    },
    subject: {
      chainId: 42220,
      agentRegistry: AGENT_REGISTRY,
      agentId: "2",
      owner: "0x0000000000000000000000000000000000008010",
      metadataURI: "ipfs://bafybeigdyrzt/agent.json",
      primaryUrl: "https://builder.example"
    },
    score: {
      value: 64,
      label: "not_ready"
    },
    checks: [
      {
        id: "metadata.resolves",
        category: "metadata",
        title: "Metadata resolves to JSON",
        status: "pass",
        severity: "critical",
        scoreImpact: 0,
        summary: "IPFS metadata resolved through the configured gateway.",
        evidence: [
          {
            type: "http",
            label: "metadata document",
            value: "https://ipfs.io/ipfs/bafybeigdyrzt/agent.json",
            statusCode: 200,
            fetchedAt: GENERATED_AT
          }
        ]
      },
      {
        id: "metadata.services.locators",
        category: "metadata",
        title: "Declared services have locators",
        status: "fail",
        severity: "high",
        scoreImpact: -20,
        summary: "A declared MCP service has no URL or address locator.",
        remediation: "Add a url, endpoint, or address to every callable service.",
        evidence: []
      },
      {
        id: "x402.endpoint.probe",
        category: "x402",
        title: "x402 endpoint returns payment requirements",
        status: "skip",
        severity: "info",
        scoreImpact: 0,
        summary: "Skipped because metadata does not declare x402 support.",
        evidence: []
      }
    ]
  })
] as const satisfies readonly PreflightReport[];

export function listReports(): readonly PreflightReport[] {
  return reports;
}

export function listReadyListEntries(): readonly ReadyListEntry[] {
  return reports.map((report) => ({
    chainId: report.subject.chainId,
    registry: report.subject.agentRegistry ?? "metadata-only",
    agentId: report.subject.agentId ?? "metadata-url",
    ...(report.subject.owner ? { owner: report.subject.owner } : {}),
    status: report.score.label === "unknown" ? "unverified" : report.score.label,
    score: report.score.value,
    latestReportHash: report.reportHash as `0x${string}`,
    latestReportUrl: `/reports/${report.reportHash}`,
    lastScanAt: report.generatedAt
  }));
}

export function getReportByHash(hash: string): PreflightReport | undefined {
  return reports.find((report) => report.reportHash?.toLowerCase() === hash.toLowerCase());
}

export function getReportForAgent({
  agentId,
  chainId,
  registry
}: {
  readonly agentId: string;
  readonly chainId: string;
  readonly registry: string;
}): PreflightReport | undefined {
  const normalizedRegistry = registry.toLowerCase();

  return reports.find(
    (report) =>
      String(report.subject.chainId) === chainId &&
      report.subject.agentId === agentId &&
      registryAddress(report.subject.agentRegistry).toLowerCase() === normalizedRegistry
  );
}

export function registryAddress(agentRegistry: string | undefined): string {
  return agentRegistry?.split(":").at(-1) ?? "metadata-only";
}
