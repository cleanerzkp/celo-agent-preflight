import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  AGENTPROOF_MIGRATIONS,
  AGENTPROOF_QUEUE_NAMES,
  AGENTPROOF_TABLES
} from "./index.js";

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
const migrationSql = readFileSync(
  join(packageDir, "migrations/0001_agentproof_core.sql"),
  "utf8"
);

test("core migration creates every backend table", () => {
  for (const table of AGENTPROOF_TABLES) {
    assert.match(migrationSql, new RegExp(`create table if not exists ${table}\\b`, "i"));
  }
});

test("core migration keeps pg-boss isolated in its own schema", () => {
  assert.match(migrationSql, /create schema if not exists pgboss/i);
});

test("queue names match the backend job contract", () => {
  assert.deepEqual(Object.values(AGENTPROOF_QUEUE_NAMES), [
    "index:celo:erc8004",
    "index:celo:agentproof-attestor",
    "scan:agent",
    "scan:endpoint",
    "scan:x402",
    "scan:mcp",
    "scan:a2a",
    "scan:self",
    "scan:contracts",
    "report:publish",
    "report:attest",
    "report:refresh-stale"
  ]);
});

test("migration registry points at the sql file", () => {
  assert.equal(AGENTPROOF_MIGRATIONS[0]?.path, "packages/db/migrations/0001_agentproof_core.sql");
});
