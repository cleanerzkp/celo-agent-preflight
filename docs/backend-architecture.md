# AgentProof Backend Architecture

AgentProof should use a Postgres-centered scanner/indexer backend, not long scans inside Next.js request handlers.

## Target Stack

```txt
Next.js website/API on Vercel
+ Node.js TypeScript worker
+ Supabase Postgres
+ pg-boss queues
+ object storage for canonical report JSON
+ Celo RPC via viem
+ AgentProofAttestor on Celo
```

The public web app remains read-heavy: ReadyList pages, report pages, badges, and API reads. The worker owns slow or retryable work: ERC-8004 indexing, endpoint probes, x402 checks, report generation, report upload, stale rescans, and Celo attestations.

## Repo Mapping

```txt
apps/web          Next.js UI/API, local scan form, ReadyList reads
apps/worker       long-running scan/index worker entrypoint
apps/mcp          MCP tools backed by the same scanner packages
packages/db       Postgres migration and queue/job contract
packages/storage  canonical report JSON storage abstraction
packages/preflight-core deterministic scanner
packages/readylist report-derived index model
contracts         AgentProofAttestor / attestation contracts
```

## Database

The core migration lives at:

```txt
packages/db/migrations/0001_agentproof_core.sql
```

It creates:

```txt
agents
scan_runs
check_results
endpoints
endpoint_samples
attestations
indexer_checkpoints
contract_evidence
```

The migration also creates a separate `pgboss` schema for pg-boss queue state. Full Proof Reports should remain immutable JSON artifacts in object storage; Postgres stores index rows, latest status, report URIs, and queryable check evidence.

## Queue Contract

Shared queue names are exported from `@celo-agent-preflight/db`:

```txt
index:celo:erc8004
index:celo:agentproof-attestor
scan:agent
scan:endpoint
scan:x402
scan:mcp
scan:a2a
scan:self
scan:contracts
report:publish
report:attest
report:refresh-stale
```

## Local Worker

Run one-off scans through the worker shape:

```bash
pnpm --filter @celo-agent-preflight/worker dev -- celo:2 celo:17
```

Or through env:

```bash
AGENTPROOF_WORKER_SCAN_TARGETS=celo:2,celo:17 \
pnpm --filter @celo-agent-preflight/worker dev
```

The current worker publishes report JSON to local storage. The next backend step is wiring the same `runScanAgentJob` processor to pg-boss and inserting `agents`, `scan_runs`, and `check_results` rows after each report is stored.

## API Boundary

Use Next.js API routes for:

```txt
GET  /api/agents
GET  /api/agents/:chainId/:registry/:agentId
GET  /api/reports
GET  /api/reports/:hash
POST /api/scan
```

`POST /api/scan` remains a local/MVP synchronous path. Production should add `POST /api/scan-request` to enqueue `scan:agent` and return a job id while the worker performs the scan.
