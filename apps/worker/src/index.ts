import { pathToFileURL } from "node:url";

import {
  AGENTPROOF_QUEUE_NAMES,
  type ScanAgentJob
} from "@celo-agent-preflight/db";
import {
  preflightEngineInfo,
  runPreflight,
  type PreflightTarget,
  type RunPreflightOptions
} from "@celo-agent-preflight/preflight-core";
import {
  createLocalReportStorage,
  defaultLocalReportDir,
  type ReportStorage
} from "@celo-agent-preflight/storage";
import type { Address } from "viem";

export interface WorkerConfig {
  readonly reportDir: string;
  readonly reportPublicBaseUrl: string;
  readonly scanTimeoutMs?: number;
  readonly maxEndpointProbes?: number;
  readonly probeEndpoints: boolean;
}

export interface ScanAgentResult {
  readonly queueName: typeof AGENTPROOF_QUEUE_NAMES.scanAgent;
  readonly chain: ScanAgentJob["chain"];
  readonly agentId?: string;
  readonly metadataUrl?: string;
  readonly status: string;
  readonly score: number;
  readonly reportHash: `0x${string}`;
  readonly reportUri: string;
  readonly startedAt: string;
  readonly completedAt: string;
}

interface ScanAgentDependencies {
  readonly config?: WorkerConfig;
  readonly storage?: ReportStorage;
}

export async function runScanAgentJob(
  job: ScanAgentJob,
  dependencies: ScanAgentDependencies = {}
): Promise<ScanAgentResult> {
  if (!job.agentId && !job.metadataUrl) {
    throw new Error("scan:agent requires agentId or metadataUrl.");
  }

  const config = dependencies.config ?? readWorkerConfig();
  const storage = dependencies.storage ?? createLocalReportStorage({
    reportDir: config.reportDir,
    publicBaseUrl: config.reportPublicBaseUrl
  });
  const startedAt = new Date();
  const report = await runPreflight(buildTarget(job), buildRunOptions(job, config));
  const stored = await storage.putReport(report);
  const completedAt = new Date();

  return {
    queueName: AGENTPROOF_QUEUE_NAMES.scanAgent,
    chain: job.chain,
    ...(job.agentId ? { agentId: job.agentId } : {}),
    ...(job.metadataUrl ? { metadataUrl: job.metadataUrl } : {}),
    status: stored.report.score.label,
    score: stored.report.score.value,
    reportHash: stored.reportHash,
    reportUri: stored.reportUri,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString()
  };
}

export function readWorkerConfig(
  env: NodeJS.ProcessEnv = process.env
): WorkerConfig {
  const scanTimeoutMs = numberFromEnv(env.SCAN_TIMEOUT_MS);
  const maxEndpointProbes = numberFromEnv(env.MAX_ENDPOINTS_PER_AGENT);

  return {
    reportDir: env.AGENTPROOF_REPORT_DIR ??
      env.REPORT_STORAGE_LOCAL_DIR ??
      env.PREFLIGHT_REPORT_DIR ??
      defaultLocalReportDir(),
    reportPublicBaseUrl: env.REPORT_STORAGE_PUBLIC_BASE_URL ??
      env.NEXT_PUBLIC_REPORT_BASE_URL ??
      "/reports",
    ...(scanTimeoutMs === undefined ? {} : { scanTimeoutMs }),
    ...(maxEndpointProbes === undefined ? {} : { maxEndpointProbes }),
    probeEndpoints: env.PROBE_ENDPOINTS === "false" ? false : true
  };
}

export function parseScanTargets(tokens: readonly string[]): readonly ScanAgentJob[] {
  return tokens
    .filter((token) => token !== "--" && token !== "--once" && token !== "--scan")
    .map(parseScanTargetToken);
}

export async function runCli(tokens: readonly string[] = process.argv.slice(2)): Promise<void> {
  const targets = parseScanTargets(tokens.length > 0
    ? tokens
    : splitList(process.env.AGENTPROOF_WORKER_SCAN_TARGETS));

  if (targets.length === 0) {
    console.log(JSON.stringify({
      worker: preflightEngineInfo.name,
      version: preflightEngineInfo.version,
      mode: "idle",
      queueContract: Object.values(AGENTPROOF_QUEUE_NAMES),
      hint: "Pass targets like celo:2 or set AGENTPROOF_WORKER_SCAN_TARGETS=celo:2,celo:17."
    }, null, 2));
    return;
  }

  const config = readWorkerConfig();
  const storage = createLocalReportStorage({
    reportDir: config.reportDir,
    publicBaseUrl: config.reportPublicBaseUrl
  });

  for (const target of targets) {
    const result = await runScanAgentJob(target, { config, storage });

    console.log(JSON.stringify(result, null, 2));
  }
}

function buildTarget(job: ScanAgentJob): PreflightTarget {
  return {
    chain: job.chain,
    ...(job.agentId ? { agentId: job.agentId } : {}),
    ...(job.metadataUrl ? { metadataUrl: job.metadataUrl } : {}),
    ...(job.registry ? { registry: job.registry as Address } : {})
  };
}

function buildRunOptions(
  job: ScanAgentJob,
  config: WorkerConfig
): RunPreflightOptions {
  return {
    probeEndpoints: job.probeEndpoints ?? config.probeEndpoints,
    ...(job.maxEndpointProbes === undefined && config.maxEndpointProbes === undefined
      ? {}
      : { maxEndpointProbes: job.maxEndpointProbes ?? config.maxEndpointProbes }),
    ...(config.scanTimeoutMs === undefined ? {} : { timeoutMs: config.scanTimeoutMs })
  };
}

function parseScanTargetToken(token: string): ScanAgentJob {
  if (token.startsWith("http://") || token.startsWith("https://") || token.startsWith("ipfs://")) {
    return {
      chain: "celo",
      metadataUrl: token
    };
  }

  const [chain, agentId, registry] = token.split(":");

  if (chain !== "celo" && chain !== "celo-sepolia") {
    throw new Error(`Scan target must start with celo: or celo-sepolia:, got ${token}.`);
  }

  if (!agentId) {
    throw new Error(`Scan target is missing agentId: ${token}.`);
  }

  return {
    chain,
    agentId,
    ...(registry ? { registry: registry as `0x${string}` } : {})
  };
}

function splitList(input: string | undefined): string[] {
  return input
    ? input.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
}

function numberFromEnv(input: string | undefined): number | undefined {
  if (!input) {
    return undefined;
  }

  const value = Number(input);

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Expected a non-negative integer env value, got ${input}.`);
  }

  return value;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
