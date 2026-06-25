import { keccak256, toBytes } from "viem";

import { canonicalJson } from "./canonical-json.js";
import {
  parsePreflightReport,
  type PreflightReport,
  PreflightReportSchema
} from "./schema.js";

export type ReportHash = `0x${string}`;

export function hashPreflightReport(input: unknown): ReportHash {
  const report = parsePreflightReport(input);
  const hashableReport = toHashableReport(report);

  return keccak256(toBytes(canonicalJson(hashableReport)));
}

export function attachReportHash(input: unknown): PreflightReport {
  const report = parsePreflightReport(input);

  return PreflightReportSchema.parse({
    ...report,
    reportHash: hashPreflightReport(report)
  });
}

export function toHashableReport(
  report: PreflightReport
): Omit<PreflightReport, "attestation" | "reportHash"> {
  const { attestation: _attestation, reportHash: _reportHash, ...hashable } = report;

  return hashable;
}
