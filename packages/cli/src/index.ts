#!/usr/bin/env node

import { preflightEngineInfo } from "@celo-agent-preflight/preflight-core";

const args = process.argv.slice(2);
const command = args[0] === "--" ? args[1] : args[0];

if (!command || command === "help" || command === "--help") {
  console.log(`${preflightEngineInfo.name} v${preflightEngineInfo.version}`);
  console.log("");
  console.log("Commands coming online: check, check-url, hash, publish, attest, explain.");
  process.exit(0);
}

console.error(`Unknown command: ${command}`);
process.exit(1);
