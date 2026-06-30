import assert from "node:assert/strict";
import test from "node:test";

import { runPreflight, type RunPreflightOptions } from "./index.js";

const GENERATED_AT = "2026-06-25T00:00:00.000Z";
const CELO_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
const EXPECTED_REGISTRATION = `eip155:42220:${CELO_REGISTRY}`;

test("runPreflight produces a hashed ready report from metadata URL", async () => {
  const report = await runPreflight(
    {
      chain: "celo",
      metadataUrl: dataJson({
        type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
        name: "Preflight Demo",
        description: "Demo agent",
        image: "ipfs://bafybeigdyrzt/image.png",
        services: [
          { name: "mcp", endpoint: "https://agent.example/mcp" },
          { type: "a2a", url: "https://agent.example/.well-known/agent.json" }
        ]
      })
    },
    { generatedAt: GENERATED_AT, probeEndpoints: false }
  );

  assert.equal(report.schemaVersion, "preflight.report.v0.1");
  assert.equal(report.score.label, "ready");
  assert.match(report.reportHash ?? "", /^0x[a-f0-9]{64}$/);
  assert.equal(checkStatus(report, "metadata.resolves"), "pass");
  assert.equal(checkStatus(report, "mcp.declared"), "pass");
  assert.equal(checkStatus(report, "endpoint.probes.enabled"), "skip");
  assert.equal(report.subject.primaryUrl, "https://agent.example");
});

test("runPreflight reports broken metadata deterministically", async () => {
  const report = await runPreflight(
    {
      chain: "celo",
      metadataUrl: dataJson({
        type: "Agent",
        active: false,
        services: [{ type: "mcp" }]
      })
    },
    { generatedAt: GENERATED_AT, probeEndpoints: false }
  );

  assert.equal(report.score.label, "not_ready");
  assert.equal(checkStatus(report, "metadata.name.present"), "fail");
  assert.equal(checkStatus(report, "metadata.description.present"), "fail");
  assert.equal(checkStatus(report, "metadata.active.true"), "fail");
  assert.equal(checkStatus(report, "metadata.services.locators"), "fail");
});

test("runPreflight reads ERC-8004 registry records at a mocked block", async () => {
  const metadataUri = dataJson({
    type: "Agent",
    name: "Registered Agent",
    description: "Registered demo agent",
    image: "ipfs://bafybeigdyrzt/image.png",
    services: [{ type: "mcp", url: "https://agent.example/mcp" }],
    registrations: [{ agentRegistry: EXPECTED_REGISTRATION, agentId: "42" }]
  });
  const calls: Array<{ functionName: string; blockNumber?: bigint }> = [];
  const client: NonNullable<RunPreflightOptions["client"]> = {
    async getBlockNumber() {
      return 456n;
    },
    async readContract(args) {
      const functionName = String(args.functionName);
      calls.push({
        functionName,
        ...(typeof args.blockNumber === "bigint" ? { blockNumber: args.blockNumber } : {})
      });

      if (functionName === "ownerOf") {
        return "0x0000000000000000000000000000000000000001";
      }

      if (functionName === "tokenURI") {
        return metadataUri;
      }

      if (functionName === "getAgentWallet") {
        return "0x0000000000000000000000000000000000000002";
      }

      throw new Error(`Unexpected function ${functionName}.`);
    }
  };

  const report = await runPreflight(
    { chain: "celo", agentId: "42" },
    { client, generatedAt: GENERATED_AT, probeEndpoints: false }
  );

  assert.equal(report.subject.owner, "0x0000000000000000000000000000000000000001");
  assert.equal(report.subject.agentWallet, "0x0000000000000000000000000000000000000002");
  assert.equal(report.subject.agentRegistry, EXPECTED_REGISTRATION);
  assert.equal(checkStatus(report, "erc8004.registry.read"), "pass");
  assert.equal(checkStatus(report, "metadata.registration.matches"), "pass");
  assert.ok(calls.every((call) => call.blockNumber === 456n));
});

test("runPreflight validates Celo x402 payment requirements", async () => {
  const report = await runPreflight(
    {
      chain: "celo",
      metadataUrl: dataJson({
        type: "Agent",
        name: "Payable Agent",
        description: "Agent with an x402 endpoint",
        image: "ipfs://bafybeigdyrzt/image.png",
        x402Support: true,
        services: [{ type: "x402", url: "https://agent.example/pay" }]
      })
    },
    {
      generatedAt: GENERATED_AT,
      fetchText: async (url) => ({
        url,
        statusCode: 402,
        contentType: "application/json",
        bodyText: JSON.stringify({
          accepts: [
            {
              scheme: "exact",
              network: "celo",
              asset: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
              payTo: "0x0000000000000000000000000000000000000001",
              maxAmountRequired: "10000"
            }
          ]
        })
      })
    }
  );

  assert.equal(checkStatus(report, "x402.declared"), "pass");
  assert.equal(checkStatus(report, "x402.endpoint.probe"), "pass");
});

test("runPreflight fails x402 probes with non-settleable payment details", async () => {
  const report = await runPreflight(
    {
      chain: "celo",
      metadataUrl: dataJson({
        type: "Agent",
        name: "Payable Agent",
        description: "Agent with a malformed x402 endpoint",
        image: "ipfs://bafybeigdyrzt/image.png",
        x402Support: true,
        services: [{ type: "x402", url: "https://agent.example/pay" }]
      })
    },
    {
      generatedAt: GENERATED_AT,
      fetchText: async (url) => ({
        url,
        statusCode: 402,
        contentType: "application/json",
        bodyText: JSON.stringify({
          accepts: [
            {
              scheme: "exact",
              network: "celo",
              asset: "not-an-address",
              payTo: "not-a-recipient",
              maxAmountRequired: "nan"
            }
          ]
        })
      })
    }
  );

  assert.equal(checkStatus(report, "x402.endpoint.probe"), "fail");
});

test("runPreflight treats 4xx endpoint probes as failed readiness evidence", async () => {
  const report = await runPreflight(
    {
      chain: "celo",
      metadataUrl: dataJson({
        type: "Agent",
        name: "Client Error Agent",
        description: "Agent with a 404 endpoint",
        image: "ipfs://bafybeigdyrzt/image.png",
        services: [{ type: "mcp", url: "https://agent.example/missing" }]
      })
    },
    {
      generatedAt: GENERATED_AT,
      fetchText: async (url) => ({
        url,
        statusCode: 404,
        contentType: "text/plain",
        bodyText: "not found"
      })
    }
  );

  assert.equal(checkStatus(report, "endpoint.1.reachable"), "fail");
});

function dataJson(value: unknown): string {
  return `data:application/json;base64,${Buffer.from(JSON.stringify(value)).toString("base64")}`;
}

function checkStatus(report: Awaited<ReturnType<typeof runPreflight>>, id: string): string {
  const found = report.checks.find((entry) => entry.id === id);

  assert.ok(found, `Missing check ${id}`);

  return found.status;
}
