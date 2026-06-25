import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  attachReportHash,
  REPORT_SCHEMA_VERSION,
  type PreflightReport,
  type ReadinessCheck
} from "@celo-agent-preflight/report-schema";

import {
  createInMemoryReportCatalog,
  loadReportsFromDirectory,
  persistReportToDirectory
} from "./index.js";

const GENERATED_AT = "2026-06-25T00:00:00.000Z";
const REGISTRY = "eip155:42220:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";

test("creates operational ReadyList entries and summary from reports", () => {
  const report = reportWithChecks([
    check("mcp.declared", "mcp", "pass"),
    check("endpoint.1.reachable", "mcp", "pass", 128),
    check("a2a.declared", "a2a", "skip"),
    check("x402.endpoint.probe", "x402", "fail", 204, "Return a Celo x402 payment response."),
    check("self_agent_id.claimed", "self_agent_id", "warn", undefined, "Wire live Self verification."),
    check("celo_activity.identity_address.present", "celo_activity", "pass")
  ]);
  const catalog = createInMemoryReportCatalog([report]);
  const snapshot = catalog.getSnapshot({ now: "2026-06-25T01:00:00.000Z" });
  const entry = snapshot.entries[0];

  assert.ok(entry);
  assert.equal(entry.mcp, "pass");
  assert.equal(entry.a2a, "skip");
  assert.equal(entry.x402, "fail");
  assert.equal(entry.selfAgentId, "claimed");
  assert.equal(entry.celoActivity, "pass");
  assert.equal(entry.latencyMs, 166);
  assert.equal(entry.needsRemediation, true);
  assert.equal(snapshot.summary.indexedAgents, 1);
  assert.equal(snapshot.summary.reportsGenerated, 1);
  assert.equal(snapshot.summary.mcpEndpointsChecked, 1);
  assert.equal(snapshot.summary.x402EndpointsChecked, 1);
  assert.equal(snapshot.summary.selfAgentIdCoveragePct, 100);
  assert.equal(snapshot.summary.medianEndpointLatencyMs, 166);
});

test("loads canonical report JSON files from storage directories", () => {
  const reportDir = mkdtempSync(join(tmpdir(), "preflight-reports-"));
  const report = reportWithChecks([check("mcp.declared", "mcp", "pass")]);

  mkdirSync(reportDir, { recursive: true });
  writeFileSync(join(reportDir, "agent-1.json"), JSON.stringify(report, null, 2));

  const reports = loadReportsFromDirectory(reportDir);

  assert.equal(reports.length, 1);
  assert.equal(reports[0]?.reportHash, report.reportHash);
});

test("persists reports by hash for catalog reads", () => {
  const reportDir = mkdtempSync(join(tmpdir(), "preflight-reports-"));
  const report = reportWithChecks([check("mcp.declared", "mcp", "pass")]);
  const persisted = persistReportToDirectory({ report, reportDir });
  const reports = loadReportsFromDirectory(reportDir);

  assert.equal(persisted.path, join(reportDir, `${report.reportHash}.json`));
  assert.equal(persisted.report.reportHash, report.reportHash);
  assert.equal(reports[0]?.reportHash, report.reportHash);
});

test("collapses metadata-only scans by metadata URI", () => {
  const older = reportWithChecks(
    [check("mcp.declared", "mcp", "pass")],
    { generatedAt: "2026-06-25T00:00:00.000Z", metadataOnly: true }
  );
  const newer = reportWithChecks(
    [check("mcp.declared", "mcp", "pass"), check("x402.endpoint.probe", "x402", "fail")],
    { generatedAt: "2026-06-25T01:00:00.000Z", metadataOnly: true }
  );
  const catalog = createInMemoryReportCatalog([older, newer]);
  const snapshot = catalog.getSnapshot({ now: "2026-06-25T02:00:00.000Z" });

  assert.equal(snapshot.entries.length, 1);
  assert.equal(snapshot.entries[0]?.agentId, "metadata-url");
  assert.equal(snapshot.entries[0]?.latestReportHash, newer.reportHash);
});

function reportWithChecks(
  checks: readonly ReadinessCheck[],
  options: {
    readonly generatedAt?: string;
    readonly metadataOnly?: boolean;
  } = {}
): PreflightReport {
  return attachReportHash({
    schemaVersion: REPORT_SCHEMA_VERSION,
    generatedAt: options.generatedAt ?? GENERATED_AT,
    generator: {
      name: "celo-agent-preflight",
      version: "0.1.0"
    },
    subject: {
      chainId: 42220,
      ...(options.metadataOnly ? {} : { agentRegistry: REGISTRY, agentId: "1" }),
      ...(options.metadataOnly
        ? {}
        : { owner: "0x0000000000000000000000000000000000008004" }),
      metadataURI: "https://agent.example/.well-known/agent.json",
      primaryUrl: "https://agent.example"
    },
    score: {
      value: 88,
      label: "ready_with_warnings"
    },
    checks
  });
}

function check(
  id: string,
  category: ReadinessCheck["category"],
  status: ReadinessCheck["status"],
  durationMs?: number,
  remediation?: string
): ReadinessCheck {
  return {
    id,
    category,
    title: id,
    status,
    severity: status === "fail" ? "high" : "low",
    scoreImpact: status === "fail" ? -20 : 0,
    summary: `${id} ${status}`,
    evidence: durationMs === undefined
      ? []
      : [
          {
            type: category === "x402" ? "x402" : "http",
            label: id,
            value: "https://agent.example",
            statusCode: category === "x402" ? 402 : 200,
            durationMs,
            fetchedAt: GENERATED_AT
          }
        ],
    ...(remediation ? { remediation } : {})
  };
}
