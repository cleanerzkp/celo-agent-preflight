# Frontier Answering Guide

## Tone

Use concrete, evidence-first language. Avoid "we plan to explore." Prefer "the MVP is deployed; the grant funds hardening, docs, integrations, and adoption."

## Positioning sentence

Celo Agent Preflight is a conformance, readiness, and verification layer for Celo's agent economy, exposed through MCP, CLI, API, public reports, ReadyList, and Celo mainnet attestations.

## Thesis

Use this repeatedly:

> Discovery is not the same as readiness.

ERC-8004 and explorer surfaces can show that an agent exists. Preflight verifies whether its deployment claims are currently reproducible: metadata, endpoints, MCP/A2A declarations, x402-compatible payment routes, Self Agent ID status, and Celo activity.

ReadyList is the public ChainList-style directory powered by these reports. Describe it as an evidence surface, not a static leaderboard.

## What to emphasize

- **Infrastructure dependency:** Other builders and agents can use the CLI, MCP server, API, report schema, ReadyList directory, and attestations.
- **Celo-specific fit:** Celo has ERC-8004, Self Agent ID, stablecoin rails, low-cost mainnet transactions, and an active agent builder ecosystem.
- **Verifiability:** Report JSON, report hashes, transaction hashes, and public metadata make usage auditable.
- **Distribution:** Start with ERC-8004 builders, 8004scan/AgentScan-listed projects, CeloPG/DevRel channels, hackathon alumni, and Frontier applicants.
- **Scope discipline:** Narrow MVP first; grant funds hardened production infrastructure.

## What to avoid

- Do not pitch an end-user app.
- Do not pitch a generic AI agent.
- Do not pitch another generic Celo MCP server.
- Do not pitch another explorer.
- Do not call the score a trust score or safety score.
- Do not overclaim hosted x402 facilitator support on Celo.
- Do not request funds for salaries, core costs, liquidity, listings, events, or pure marketing.

## Suggested grant ask framing

Ask for the maximum only if the MVP evidence is real. Frame the budget as milestone-based infrastructure delivery:

- scanner/CLI/MCP hardening;
- report schema and public report pages;
- ReadyList directory and latest-readiness API;
- verified attestation contract;
- x402-compatible route checks and facilitator diagnostics;
- Self Agent ID integration;
- GitHub Action and CI integration;
- docs, examples, and onboarding support for the first 10-100 agents.

## Reviewer one-sentence test

The reviewer should be able to say:

> This helps Celo agents and builders check whether an agent is ready to call, integrate, or pay, and it creates verifiable Celo evidence for those checks.
