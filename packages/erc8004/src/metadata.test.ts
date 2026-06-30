import assert from "node:assert/strict";
import test from "node:test";

import type { PublicClient } from "viem";

import {
  assertSafeHttpUrl,
  normalizeAgentMetadata,
  readIdentityRegistryAgent,
  resolveJsonUri,
  toIpfsGatewayUrl,
  validateAgentMetadata
} from "./index.js";

test("normalizeAgentMetadata supports EIP services shape", () => {
  const metadata = normalizeAgentMetadata({
    type: "Agent",
    name: "Preflight Demo",
    description: "Demo agent",
    services: [{ type: "mcp", url: "https://agent.example/mcp" }],
    registrations: [{ agentRegistry: "eip155:42220:0xabc", agentId: 42 }],
    supportedTrust: ["reputation"],
    x402Support: { network: "celo" }
  });

  assert.equal(metadata.sourceShape, "services");
  assert.equal(metadata.services[0]?.type, "mcp");
  assert.equal(metadata.registrations[0]?.agentId, "42");
  assert.equal(metadata.x402Support, true);
});

test("normalizeAgentMetadata supports Celo endpoints shape", () => {
  const metadata = normalizeAgentMetadata({
    type: "Agent",
    name: "Preflight Demo",
    description: "Demo agent",
    endpoints: [{ type: "a2a", url: "https://agent.example/.well-known/agent.json" }]
  });

  assert.equal(metadata.sourceShape, "endpoints");
  assert.equal(metadata.services[0]?.type, "a2a");
});

test("normalizeAgentMetadata supports current draft service name and endpoint shape", () => {
  const result = validateAgentMetadata({
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: "Preflight Demo",
    description: "Demo agent",
    image: "ipfs://bafy...",
    services: [{ name: "mcp", endpoint: "https://agent.example/mcp" }]
  });

  assert.equal(result.metadata.services[0]?.type, "mcp");
  assert.equal(result.metadata.services[0]?.url, "https://agent.example/mcp");
  assert.ok(!result.issues.some((issue) => issue.id === "metadata.type.invalid"));
});

test("validateAgentMetadata reports services without a locator", () => {
  const result = validateAgentMetadata({
    type: "Agent",
    name: "Preflight Demo",
    description: "Demo agent",
    image: "ipfs://bafy...",
    services: [{ type: "mcp" }]
  });

  assert.ok(result.issues.some((issue) => issue.id === "metadata.services.locator.missing"));
});

test("validateAgentMetadata reports missing expected registration", () => {
  const result = validateAgentMetadata(
    {
      type: "Agent",
      name: "Preflight Demo",
      description: "Demo agent",
      image: "ipfs://bafy...",
      services: [{ type: "mcp", url: "https://agent.example/mcp" }],
      registrations: [{ agentRegistry: "eip155:42220:0xabc", agentId: "1" }]
    },
    { agentRegistry: "eip155:42220:0xabc", agentId: "2" }
  );

  assert.ok(result.issues.some((issue) => issue.id === "metadata.registration.mismatch"));
});

test("resolveJsonUri parses data application json URIs", async () => {
  const encoded = Buffer.from(JSON.stringify({ name: "Preflight Demo" })).toString("base64");
  const document = await resolveJsonUri(`data:application/json;base64,${encoded}`);

  assert.deepEqual(document.json, { name: "Preflight Demo" });
});

test("resolveJsonUri enforces maxBytes for data application json URIs", async () => {
  const encoded = Buffer.from(JSON.stringify({ name: "Preflight Demo" })).toString("base64");

  await assert.rejects(
    () => resolveJsonUri(`data:application/json;base64,${encoded}`, { maxBytes: 4 }),
    /Data URI exceeds/
  );
});

test("resolveJsonUri enforces maxBytes while percent-decoding data URIs", async () => {
  await assert.rejects(
    () => resolveJsonUri(`data:application/json,${encodeURIComponent(JSON.stringify({
      name: "Preflight Demo"
    }))}`, { maxBytes: 4 }),
    /Data URI exceeds/
  );
});

test("toIpfsGatewayUrl maps ipfs URIs to gateway URLs", () => {
  assert.equal(
    toIpfsGatewayUrl("ipfs://bafybeigdyrzt/example.json", "https://gateway.example/ipfs"),
    "https://gateway.example/ipfs/bafybeigdyrzt/example.json"
  );
});

test("toIpfsGatewayUrl rejects path escapes", () => {
  assert.throws(() => toIpfsGatewayUrl("ipfs:////evil.example/x"), /empty path segment/);
  assert.throws(() => toIpfsGatewayUrl("ipfs://../admin"), /unsafe path segment/);
  assert.throws(() => toIpfsGatewayUrl("ipfs://bafybeigdyrzt/%2e%2e/admin"), /unsafe path segment/);
});

test("assertSafeHttpUrl blocks localhost and private IP targets", async () => {
  await assert.rejects(() => assertSafeHttpUrl(new URL("http://agent.example/agent.json")));
  await assert.rejects(() => assertSafeHttpUrl(new URL("https://localhost/agent.json")));
  await assert.rejects(() => assertSafeHttpUrl(new URL("https://127.0.0.1/agent.json")));
  await assert.rejects(() => assertSafeHttpUrl(new URL("https://10.0.0.4/agent.json")));
  await assert.rejects(() => assertSafeHttpUrl(new URL("https://100.64.0.1/agent.json")));
  await assert.rejects(() => assertSafeHttpUrl(new URL("https://198.18.0.1/agent.json")));
  await assert.rejects(() => assertSafeHttpUrl(new URL("https://192.0.2.1/agent.json")));
  await assert.rejects(() => assertSafeHttpUrl(new URL("https://[::ffff:192.168.0.1]/agent.json")));
  await assert.rejects(() => assertSafeHttpUrl(new URL("https://[0:0:0:0:0:0:0:1]/agent.json")));
  await assert.rejects(() => assertSafeHttpUrl(new URL("https://[2001:db8::1]/agent.json")));
});

test("readIdentityRegistryAgent reads one consistent block snapshot", async () => {
  const calls: Array<{ functionName: string; blockNumber?: bigint }> = [];
  const client = {
    async getBlockNumber() {
      return 123n;
    },
    async readContract(args: { functionName: string; blockNumber?: bigint }) {
      calls.push(args);

      if (args.functionName === "ownerOf") {
        return "0x0000000000000000000000000000000000000001";
      }

      if (args.functionName === "tokenURI") {
        return "ipfs://bafybeigdyrzt/agent.json";
      }

      if (args.functionName === "getAgentWallet") {
        return "0x0000000000000000000000000000000000000002";
      }

      throw new Error(`Unexpected function ${args.functionName}.`);
    }
  } as unknown as PublicClient;

  const agent = await readIdentityRegistryAgent({
    client,
    registry: "0x0000000000000000000000000000000000000003",
    agentId: 7n
  });

  assert.equal(agent.blockNumber, 123n);
  assert.equal(agent.owner, "0x0000000000000000000000000000000000000001");
  assert.equal(agent.metadataURI, "ipfs://bafybeigdyrzt/agent.json");
  assert.equal(agent.agentWallet, "0x0000000000000000000000000000000000000002");
  assert.deepEqual(calls.map((call) => call.functionName), [
    "ownerOf",
    "tokenURI",
    "getAgentWallet"
  ]);
  assert.ok(calls.every((call) => call.blockNumber === 123n));
});
