# High-Probability Project Directions

## Recommended: Celo Agent Preflight

This is the strongest direction because it sits at the intersection of multiple Frontier priorities:

- agent identity and discovery support;
- agent-to-agent transaction readiness;
- verification and trust infrastructure;
- AI-native developer tooling;
- Celo mainnet evidence;
- interoperability across ERC-8004, MCP, A2A, x402-compatible routes, Self Agent ID, and Celo activity.

The MVP should prove:

- a Celo ERC-8004 agent can be scanned;
- metadata and service endpoints can be validated;
- x402-compatible payment-route readiness can be diagnosed without overclaiming facilitator support;
- a reproducible JSON report can be generated;
- the report hash can be attested on Celo mainnet;
- another agent or coding assistant can query the MCP/API before interaction.

## Strong alternate: pure verification reports

If x402/Self checks are too much before submission, focus entirely on:

- ERC-8004 registry reads;
- metadata consistency;
- endpoint uptime;
- MCP/A2A shape;
- Celo wallet/contract activity;
- reproducible report hashes;
- Celo report attestations.

This is the safest cut if time is short.

## Strong alternate: agent observability

Track agent identity, activity, endpoint freshness, counterparties, and report history.

This is compelling if it has real indexing and machine-readable API output. It is weaker if it is only a dashboard.

## Lower-probability directions

Avoid these unless there is a sharp differentiator:

- generic MCP server;
- wallet assistant;
- agent chatbot;
- plain discovery UI;
- generic analytics dashboard;
- generic smart contract audit agent;
- thin wrapper around Celo docs, Celopedia, x402, or 8004scan.

## Decision

Build **Celo Agent Preflight**.

MVP scope:

> Scanner + report schema + CLI + MCP server + public report page + ReadyList directory + Celo mainnet attestation.

If time is short, cut dashboard polish and deeper payment checks. Do not cut onchain attestations or reproducible reports.
