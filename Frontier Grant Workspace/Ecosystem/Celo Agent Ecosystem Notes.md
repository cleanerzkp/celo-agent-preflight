# Celo Agent Ecosystem Notes

## Core Celo thesis

Celo is positioning itself as an Ethereum L2 for real-world agent activity: stablecoin payments, low-cost execution, fast finality, fee abstraction, ERC-8004 identity/trust, x402 payments, Self Agent ID, and mobile-first distribution.

For a Frontier application, the Celo-specific argument matters. The project should not read as something that could be deployed unchanged on any EVM chain.

## Relevant primitives

- **ERC-8004:** identity, reputation, and validation registries for agents.
- **Self Agent ID:** sybil-resistant human-backed agent identity on Celo.
- **x402:** HTTP-native payments for AI agents and APIs.
- **Celopedia:** Celo ecosystem knowledge skill for coding assistants.
- **Celo MCP/tooling:** official and community tooling for agent access to Celo.
- **Agent Visa:** Celo incentive/distribution program based on real agent transactions and usage.

## Existing ecosystem signal

The ecosystem already has agent demos and tooling, including hackathon winners and community projects. That means the application should not be generic. It must add a missing infrastructure layer.

Observed gaps from the research:

- trust/verification signals beyond raw registration;
- payment-route readiness and facilitator compatibility checks;
- operational readiness checks;
- public evidence packs that builders can inspect;
- MCP/CLI/API surfaces other agents and coding assistants can call;
- metrics linking identity, endpoint readiness, onchain activity, and payment-route readiness.

## Competitive positioning

Weak positioning:

> We are building an AI agent dashboard for Celo.

Stronger positioning:

> We are building a Celo mainnet Preflight layer that agents and builders can query before calling, integrating, or paying an ERC-8004/x402-compatible service.

## Distribution map

First users should come from:

- 8004scan-listed Celo agents;
- Real World Agent Hackathon alumni;
- Celo DevRel/CeloPG intros;
- teams building x402 paid APIs;
- Self Agent ID builders;
- Agent Visa applicants needing evidence;
- AI infra projects that need public trust artifacts.
