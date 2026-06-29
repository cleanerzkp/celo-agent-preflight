import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  attachReportHash,
  REPORT_SCHEMA_VERSION,
  type PreflightReport
} from "@celo-agent-preflight/report-schema";

import {
  createLocalReportStorage,
  reportObjectKey
} from "./reports.js";

test("local storage persists canonical reports by hash", async () => {
  const reportDir = await mkdtemp(join(tmpdir(), "agentproof-storage-"));
  const storage = createLocalReportStorage({
    reportDir,
    publicBaseUrl: "https://agentproof.example/reports"
  });
  const report = sampleReport();
  const stored = await storage.putReport(report);
  const loaded = await storage.getReport(stored.reportHash);

  assert.equal(stored.objectKey, `${stored.reportHash}.json`);
  assert.equal(stored.reportUri, `https://agentproof.example/reports/${stored.reportHash}.json`);
  assert.equal(loaded?.reportHash, stored.reportHash);
});

test("local storage lists report JSON files deterministically", async () => {
  const reportDir = await mkdtemp(join(tmpdir(), "agentproof-storage-"));
  const storage = createLocalReportStorage({ reportDir });
  const first = await storage.putReport(sampleReport({ agentId: "1" }));
  const second = await storage.putReport(sampleReport({ agentId: "2" }));
  const reports = await storage.listReports();

  assert.deepEqual(
    reports.map((report) => report.reportHash).sort(),
    [first.reportHash, second.reportHash].sort()
  );
});

test("reportObjectKey rejects non-report hashes", () => {
  assert.throws(() => reportObjectKey("agent-1"), /Report hash/);
});

function sampleReport(overrides: Partial<PreflightReport["subject"]> = {}): PreflightReport {
  return attachReportHash({
    schemaVersion: REPORT_SCHEMA_VERSION,
    generatedAt: "2026-06-25T00:00:00.000Z",
    generator: {
      name: "celo-agent-preflight",
      version: "0.1.0"
    },
    subject: {
      chainId: 42220,
      agentRegistry: "eip155:42220:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
      agentId: "1",
      metadataURI: "https://agent.example/agent.json",
      ...overrides
    },
    score: {
      value: 100,
      label: "ready"
    },
    checks: [
      {
        id: "metadata.resolves",
        category: "metadata",
        title: "Metadata resolves",
        status: "pass",
        severity: "critical",
        scoreImpact: 0,
        summary: "Metadata resolved.",
        evidence: []
      }
    ]
  });
}
