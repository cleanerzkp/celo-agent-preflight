import assert from "node:assert/strict";
import test from "node:test";

import {
  attachReportHash,
  canonicalJson,
  hashPreflightReport,
  parsePreflightReport,
  REPORT_SCHEMA_VERSION,
  scoreChecks,
  type PreflightReport,
  type ReadinessCheck
} from "./index.js";

const passCheck: ReadinessCheck = {
  id: "metadata.resolves",
  category: "metadata",
  title: "Metadata resolves",
  status: "pass",
  severity: "high",
  scoreImpact: 0,
  summary: "The metadata document resolved and parsed.",
  evidence: [
    {
      type: "http",
      label: "metadata",
      value: "https://agent.example/.well-known/agent.json",
      statusCode: 200,
      fetchedAt: "2026-06-25T00:00:00.000Z"
    }
  ]
};

function sampleReport(overrides: Partial<PreflightReport> = {}): PreflightReport {
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    generatedAt: "2026-06-25T00:00:00.000Z",
    generator: {
      name: "celo-agent-preflight",
      version: "0.1.0",
      commit: "2162896"
    },
    subject: {
      chainId: 42220,
      agentRegistry:
        "eip155:42220:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
      agentId: "1",
      owner: "0x0000000000000000000000000000000000008004",
      metadataURI: "https://agent.example/.well-known/agent.json",
      primaryUrl: "https://agent.example"
    },
    score: {
      value: 100,
      label: "ready"
    },
    checks: [passCheck],
    ...overrides
  };
}

test("canonicalJson sorts object keys recursively", () => {
  assert.equal(
    canonicalJson({ b: 1, a: { d: true, c: null } }),
    '{"a":{"c":null,"d":true},"b":1}'
  );
});

test("hashPreflightReport is stable across key order", () => {
  const report = sampleReport();
  const reordered = {
    checks: report.checks,
    score: report.score,
    subject: report.subject,
    generator: report.generator,
    generatedAt: report.generatedAt,
    schemaVersion: report.schemaVersion
  };

  assert.equal(hashPreflightReport(report), hashPreflightReport(reordered));
});

test("attachReportHash writes a valid self hash field", () => {
  const report = attachReportHash(sampleReport());

  assert.match(report.reportHash ?? "", /^0x[a-f0-9]{64}$/);
  assert.equal(report.reportHash, hashPreflightReport(report));
});

test("hashPreflightReport ignores publication attestation metadata", () => {
  const report = sampleReport();
  const attested = sampleReport({
    attestation: {
      chainId: 42220,
      contract: "0x0000000000000000000000000000000000000001",
      txHash:
        "0x0000000000000000000000000000000000000000000000000000000000000002"
    }
  });

  assert.equal(hashPreflightReport(report), hashPreflightReport(attested));
});

test("scoreChecks applies deterministic severity penalties", () => {
  const score = scoreChecks([
    passCheck,
    {
      ...passCheck,
      id: "x402.payment.missing",
      category: "x402",
      title: "x402 route missing",
      status: "fail",
      severity: "high"
    },
    {
      ...passCheck,
      id: "domain.proof.missing",
      category: "domain",
      title: "Domain proof missing",
      status: "warn",
      severity: "medium"
    }
  ]);

  assert.deepEqual(score, { value: 78, label: "ready_with_warnings" });
});

test("scoreChecks labels empty reports unknown and failed zero reports not ready", () => {
  assert.deepEqual(scoreChecks([]), { value: 0, label: "unknown" });
  assert.deepEqual(
    scoreChecks([
      { ...passCheck, id: "critical.1", status: "fail", severity: "critical" },
      { ...passCheck, id: "critical.2", status: "fail", severity: "critical" },
      { ...passCheck, id: "critical.3", status: "fail", severity: "critical" },
      { ...passCheck, id: "critical.4", status: "fail", severity: "critical" }
    ]),
    { value: 0, label: "not_ready" }
  );
});

test("parsePreflightReport rejects malformed reports", () => {
  assert.throws(() =>
    parsePreflightReport({
      ...sampleReport(),
      schemaVersion: "wrong.version"
    })
  );
});
