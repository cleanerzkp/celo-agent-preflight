import assert from "node:assert/strict";
import test from "node:test";

import {
  parseScanTargets,
  readWorkerConfig
} from "./index.js";

test("parseScanTargets accepts Celo agent tokens", () => {
  assert.deepEqual(parseScanTargets(["--", "celo:2", "celo-sepolia:5"]), [
    { chain: "celo", agentId: "2" },
    { chain: "celo-sepolia", agentId: "5" }
  ]);
});

test("parseScanTargets accepts metadata URLs", () => {
  assert.deepEqual(parseScanTargets(["https://agent.example/agent.json"]), [
    { chain: "celo", metadataUrl: "https://agent.example/agent.json" }
  ]);
});

test("readWorkerConfig uses backend storage env aliases", () => {
  const config = readWorkerConfig({
    AGENTPROOF_REPORT_DIR: "/tmp/agentproof-reports",
    REPORT_STORAGE_PUBLIC_BASE_URL: "https://reports.example",
    SCAN_TIMEOUT_MS: "1234",
    MAX_ENDPOINTS_PER_AGENT: "7",
    PROBE_ENDPOINTS: "false"
  });

  assert.deepEqual(config, {
    reportDir: "/tmp/agentproof-reports",
    reportPublicBaseUrl: "https://reports.example",
    scanTimeoutMs: 1234,
    maxEndpointProbes: 7,
    probeEndpoints: false
  });
});
