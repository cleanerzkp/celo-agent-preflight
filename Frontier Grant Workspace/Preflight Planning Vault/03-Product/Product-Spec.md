# Product Spec

## Primary users

1. Celo agent builders preparing launch or grant submission.
2. Agents deciding whether to call/pay another agent.
3. Celo DevRel and grant reviewers checking project readiness.
4. Hackathon mentors onboarding new agent teams.

## Core product promise

Preflight gives a reproducible answer to: "Is this Celo agent ready enough for another builder, agent, or reviewer to trust its basic deployment claims?"

The public product analogy is **ChainList for Celo agent readiness**:

- Preflight is the deterministic readiness engine.
- ReadyList is the public directory of scanned Celo agents powered by Preflight reports.

## MVP surfaces

- MCP server
- CLI
- JSON report
- public report page
- ReadyList public agent directory
- Celo mainnet attestation event
- badge
- minimal API

## ReadyList

ReadyList is the visible ecosystem surface for Preflight. It should make Celo agents discoverable by current operational readiness, not just by registry existence.

MVP ReadyList starts as a simple `/agents` table backed by local/public report JSON:

- agent name, registry, agent ID, owner
- readiness status and score
- MCP, A2A, x402, Self Agent ID, and Celo activity indicators
- endpoint latency and last scan time
- report hash and attestation transaction
- filters for ready agents, x402, MCP, A2A, Self Agent ID, recent activity, onchain attestation, and remediation needed

Each agent page at `/agents/celo/:agentId` should expose the latest report, evidence, remediation, report JSON, attestation link, badge snippet, CLI command, and MCP config snippet.

ReadyList should copy the **interface pattern** of ChainList, not its code or static-data model. Agents are dynamic: metadata, endpoints, payment routes, and identity evidence can drift every day. ReadyList must always show the last reproducible scan and whether that report is stale or attested.

## Non-goals

- smart contract audit replacement
- subjective AI quality ranking
- broad multi-chain product at launch
- paid marketplace
- proof that an agent's outputs are true
- static agent directory with unverified claims
