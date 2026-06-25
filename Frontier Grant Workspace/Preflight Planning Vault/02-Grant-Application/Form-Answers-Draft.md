# Frontier Grant Form Answers Draft

## Product name
Celo Agent Preflight

## One-sentence description
Celo Agent Preflight is an MCP-powered readiness layer and ReadyList directory that helps builders deploy production-ready ERC-8004/x402 agents on Celo and helps other agents verify them before interaction or payment.

## Describe your project
Celo Agent Preflight is a conformance and readiness system for Celo agents. It provides an MCP server, CLI, API, public report page, ReadyList directory, and Celo mainnet attestation contract. Builders use it before launch or grant submission to verify ERC-8004 metadata, live endpoints, MCP/A2A declarations, x402-style payment readiness, Self Agent ID status, Celo wallet/contract activity, and public reproducibility. Other agents can query Preflight before calling or paying an agent.

ReadyList is the public ChainList-style surface powered by Preflight reports: a directory of scanned Celo agents with latest status, score, MCP/A2A/x402/Self/Celo indicators, report hash, and attestation transaction.

## Infrastructure focus
Preflight is enabling infrastructure for other builders and agents. It is not an end-user app. It turns Celo's agent primitives into a repeatable deployment workflow and produces machine-readable readiness evidence that wallets, agent explorers, MCP clients, hackathon teams, ReadyList consumers, and grant reviewers can reuse.

## Verifiable onchain activity
Each completed report can generate an onchain attestation on Celo mainnet containing agent id, report hash, score, and report URI. Reports will also link to Celo explorer transactions and the verified attestation contract. Early usage will include readiness reports for existing Celo ERC-8004 agents and test agents deployed by us.

## Activation path: first 10 users
1. Scan visible Celo agents from 8004scan and related ecosystem lists.
2. Publish free reports.
3. Add them to ReadyList.
4. Send each builder a concrete remediation checklist and badge.
5. Help them fix one issue.
6. Ask them to link the report or ReadyList entry in GitHub/docs/agent metadata.

## Activation path: first 100 agents
- daily indexer for Celo ERC-8004 agents
- ReadyList public directory and stale-report detection
- GitHub Action for CI
- MCP server for assistant-driven setup
- DevRel/hackathon onboarding checklist
- templates for Celo Agent Skills, ERC-8004 metadata, x402 endpoints, and Self Agent ID
