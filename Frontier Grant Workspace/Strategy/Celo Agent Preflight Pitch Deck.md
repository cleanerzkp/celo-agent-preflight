# Celo Agent Preflight

## Slide 1: Title

**Celo Agent Preflight**

An MCP, CLI, API, and onchain attestation layer for deploying, verifying, and interacting with ERC-8004 agents on Celo.

Tagline: **Before an agent ships, calls, or pays another agent, run Preflight.**

## Slide 2: The Problem

Celo's agent stack is growing around ERC-8004, Self Agent ID, MCP/A2A endpoints, and x402-compatible payments.

But discovery is not the same as readiness.

A registration can exist even when:

- metadata is incomplete or stale
- endpoints are dead
- MCP/A2A services are not callable
- payment routes are misconfigured
- Self Agent ID is missing
- Celo activity claims are unverifiable
- another agent cannot safely decide whether to interact

Today these checks are manual, fragmented, and hard to reproduce.

## Slide 3: Why Now

The Frontier Pool is funding infrastructure for Celo's AI and agent economy: protocols, tooling, and services other builders or agents rely on.

Celo now has the raw ingredients:

- ERC-8004 identity and reputation registries
- Self Agent ID for sybil-resistant agent identity
- x402-compatible payment patterns emerging for agent commerce
- Celo Agent Skills for builders
- public discovery surfaces such as 8004scan and AgentScan
- active hackathon, DevRel, and grant-driven agent builders

The missing piece is a repeatable readiness workflow that turns those primitives into deployable, verifiable agent infrastructure.

## Slide 4: The Solution

**Celo Agent Preflight** is a conformance and readiness gate for Celo agents.

It provides:

- **MCP server** for Claude Code, Codex, Cursor, and autonomous agents
- **CLI** for builders and CI before launch
- **API** for agents to query before interaction or payment
- **JSON report schema** with reproducible evidence
- **public report pages** for human review
- **ReadyList** as a ChainList-style directory of scanned Celo agents
- **Celo mainnet attestations** for report hashes and readiness outcomes

Preflight is runnable by humans, CI systems, coding agents, and autonomous agents.

## Slide 5: Product Thesis

Explorers show who exists.

Preflight proves which deployment claims are currently reproducible.

ReadyList makes those reproducible reports discoverable:

> ChainList helps users connect to EVM networks. ReadyList helps agents and builders connect to usable Celo agents.

It does not claim an agent is honest, safe, or high quality. It verifies that identity, metadata, endpoints, payment configuration, activity, and evidence claims can be checked by another machine.

The score is a **readiness/conformance score**, not a trust score.

## Slide 6: Core Workflow

1. Builder prepares or registers an ERC-8004 agent.
2. Builder runs Preflight locally, in CI, or through an MCP client.
3. Preflight validates identity, metadata, endpoints, payment readiness, Self Agent ID status, and Celo activity.
4. Preflight generates a signed JSON report and public report page.
5. Builder publishes an onchain attestation of the report hash on Celo.
6. ReadyList indexes the latest report, status, score, and attestation.
7. Another agent queries ReadyList, API, or MCP before calling or paying that agent.

Friendly CLI:

```bash
npx celo-agent-preflight check --chain celo --agent-id 1870
```

Canonical CLI:

```bash
npx celo-agent-preflight check \
  --registry eip155:42220:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 \
  --agent-id 1870
```

## Slide 7: MCP Server

The MCP server is the main wedge.

Initial tools:

- `scan_agent(agent_id | address | metadata_url)`
- `validate_erc8004_metadata(metadata_url)`
- `check_domain_proof(agent_id | metadata_url)`
- `check_mcp_endpoint(url)`
- `check_a2a_endpoint(url)`
- `check_x402_endpoint(url, chain_id, token)`
- `check_self_agent_id(agent_id | wallet)`
- `check_celo_activity(wallet | contract)`
- `compare_agents(agent_ids[])`
- `preflight_before_payment(agent_id, endpoint)`
- `generate_readiness_report(agent_id)`
- `publish_attestation(report_hash, score)`
- `explain_remediation(report)`

This lets an assistant or autonomous agent ask:

> Is this Celo agent ready enough for my next action?

and receive evidence, not vibes.

## Slide 8: MVP Readiness Checks

Initial MVP checks:

- ERC-8004 registration exists on Celo
- registry metadata URI resolves
- metadata matches the expected ERC-8004 registration shape
- services array includes reachable endpoints
- domain ownership proof exists when declared
- MCP endpoint exposes a valid tool manifest
- A2A endpoint responds if declared
- x402-compatible endpoint returns a valid `402 Payment Required` response when declared
- payment route declares Celo chain/token/recipient consistently
- Self Agent ID is present or clearly missing
- agent wallet or contract has recent Celo mainnet activity
- contract/source links are verifiable where relevant
- report JSON hashes reproducibly
- report hash is attested on Celo mainnet

## Slide 9: x402 Caveat

Preflight should be precise about x402.

The reference x402 EVM SDK can support custom EVM chains and ERC-20 tokens when configured, but hosted facilitator support is network-specific. If Celo is not supported by a chosen hosted facilitator, Preflight identifies that requirement instead of pretending the route is ready.

Safer product wording:

> Preflight validates x402-compatible payment routes for Celo agents, including network identifier, recipient, token, 402 response shape, and facilitator compatibility. Where hosted facilitator support is unavailable, Preflight reports the exact missing configuration or custom facilitator requirement.

That ambiguity is not a weakness of the product. It is one of the reasons the product should exist.

## Slide 10: Differentiation

**8004scan / AgentScan**

- discover registered agents
- show registry profiles
- expose rankings, feedback, and ecosystem browsing
- help humans inspect what exists

**Celo Agent Preflight**

- validates whether deployment claims are reproducible
- runs through MCP, CLI, API, CI, and autonomous agents
- checks ERC-8004, MCP, A2A, Self Agent ID, x402-compatible payment routes, and Celo activity together
- emits structured remediation steps
- produces signed JSON reports
- writes report hashes to Celo
- gives agents a pre-interaction/pre-payment gate

The relationship is complementary: explorers are discovery surfaces; Preflight is conformance infrastructure.

## Slide 11: Example Use Case

A Celo agent exposes ERC-8004 identity, MCP tools, A2A metadata, and paid API routes.

Preflight verifies:

- registration and metadata resolve correctly
- declared endpoints are live
- MCP tools are discoverable
- A2A card is valid if declared
- x402-compatible route returns valid payment requirements
- Celo recipient/token/network are consistent
- Self Agent ID status is visible
- report is reproducible and attested

For a builder, Preflight is the launch checklist. For a consuming agent, it is the trust gate before interaction.

## Slide 12: Why This Helps Celo

Celo wants agents that do real economic work, not just thin registrations.

Preflight increases:

- successful agent deployments
- ERC-8004 metadata quality
- Self Agent ID adoption
- x402-compatible payment readiness
- Celo mainnet transaction evidence
- confidence for agents interacting with other agents
- developer and grant-review velocity

It reduces:

- dead registrations
- broken endpoints
- unverifiable claims
- failed payment integrations
- manual reviewer burden
- weak ecosystem telemetry

## Slide 13: First 10 Users

The first 10 users are existing Celo agent builders and Frontier applicants.

Activation path:

1. Scan visible Celo agents from 8004scan, AgentScan, hackathons, and public repos.
2. Publish 3-10 free readiness reports.
3. List each report in ReadyList.
4. Send each builder one concrete issue and one quick win.
5. Offer a small PR adding the report link, ReadyList link, or badge to docs/metadata.
6. Ask permission to list them as early users.
7. Use their fixes as evidence that Preflight improves ecosystem readiness.

The first users do not need to be convinced to deploy agents. They already did. They need a launch-quality proof layer.

## Slide 14: First 100 Agents

Scale path:

- auto-index Celo ERC-8004 registrations daily
- generate draft reports for public agents
- publish ReadyList as the default latest-readiness index
- mark stale reports when endpoints or scans age out
- let builders claim and re-run reports
- provide GitHub Action for PR checks
- expose MCP server for assistant-driven setup
- publish a "Celo Agent Ready" badge
- create DevRel/hackathon onboarding checklist
- integrate templates for Celo Agent Skills, ERC-8004 metadata, Self Agent ID, and x402-compatible endpoints

Goal: make Preflight the default final step before announcing a Celo agent.

## Slide 15: MVP Scope

MVP deliverables:

- open-source scanner library
- CLI commands: `check`, `report`, `attest`
- MCP server
- report lookup API
- ERC-8004 metadata and endpoint validator
- MCP/A2A checker
- x402-compatible 402 response/payment-route checker
- Self Agent ID status check
- Celo activity check
- verified Celo mainnet attestation contract
- public report pages
- 3-10 manually reviewed reports before submission
- demo video showing CLI/MCP/API/report/attestation flow

Out of scope for MVP:

- full smart contract audit replacement
- subjective AI quality ranking
- guarantees that agent outputs are true
- broad multi-chain indexing
- paid marketplace
- complex escrow

## Slide 16: Technical Architecture

Components:

- TypeScript monorepo
- scanner package
- MCP server package
- CLI package
- API/report service
- Celo RPC reads via viem
- ERC-8004 registry reads
- endpoint probes for MCP, A2A, and web metadata
- x402-compatible response/protocol checks
- Self Agent ID integration
- Solidity attestation contract
- JSON report storage by hash

Onchain primitive:

```solidity
event AgentReportAttested(
    uint256 indexed agentId,
    bytes32 indexed reportHash,
    uint16 score,
    string reportURI
);
```

## Slide 17: Evidence Before Applying

The application should show proof already live.

Minimum evidence:

- public GitHub repository
- running CLI/MCP prototype
- verified Celo mainnet attestation contract
- deployment transaction hash
- 3 public reports minimum
- 3 report attestation transaction hashes
- demo video

Stronger evidence:

- 10 public reports
- 1-2 external builders acknowledging reports
- 1 public PR/issue opened from a report
- 1 badge/report link added to a public repo or agent metadata

With this, the application becomes "we are expanding live infrastructure," not "we want to build a scanner."

## Slide 18: Sustainability

Free ecosystem layer:

- public scans
- CLI
- MCP server
- JSON reports
- basic badges
- open-source templates

Future paid or hosted layer:

- continuous monitoring
- team dashboards
- private pre-launch checks
- webhook alerts
- deeper payment/facilitator tests
- premium verification reports for grant/app-store submissions

Near-term value is ecosystem infrastructure. Long-term value is agent reliability monitoring.

## Slide 19: Grant Ask

Frontier funding supports:

- mainnet deployment and verification
- MCP/CLI/API implementation
- onchain attestation contract
- first 10-100 agent onboarding
- public documentation
- integrations with ERC-8004, x402-compatible payment routes, Self Agent ID, and Celo Agent Skills
- evidence package for Celo DevRel, hackathon teams, and grant reviewers

The grant turns a manual Celo agent launch checklist into reusable infrastructure for the whole agent ecosystem.

## Slide 20: One-Sentence Pitch

**Celo Agent Preflight is a conformance, readiness, and verification layer for Celo's agent economy, exposed through MCP, CLI, API, public reports, ReadyList, and Celo mainnet attestations.**

## Slide 21: Why We Win

- Frontier-shaped infrastructure, not a generic AI app
- complements existing explorers instead of competing with them
- helps current Celo agent builders immediately
- creates verifiable Celo mainnet activity
- uses Celo's agent stack directly
- gives coding assistants and autonomous agents a real decision tool
- achievable MVP with visible proof before application review
- activation path starts from agents already deployed today
