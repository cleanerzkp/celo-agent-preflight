import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  attachReportHash,
  parsePreflightReport,
  type PreflightReport,
  type ReportHash
} from "@celo-agent-preflight/report-schema";

export interface StoredReport {
  readonly report: PreflightReport & { readonly reportHash: ReportHash };
  readonly reportHash: ReportHash;
  readonly reportUri: string;
  readonly objectKey: string;
}

export interface ReportStorage {
  readonly putReport: (report: PreflightReport) => Promise<StoredReport>;
  readonly getReport: (hash: string) => Promise<PreflightReport | undefined>;
  readonly listReports: () => Promise<readonly PreflightReport[]>;
  readonly getReportUri: (hash: string) => string;
}

export interface LocalReportStorageOptions {
  readonly reportDir: string;
  readonly publicBaseUrl?: string;
}

export function createLocalReportStorage({
  publicBaseUrl = "/reports",
  reportDir
}: LocalReportStorageOptions): ReportStorage {
  const resolvedReportDir = resolve(reportDir);

  return {
    async putReport(report) {
      const hashedReport = ensureReportHash(report);
      const objectKey = reportObjectKey(hashedReport.reportHash);
      const reportPath = join(resolvedReportDir, objectKey);
      const temporaryPath = join(
        resolvedReportDir,
        `.${hashedReport.reportHash}.${process.pid}.${Date.now()}.tmp`
      );

      await mkdir(resolvedReportDir, { recursive: true });
      await writeFile(temporaryPath, `${JSON.stringify(hashedReport, null, 2)}\n`, "utf8");
      await rename(temporaryPath, reportPath);

      return {
        report: hashedReport,
        reportHash: hashedReport.reportHash,
        reportUri: formatReportUri(hashedReport.reportHash, publicBaseUrl),
        objectKey
      };
    },
    async getReport(hash) {
      try {
        const body = await readFile(join(resolvedReportDir, reportObjectKey(hash)), "utf8");

        return ensureReportHash(JSON.parse(body));
      } catch (error) {
        if (isMissingFileError(error)) {
          return undefined;
        }

        throw error;
      }
    },
    async listReports() {
      let entries: string[];

      try {
        entries = await readdir(resolvedReportDir);
      } catch (error) {
        if (isMissingFileError(error)) {
          return [];
        }

        throw error;
      }

      const reports = await Promise.all(
        entries
          .filter((entry) => entry.endsWith(".json") && entry.startsWith("0x"))
          .sort((left, right) => left.localeCompare(right))
          .map(async (entry) => ensureReportHash(JSON.parse(
            await readFile(join(resolvedReportDir, entry), "utf8")
          )))
      );

      return reports;
    },
    getReportUri(hash) {
      return formatReportUri(hash, publicBaseUrl);
    }
  };
}

export function defaultLocalReportDir(cwd = process.cwd()): string {
  return process.env.REPORT_STORAGE_LOCAL_DIR ??
    process.env.PREFLIGHT_REPORT_DIR ??
    resolve(cwd, "storage/reports");
}

export function reportObjectKey(hash: string): `${string}.json` {
  const normalized = hash.toLowerCase();

  if (!/^0x[a-f0-9]{64}$/.test(normalized)) {
    throw new Error("Report hash must be a 0x-prefixed 32-byte hex string.");
  }

  return `${normalized}.json`;
}

function ensureReportHash(input: unknown): PreflightReport & { readonly reportHash: ReportHash } {
  const report = attachReportHash(parsePreflightReport(input));

  return {
    ...report,
    reportHash: report.reportHash as ReportHash
  };
}

function formatReportUri(hash: string, publicBaseUrl: string): string {
  return `${publicBaseUrl.replace(/\/$/, "")}/${reportObjectKey(hash)}`;
}

function isMissingFileError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
  );
}
