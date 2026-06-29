# Frontier Answer Draft Template

## Product name

Celo Agent Preflight

## Team name

TODO

## Website

https://celo-agent-preflight.vercel.app

## X handle

TODO

## KarmaGAP profile

TODO

## GitHub

https://github.com/cleanerzkp/celo-agent-preflight

## One-sentence description

Celo Agent Preflight is a conformance, readiness, and verification layer for Celo's agent economy, exposed through MCP, CLI, API, public reports, ReadyList, and Celo mainnet attestations.

## ERC-8004 registration

TODO: Provide registry address, chain ID `42220`, agent ID, agentURI, and discovery link if Preflight itself is registered as an agent.

Draft:

Preflight will either register its own operator agent on Celo ERC-8004 or provide a clear infrastructure exemption explanation. Where applicable, our metadata will include the MCP server endpoint, public API, report page, GitHub repository, owner wallet, and Self Agent ID status. The evidence appendix will include the registry address, agent ID, metadata URI, and transaction hash.

## Is your project fully open source?

Draft:

Yes. The scanner library, CLI, MCP server, report schema, attestation contract, API examples, and documentation are open source under Apache-2.0. The hosted report site is a convenience deployment; the checks, contracts, and report format can be self-hosted by other builders.

## Deployed on Celo mainnet

TODO: Replace with exact addresses and links.

Draft:

Yes. The MVP includes a verified Celo mainnet attestation contract that stores readiness report hashes, agent IDs, scores, and report URIs. The evidence appendix includes the deployment transaction, contract verification link, and sample report-attestation transactions.

## Self Agent ID

TODO: Provide Self Agent ID evidence or explain status if positioned as pure infrastructure.

Draft:

Preflight checks Self Agent ID status for scanned agents where available. For Preflight's own operator identity, we will provide Self Agent ID status or a clear explanation of the current integration stage. Self Agent ID is treated as a sybil-resistance signal, not as a guarantee of agent quality.

## Describe your project

Draft:

Celo Agent Preflight is a conformance and readiness system for Celo agents. ERC-8004 can make an agent discoverable, but discovery alone does not prove that metadata is valid, endpoints are reachable, MCP/A2A services are callable, x402-compatible payment routes are configured correctly, Self Agent ID is present, or Celo mainnet activity is verifiable.

Preflight turns those checks into a repeatable workflow exposed through MCP, CLI, API, public reports, ReadyList, and Celo mainnet attestations. Builders use it before launch or grant submission. Coding assistants and autonomous agents use it before interacting with or paying another agent.

ReadyList is the ChainList-style public directory powered by those reports. ChainList helps users connect to EVM networks; ReadyList helps agents and builders connect to usable Celo agents by showing the latest reproducible readiness report, status, score, evidence, and attestation transaction.

The goal is not to create another end-user AI app or another agent explorer. The goal is to make Celo agents easier to deploy correctly and easier for other agents to verify before interaction.

## Infrastructure focus

Draft:

Preflight is enabling infrastructure for other builders and agents. It provides a scanner library, CLI, MCP server, API, report schema, ReadyList directory, and attestation contract. Other agents can query readiness reports before calling or paying a service; builders can use Preflight as a launch checklist; grant reviewers and DevRel teams can inspect reproducible evidence instead of manually checking every claim.

It maps directly to Frontier's infrastructure categories:

- agent identity and discovery, because it validates ERC-8004 registration, metadata, services, and domain proof;
- agent-to-agent transaction infrastructure, because it checks x402-compatible payment readiness before interaction;
- AI-native developer tooling, because it ships MCP, CLI, API, and GitHub Action surfaces;
- verification and trust infrastructure, because it produces reproducible JSON reports and Celo mainnet attestations;
- interoperability, because it checks ERC-8004, MCP, A2A, Self Agent ID, x402-compatible payment routes, and Celo activity together.

## Verifiable onchain activity

TODO: Fill exact hashes.

Draft:

Each completed readiness report can generate a Celo mainnet attestation containing the target agent ID, report hash, readiness score, and report URI. Reports link back to the Celo explorer transaction and the verified attestation contract. The initial evidence set will include reports for existing public Celo agents and our own demo/test agent.

## x402/payment wording

Draft:

Preflight validates x402-compatible payment routes for Celo agents, including network identifier, recipient, token, 402 response shape, and facilitator compatibility. Where hosted facilitator support is unavailable, Preflight identifies the exact missing configuration or custom facilitator requirement. We do not present a payment route as ready unless the route and facilitator assumptions are explicit.

## Demo

Public demo: https://celo-agent-preflight.vercel.app

TODO: Add short demo video.

Draft:

The demo shows the full readiness flow:

1. Select a public Celo ERC-8004 agent.
2. Run the CLI check.
3. Inspect failed and passing checks.
4. Generate a JSON report.
5. Attest the report hash on Celo mainnet.
6. Open the public report page and verify the transaction hash.
7. Open ReadyList, filter to the scanned agent, and copy the "Use this agent" payload.
8. Ask the MCP server whether another agent should call or pay this agent.
9. Receive a pass/warn/fail response with evidence and remediation.

## Activation path for first 10 users

Draft:

The first 10 users are existing Celo agent builders and Frontier applicants. We will scan visible agents from 8004scan, AgentScan, hackathons, Celo DevRel channels, and public GitHub repositories. For each builder, we will publish a free readiness report, list the agent in ReadyList, send one concrete issue and one quick win, offer a PR adding the report link, ReadyList link, or badge to docs/metadata, and ask permission to list them as early users.

## Activation path for first 100 agents

Draft:

The first 100 agents come from daily indexing of public Celo ERC-8004 registrations, ReadyList stale-report detection, claim-and-rerun flows, a GitHub Action for CI, MCP-based assistant setup, a "Celo Agent Ready" badge, and DevRel/hackathon onboarding. The goal is to make Preflight the default final step before announcing a Celo agent.

## Distribution strategy

Draft:

Distribution starts where Celo agent builders already are:

- 8004scan and AgentScan-visible builders;
- Celo DevRel and CeloPG channels;
- Real World Agent Hackathon alumni;
- Frontier Pool applicants;
- Self Agent ID and ERC-8004 builders;
- teams experimenting with x402-compatible paid APIs;
- public GitHub examples that make integration possible in less than 15 minutes.

The main wedge is not a dashboard. It is a useful report: a URL, API response, badge, metadata link, and Celo attestation that builders can reference publicly.

## Prior Celo ecosystem engagement

TODO: Select honestly from the form.

Draft if none:

None formally yet. This application is intended to create a concrete contribution to the Celo agent stack, with public deployment, docs, and mainnet evidence before or at submission.

## Clear contribution to the ecosystem

Draft:

Celo's agent strategy depends on agents discovering, evaluating, paying, and trusting each other across organizational boundaries. Preflight strengthens that loop by making deployment readiness and integration evidence public, machine-readable, and attestable on Celo. It improves the quality of ERC-8004 metadata, helps builders configure endpoints and payment routes correctly, and gives other agents a practical pre-interaction check.

## Technical credibility

Draft:

The technical design is intentionally narrow:

- TypeScript scanner library and CLI;
- MCP server for coding assistants and autonomous agents;
- viem-based Celo RPC reads and writes;
- ERC-8004 registry and metadata validation;
- endpoint probes for MCP, A2A, and web metadata;
- x402-compatible 402 response and payment-route checks;
- Self Agent ID status check;
- JSON report schema with reproducible hashes;
- Solidity attestation contract verified on Celo mainnet;
- public report pages linking reports to explorer transactions.

The architecture avoids overclaiming: Preflight does not prove an agent is honest or secure. It proves that key deployment, identity, endpoint, payment, and activity claims are reproducible.

## Additional information

TODO: Attach evidence markdown/PDF export.

Include:

- architecture diagram;
- contract links;
- transaction hashes;
- sample report JSON;
- MCP tool list;
- API docs;
- first 10 target agents/builders;
- 30/60/90 day milestones.
