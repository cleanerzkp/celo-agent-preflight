# Frontier Pool Grant Workspace

## Bottom line

The strongest application route is Frontier Pool, not Anchor.

Anchor is transaction/TVL traction-heavy. Boost is invite-only. Frontier is the best fit for a new project if we can ship a narrow but real Celo mainnet infrastructure MVP before submission.

## Selected project direction

**Celo Agent Preflight**: a conformance, readiness, and verification layer for Celo's agent economy.

Public product model: **Preflight is the readiness engine; ReadyList is the ChainList-style directory of scanned Celo agents powered by Preflight reports.**

Preflight gives builders and agents:

- ERC-8004 metadata and service validation;
- MCP/A2A endpoint readiness checks;
- x402-compatible payment-route checks with facilitator caveats made explicit;
- Self Agent ID status checks;
- Celo mainnet activity checks;
- JSON readiness reports;
- public report pages;
- ReadyList agent directory with latest status, score, report hash, and attestation tx;
- Celo mainnet report-hash attestations;
- MCP, CLI, API, and CI surfaces.

This combines the highest-probability Frontier categories:

- agent identity and discovery support;
- agent-to-agent transaction readiness;
- verification and trust infrastructure;
- AI-native developer tooling;
- interoperability across ERC-8004, MCP, A2A, x402-compatible routes, Self Agent ID, and Celo activity.

## Why this is grant-shaped

Frontier does not want an "interesting AI app." It wants infrastructure deployed on Celo mainnet that other builders or agents can depend on.

The review posture should be:

> We shipped a minimal Celo mainnet Preflight system before applying. The grant funds the hardened public infrastructure: scanner, MCP server, CLI, API, attestations, docs, GitHub Action, and first 10-100 agent onboarding.

## Workspace map

- [Application/Frontier Application Checklist.md](Application/Frontier%20Application%20Checklist.md)
- [Application/Frontier Answering Guide.md](Application/Frontier%20Answering%20Guide.md)
- [Application/Frontier Answer Draft Template.md](Application/Frontier%20Answer%20Draft%20Template.md)
- [Application/Evidence Register.md](Application/Evidence%20Register.md)
- [Build/Celo Agent Preflight Proof Sprint.md](Build/Celo%20Agent%20Preflight%20Proof%20Sprint.md)
- [Build/Tool Availability Audit.md](Build/Tool%20Availability%20Audit.md)
- [Build/72 Hour Build Sprint.md](Build/72%20Hour%20Build%20Sprint.md)
- [Preflight Planning Vault/](Preflight%20Planning%20Vault/)
- [Preflight Planning Vault/03-Product/ReadyList-Spec.md](Preflight%20Planning%20Vault/03-Product/ReadyList-Spec.md)
- [Ecosystem/Celo Agent Ecosystem Notes.md](Ecosystem/Celo%20Agent%20Ecosystem%20Notes.md)
- [Policies/Grant Requirements and Policies.md](Policies/Grant%20Requirements%20and%20Policies.md)
- [Project/Selected Project - Celo Agent Preflight.md](Project/Selected%20Project%20-%20Celo%20Agent%20Preflight.md)
- [Strategy/Celo Agent Preflight Pitch Deck.md](Strategy/Celo%20Agent%20Preflight%20Pitch%20Deck.md)
- [Strategy/High-Probability Project Directions.md](Strategy/High-Probability%20Project%20Directions.md)
- [Sources.md](Sources.md)

## Immediate next move

Do not spend time polishing brand or deck. The application needs evidence.

1. Create public GitHub repo and README.
2. Implement CLI scanner and report schema.
3. Deploy verified Celo mainnet `AgentPreflightAttestor`.
4. Generate 3-10 public reports for existing Celo agents.
5. Attest report hashes on Celo.
6. Expose MCP/API/report page plus ReadyList index.
7. Record a short demo.
8. Fill the answer template and submit.
