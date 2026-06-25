# ReadyList Spec

ReadyList is the public directory surface powered by Celo Agent Preflight reports.

The analogy is ChainList for Celo agent readiness:

- ChainList helps users connect to EVM networks.
- ReadyList helps agents, builders, and reviewers connect to usable Celo agents.

Preflight is the deterministic readiness engine. ReadyList is the ChainList-style public directory built from its reports.

## Product model

```txt
Celo Agent Preflight
├── CLI
├── MCP server
├── API
├── Celo attestation contract
└── ReadyList: public directory of scanned Celo agents
```

ReadyList should not be a static agent list. Agents are dynamic infrastructure: metadata URLs break, MCP tools change, x402 payment routes drift, Self Agent ID status changes, and Celo activity can become stale. ReadyList should always show the last reproducible report, evidence timestamp, and attestation state.

## MVP table

Start with a simple table at `/agents`:

```txt
Agent
Registry
Agent ID
Owner
Status
Score
MCP
A2A
x402
Self Agent ID
Celo Activity
Endpoint Latency
Last Scan
Report Hash
Attestation Tx
```

Statuses:

```txt
Ready
Ready with warnings
Not ready
Stale
Unverified
```

MVP filters:

```txt
Ready only
Has MCP
Has A2A
Has x402
Has Self Agent ID
Has recent Celo activity
Has onchain attestation
Needs remediation
```

## Agent page

Use this route shape:

```txt
/agents/celo/:agentId
```

Each page should show:

- overview
- readiness score and status
- checks and remediation
- endpoint evidence
- MCP tools or manifest summary
- A2A card summary if present
- x402 evidence and facilitator assumptions
- Self Agent ID status
- Celo transaction/activity evidence
- report history
- attestation history
- badge snippet
- CLI command
- MCP config snippet

## Machine-consumable actions

ReadyList needs the agent equivalent of ChainList's "Connect Wallet" action. For agents, this is a set of copyable and API-readable actions:

```txt
Use this agent
Copy MCP config
Copy A2A endpoint
Copy x402 endpoint
Run Preflight locally
Generate badge
View report JSON
Verify attestation
Use in CI
```

The "Use this agent" payload should be JSON-first:

```json
{
  "agentId": "1870",
  "registry": "0x...",
  "mcpUrl": "https://...",
  "a2aUrl": "https://...",
  "x402Url": "https://...",
  "latestReportHash": "0x...",
  "attestationTx": "0x..."
}
```

And CLI-first:

```bash
npx celo-agent-preflight check --chain celo --agent-id 1870
```

## Architecture

```txt
Onchain ERC-8004 registry
        ↓
Agent indexer
        ↓
agentURI metadata fetcher
        ↓
Preflight scanner
        ↓
Canonical JSON report
        ↓
Report hash
        ↓
Celo attestation
        ↓
ReadyList UI + API + badges + MCP
```

## Scope guardrails

MVP ReadyList is an index and navigation surface for reports we already generate.

Do not block the core grant proof on:

- full continuous crawling
- user accounts
- paid marketplace flows
- subjective ranking
- generalized multi-chain indexing
- owner-claim workflows

Those belong after the first verifiable reports and Celo attestations are live.

## Roadmap

v0.1:

- `/agents` index from local report JSON.
- `/agents/celo/:agentId` latest-report page.
- status/score/filter table.
- copyable CLI command and report JSON link.
- attestation tx link when present.

v0.2:

- scheduled ERC-8004 indexer.
- report history.
- stale-report detection.
- badges backed by latest report.

v0.3:

- claim-agent flow.
- owner-signed report claim.
- public rescan request.
- contribution workflow for agent metadata fixes.

v0.4:

- ERC-8004 Reputation Registry feedback integration.
- readiness trend charts.
- facilitator compatibility matrix for x402 routes.
