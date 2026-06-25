import { keccak256, toBytes } from "viem";

import { canonicalJson } from "./canonical-json.js";
import {
  type Evidence,
  parsePreflightReport,
  type PreflightReport,
  PreflightReportSchema,
  type ReadinessCheck
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
): unknown {
  const {
    attestation: _attestation,
    checks,
    generatedAt: _generatedAt,
    reportHash: _reportHash,
    ...hashable
  } = report;

  return {
    ...hashable,
    checks: [...checks]
      .sort(compareChecks)
      .map((checkEntry) => ({
        ...checkEntry,
        evidence: checkEntry.evidence.map(removeVolatileEvidenceFields)
      }))
  };
}

function removeVolatileEvidenceFields(
  evidence: Evidence
): Omit<Evidence, "durationMs" | "fetchedAt"> {
  const {
    durationMs: _durationMs,
    fetchedAt: _fetchedAt,
    ...stableEvidence
  } = evidence;

  return stableEvidence;
}

function compareChecks(left: ReadinessCheck, right: ReadinessCheck): number {
  return (
    left.id.localeCompare(right.id) ||
    left.category.localeCompare(right.category) ||
    left.title.localeCompare(right.title) ||
    left.summary.localeCompare(right.summary)
  );
}
