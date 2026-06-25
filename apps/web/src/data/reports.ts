import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  createFileReportCatalog,
  persistReportToDirectory,
  registryAddress,
  type ReadyListSnapshot
} from "@celo-agent-preflight/readylist";
import type { PreflightReport } from "@celo-agent-preflight/report-schema";

const catalog = createFileReportCatalog({
  reportDir: getReportDir()
});

export { registryAddress };

export function getReadyListSnapshot(): ReadyListSnapshot {
  return catalog.getSnapshot();
}

export function listReports() {
  return catalog.listReports();
}

export function listReadyListEntries() {
  return getReadyListSnapshot().entries;
}

export function publishReport(report: PreflightReport) {
  return persistReportToDirectory({
    report,
    reportDir: getReportDir()
  });
}

export function getReportByHash(hash: string) {
  return catalog.getReportByHash(hash);
}

export function getReportForAgent(input: {
  readonly agentId: string;
  readonly chainId: string;
  readonly registry: string;
}) {
  return catalog.getReportForAgent(input);
}

export function getReportDir(): string {
  if (process.env.PREFLIGHT_REPORT_DIR) {
    return process.env.PREFLIGHT_REPORT_DIR;
  }

  const candidates = [
    resolve(process.cwd(), "storage/reports"),
    resolve(process.cwd(), "../../storage/reports")
  ] as const;

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}
