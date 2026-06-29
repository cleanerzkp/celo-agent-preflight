import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { join } from "node:path";

import {
  attachReportHash,
  type CheckCategory,
  type CheckStatus,
  type PreflightReport,
  type ReadinessCheck,
  type ReportHash
} from "@celo-agent-preflight/report-schema";

export type ReadyListStatus =
  | "ready"
  | "ready_with_warnings"
  | "not_ready"
  | "stale"
  | "unverified";

export type CapabilityStatus =
  | "pass"
  | "warn"
  | "fail"
  | "skip"
  | "unknown";

export type SelfAgentIdStatus =
  | "verified"
  | "claimed"
  | "missing"
  | "not_applicable"
  | "unknown";

export type ChainHash = `0x${string}`;

export interface ReadyListEntry {
  readonly chainId: number;
  readonly registry: string;
  readonly agentId: string;
  readonly name?: string;
  readonly owner?: string;
  readonly status: ReadyListStatus;
  readonly score: number;
  readonly mcp: CapabilityStatus;
  readonly a2a: CapabilityStatus;
  readonly x402: CapabilityStatus;
  readonly selfAgentId: SelfAgentIdStatus;
  readonly celoActivity: CapabilityStatus;
  readonly latencyMs?: number;
  readonly latestReportHash: ReportHash;
  readonly latestReportUrl: string;
  readonly attestationTx?: ChainHash;
  readonly lastScanAt: string;
  readonly stale: boolean;
  readonly needsRemediation: boolean;
}

export interface ReadyListSummary {
  readonly indexedAgents: number;
  readonly readyAgents: number;
  readonly readyWithWarnings: number;
  readonly notReadyAgents: number;
  readonly reportsGenerated: number;
  readonly celoAttestations: number;
  readonly mcpEndpointsChecked: number;
  readonly a2aEndpointsChecked: number;
  readonly x402EndpointsChecked: number;
  readonly selfAgentIdCoveragePct: number;
  readonly medianEndpointLatencyMs?: number;
  readonly reportsRefreshedLast24h: number;
  readonly staleReports: number;
  readonly needsRemediation: number;
}

export interface ReadyListSnapshot {
  readonly generatedAt: string;
  readonly reports: readonly PreflightReport[];
  readonly entries: readonly ReadyListEntry[];
  readonly summary: ReadyListSummary;
}

export interface ReadyListSnapshotOptions {
  readonly now?: Date | string;
  readonly reportUrlBase?: string;
  readonly staleAfterHours?: number;
}

export interface FileReportCatalogOptions extends ReadyListSnapshotOptions {
  readonly reportDir: string;
}

export interface PersistReportToDirectoryOptions {
  readonly report: PreflightReport;
  readonly reportDir: string;
}

export interface PersistedReport {
  readonly path: string;
  readonly report: PreflightReport & { readonly reportHash: ReportHash };
}

export interface ReportCatalog {
  readonly listReports: () => readonly PreflightReport[];
  readonly getReportByHash: (hash: string) => PreflightReport | undefined;
  readonly getReportForAgent: (
    input: GetReportForAgentInput
  ) => PreflightReport | undefined;
  readonly getSnapshot: (
    options?: ReadyListSnapshotOptions
  ) => ReadyListSnapshot;
}

export interface GetReportForAgentInput {
  readonly agentId: string;
  readonly chainId: string;
  readonly registry: string;
}

export function createFileReportCatalog(
  options: FileReportCatalogOptions
): ReportCatalog {
  return createReportCatalog({
    listReports: () => loadReportsFromDirectory(options.reportDir),
    options
  });
}

export function createInMemoryReportCatalog(
  reports: readonly PreflightReport[],
  options: ReadyListSnapshotOptions = {}
): ReportCatalog {
  return createReportCatalog({
    listReports: () => reports.map((report) => ensureReportHash(report)),
    options
  });
}

export function loadReportsFromDirectory(
  reportDir: string
): readonly PreflightReport[] {
  if (!existsSync(reportDir)) {
    return [];
  }

  const reports: PreflightReport[] = [];

  for (const entry of readdirSync(reportDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .sort((left, right) => left.name.localeCompare(right.name))) {
    const reportPath = join(reportDir, entry.name);

    try {
      reports.push(ensureReportHash(JSON.parse(readFileSync(reportPath, "utf8"))));
    } catch (error) {
      // Degrade gracefully: one malformed report file should drop a single
      // row, never take down every page and API route that reads the catalog.
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Skipping unreadable preflight report ${reportPath}: ${message}`);
    }
  }

  return reports;
}

export function persistReportToDirectory({
  report,
  reportDir
}: PersistReportToDirectoryOptions): PersistedReport {
  const hashedReport = ensureReportHash(report);

  mkdirSync(reportDir, { recursive: true });

  const reportPath = join(reportDir, `${hashedReport.reportHash}.json`);
  const temporaryPath = join(
    reportDir,
    `.${hashedReport.reportHash}.${process.pid}.${Date.now()}.tmp`
  );

  writeFileSync(temporaryPath, `${JSON.stringify(hashedReport, null, 2)}\n`, "utf8");
  renameSync(temporaryPath, reportPath);

  return {
    path: reportPath,
    report: hashedReport
  };
}

export function createReadyListSnapshot(
  reports: readonly PreflightReport[],
  options: ReadyListSnapshotOptions = {}
): ReadyListSnapshot {
  const normalizedReports = reports.map((report) => ensureReportHash(report));
  const entries = latestReportEntries(normalizedReports, options);

  return {
    generatedAt: nowDate(options.now).toISOString(),
    reports: normalizedReports,
    entries,
    summary: summarizeReadyList(normalizedReports, entries, options)
  };
}

export function listReadyListEntriesFromReports(
  reports: readonly PreflightReport[],
  options: ReadyListSnapshotOptions = {}
): readonly ReadyListEntry[] {
  return createReadyListSnapshot(reports, options).entries;
}

export function summarizeReadyList(
  reports: readonly PreflightReport[],
  entries: readonly ReadyListEntry[] = listReadyListEntriesFromReports(reports),
  options: ReadyListSnapshotOptions = {}
): ReadyListSummary {
  const now = nowDate(options.now);
  const latencySamples = reports.flatMap(reportLatencySamples);
  const medianEndpointLatencyMs = median(latencySamples);
  const selfCovered = entries.filter(
    (entry) => entry.selfAgentId === "verified" || entry.selfAgentId === "claimed"
  ).length;
  const indexedAgents = entries.length;

  return {
    indexedAgents,
    readyAgents: entries.filter((entry) => entry.status === "ready").length,
    readyWithWarnings: entries.filter((entry) => entry.status === "ready_with_warnings").length,
    notReadyAgents: entries.filter((entry) => entry.status === "not_ready").length,
    reportsGenerated: reports.length,
    celoAttestations: reports.filter((report) => Boolean(report.attestation?.txHash)).length,
    mcpEndpointsChecked: countEndpointChecks(reports, "mcp"),
    a2aEndpointsChecked: countEndpointChecks(reports, "a2a"),
    x402EndpointsChecked: countEndpointChecks(reports, "x402"),
    selfAgentIdCoveragePct: indexedAgents === 0
      ? 0
      : Math.round((selfCovered / indexedAgents) * 100),
    ...(medianEndpointLatencyMs === undefined ? {} : { medianEndpointLatencyMs }),
    reportsRefreshedLast24h: reports.filter((report) =>
      ageMs(report.generatedAt, now) <= 24 * 60 * 60 * 1000
    ).length,
    staleReports: entries.filter((entry) => entry.stale).length,
    needsRemediation: entries.filter((entry) => entry.needsRemediation).length
  };
}

export function getReportByHashFromReports(
  reports: readonly PreflightReport[],
  hash: string
): PreflightReport | undefined {
  const normalizedHash = hash.toLowerCase();

  return reports
    .map((report) => ensureReportHash(report))
    .find((report) => report.reportHash.toLowerCase() === normalizedHash);
}

export function getReportForAgentFromReports(
  reports: readonly PreflightReport[],
  { agentId, chainId, registry }: GetReportForAgentInput
): PreflightReport | undefined {
  const normalizedRegistry = registry.toLowerCase();

  return reports
    .map((report) => ensureReportHash(report))
    .filter(
      (report) =>
        String(report.subject.chainId) === chainId &&
        report.subject.agentId === agentId &&
        registryAddress(report.subject.agentRegistry).toLowerCase() === normalizedRegistry
    )
    .sort(newestReportFirst)[0];
}

export function registryAddress(agentRegistry: string | undefined): string {
  return agentRegistry?.split(":").at(-1) ?? "metadata-only";
}

function createReportCatalog({
  listReports,
  options
}: {
  readonly listReports: () => readonly PreflightReport[];
  readonly options: ReadyListSnapshotOptions;
}): ReportCatalog {
  return {
    listReports,
    getReportByHash(hash) {
      return getReportByHashFromReports(listReports(), hash);
    },
    getReportForAgent(input) {
      return getReportForAgentFromReports(listReports(), input);
    },
    getSnapshot(snapshotOptions = {}) {
      return createReadyListSnapshot(listReports(), {
        ...options,
        ...snapshotOptions
      });
    }
  };
}

function latestReportEntries(
  reports: readonly PreflightReport[],
  options: ReadyListSnapshotOptions
): readonly ReadyListEntry[] {
  const latestByAgent = new Map<string, PreflightReport>();

  for (const report of reports) {
    const key = reportKey(report);
    const existing = latestByAgent.get(key);

    if (!existing || newestReportFirst(report, existing) < 0) {
      latestByAgent.set(key, report);
    }
  }

  return Array.from(latestByAgent.values())
    .sort(newestReportFirst)
    .map((report) => reportToReadyListEntry(report, options));
}

function reportToReadyListEntry(
  reportInput: PreflightReport,
  options: ReadyListSnapshotOptions
): ReadyListEntry {
  const report = ensureReportHash(reportInput);
  const stale = isReportStale(report, options);
  const latencyMs = median(reportLatencySamples(report));
  const attestationTx = report.attestation?.txHash as ChainHash | undefined;
  const name = reportAgentName(report);

  return {
    chainId: report.subject.chainId,
    registry: report.subject.agentRegistry ?? "metadata-only",
    agentId: report.subject.agentId ?? "metadata-url",
    ...(name ? { name } : {}),
    ...(report.subject.owner ? { owner: report.subject.owner } : {}),
    status: stale ? "stale" : reportScoreStatus(report),
    score: report.score.value,
    mcp: capabilityStatus(report, "mcp"),
    a2a: capabilityStatus(report, "a2a"),
    x402: capabilityStatus(report, "x402"),
    selfAgentId: selfAgentIdStatus(report),
    celoActivity: capabilityStatus(report, "celo_activity"),
    ...(latencyMs === undefined ? {} : { latencyMs }),
    latestReportHash: report.reportHash,
    latestReportUrl: formatReportUrl(report.reportHash, options.reportUrlBase),
    ...(attestationTx ? { attestationTx } : {}),
    lastScanAt: report.generatedAt,
    stale,
    needsRemediation: report.checks.some(needsRemediation)
  };
}

function ensureReportHash(input: unknown): PreflightReport & { readonly reportHash: ReportHash } {
  const report = attachReportHash(input);

  return {
    ...report,
    reportHash: report.reportHash as ReportHash
  };
}

function reportScoreStatus(report: PreflightReport): ReadyListStatus {
  return report.score.label === "unknown" ? "unverified" : report.score.label;
}

function reportAgentName(report: PreflightReport): string | undefined {
  return report.checks
    .find((checkEntry) => checkEntry.id === "metadata.name.present")
    ?.evidence.find((evidence) => evidence.label === "name")
    ?.value;
}

function capabilityStatus(
  report: PreflightReport,
  category: CheckCategory
): CapabilityStatus {
  return combineCheckStatuses(
    report.checks
      .filter((checkEntry) => checkEntry.category === category)
      .map((checkEntry) => checkEntry.status)
  );
}

function selfAgentIdStatus(report: PreflightReport): SelfAgentIdStatus {
  const checks = report.checks.filter((checkEntry) => checkEntry.category === "self_agent_id");

  if (checks.length === 0) {
    return "unknown";
  }

  if (checks.some((checkEntry) => checkEntry.status === "pass")) {
    return "verified";
  }

  if (checks.some((checkEntry) => checkEntry.status === "warn")) {
    return "claimed";
  }

  if (checks.some((checkEntry) => checkEntry.status === "fail" || checkEntry.status === "error")) {
    return "unknown";
  }

  if (checks.some((checkEntry) => /not applicable/i.test(checkEntry.summary))) {
    return "not_applicable";
  }

  return "missing";
}

function combineCheckStatuses(
  statuses: readonly CheckStatus[]
): CapabilityStatus {
  if (statuses.length === 0) {
    return "unknown";
  }

  if (statuses.some((status) => status === "fail" || status === "error")) {
    return "fail";
  }

  if (statuses.some((status) => status === "warn")) {
    return "warn";
  }

  if (statuses.some((status) => status === "pass")) {
    return "pass";
  }

  if (statuses.some((status) => status === "skip")) {
    return "skip";
  }

  return "unknown";
}

function countEndpointChecks(
  reports: readonly PreflightReport[],
  category: CheckCategory
): number {
  return reports.reduce(
    (count, report) =>
      count +
      report.checks.filter(
        (checkEntry) =>
          checkEntry.category === category &&
          checkEntry.status !== "skip" &&
          checkEntry.evidence.some((evidence) => evidence.statusCode !== undefined)
      ).length,
    0
  );
}

function reportLatencySamples(report: PreflightReport): number[] {
  return report.checks.flatMap((checkEntry) =>
    checkEntry.evidence
      .map((evidence) => evidence.durationMs)
      .filter((durationMs): durationMs is number => durationMs !== undefined)
  );
}

function median(samples: readonly number[]): number | undefined {
  if (samples.length === 0) {
    return undefined;
  }

  const sorted = [...samples].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  const upper = sorted[midpoint];

  if (upper === undefined) {
    return undefined;
  }

  if (sorted.length % 2 === 1) {
    return upper;
  }

  const lower = sorted[midpoint - 1] ?? upper;

  return Math.round((lower + upper) / 2);
}

function isReportStale(
  report: PreflightReport,
  options: ReadyListSnapshotOptions
): boolean {
  const staleAfterHours = options.staleAfterHours ?? 24;

  return ageMs(report.generatedAt, nowDate(options.now)) > staleAfterHours * 60 * 60 * 1000;
}

function ageMs(input: string, now: Date): number {
  return Math.max(0, now.getTime() - new Date(input).getTime());
}

function nowDate(input: Date | string | undefined): Date {
  return input instanceof Date ? input : new Date(input ?? Date.now());
}

function formatReportUrl(hash: ReportHash, reportUrlBase = "/reports"): string {
  return `${reportUrlBase.replace(/\/$/, "")}/${hash}`;
}

function reportKey(report: PreflightReport): string {
  return [
    report.subject.chainId,
    registryAddress(report.subject.agentRegistry),
    report.subject.agentId ??
      report.subject.metadataURI ??
      report.subject.primaryUrl ??
      report.reportHash ??
      report.generatedAt
  ].join(":");
}

function newestReportFirst(left: PreflightReport, right: PreflightReport): number {
  const byDate = new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime();

  if (byDate !== 0) {
    return byDate;
  }

  return (left.reportHash ?? "").localeCompare(right.reportHash ?? "");
}

function needsRemediation(checkEntry: ReadinessCheck): boolean {
  return Boolean(
    checkEntry.remediation &&
      (checkEntry.status === "fail" ||
        checkEntry.status === "error" ||
        checkEntry.status === "warn")
  );
}
