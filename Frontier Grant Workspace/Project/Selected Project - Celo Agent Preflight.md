# Selected Project: Celo Agent Preflight

## One-line pitch

Celo Agent Preflight is a conformance, readiness, and verification layer for Celo's agent economy, exposed through MCP, CLI, API, public reports, ReadyList, and Celo mainnet attestations.

## Core thesis

**Discovery is not the same as readiness.**

ERC-8004 can make an agent discoverable, and explorer surfaces can show that it exists. But a registered agent can still have broken metadata, dead endpoints, missing Self Agent ID, unclear Celo activity, or misconfigured payment routes.

Preflight answers the operational question:

> Is this Celo agent ready enough for another builder, assistant, or autonomous agent to call, integrate, or pay?

## Product

The MVP has six parts:

1. **Scanner library**
   - Reads ERC-8004 registry data and agent metadata.
   - Validates declared services, endpoint reachability, MCP/A2A shape, x402-compatible payment route shape, Self Agent ID status, and Celo activity evidence.

2. **CLI**
   - Lets builders run `npx celo-agent-preflight check` before launch, grant submission, or CI merge.
   - Outputs pass/warn/fail checks with remediation.

3. **MCP server**
   - Lets Claude Code, Codex, Cursor, and autonomous agents run readiness checks directly.
   - Exposes tools such as `scan_agent`, `check_x402_endpoint`, `preflight_before_payment`, and `explain_remediation`.

4. **Public reports and API**
   - Produces reproducible JSON reports and human-readable report pages.
   - Gives other agents an API response they can query before interaction.

5. **ReadyList**
   - A ChainList-style directory of Celo agents sorted and filtered by last reproducible readiness report.
   - Shows status, score, MCP/A2A/x402/Self/Celo activity indicators, latest report hash, and attestation transaction.

6. **Celo attestation contract**
   - Writes report hash, agent ID, readiness score, and report URI to Celo mainnet.
   - Turns readiness checks into verifiable ecosystem evidence.

## ReadyList model

The product analogy is:

> ChainList helps users connect to EVM networks. ReadyList helps agents and builders connect to usable Celo agents.

Preflight is the readiness engine. ReadyList is the public directory powered by Preflight reports.

This makes the product more legible than "scanner" alone:

- ERC-8004 makes agents discoverable.
- Preflight proves which discovery claims are reproducible.
- ReadyList makes those reproducible reports easy to browse, query, and reuse.

ReadyList should expose machine-consumable actions instead of only human links:

- copy MCP config
- copy A2A endpoint
- copy x402 endpoint
- run Preflight locally
- view report JSON
- verify attestation
- generate badge

## What this is not

- not another generic agent explorer
- not a vanity badge site
- not a full smart contract audit replacement
- not a claim that an agent is honest, safe, or high quality
- not a generic MCP wrapper

Preflight verifies that deployment, identity, endpoint, payment, and activity claims are currently reproducible.

## Differentiation

8004scan and AgentScan are complementary discovery surfaces. They help users see registered agents and ecosystem activity.

Preflight is the conformance layer underneath deployment and interaction:

- explorers show who exists
- Preflight proves which claims can be checked by another machine
- ReadyList shows which agents have fresh reproducible reports
- explorers are human-facing discovery
- Preflight is MCP/CLI/API/CI infrastructure
- explorers show profiles
- Preflight emits remediation and attestable reports

## Why Celo

Celo is the right home because:

- ERC-8004 is live in the Celo agent stack.
- Celo docs and ecosystem work already point builders toward AI agents, x402, Self, and ERC-8004.
- low-cost mainnet transactions make report attestations practical.
- Celo stablecoin rails are a natural fit for agent payments.
- Self Agent ID gives a Celo-aligned sybil-resistance signal.
- Celo DevRel, hackathons, and Frontier applicants create a real first-user pool.

## x402 positioning

Preflight should avoid overclaiming hosted facilitator support.

Use this wording:

> Preflight validates x402-compatible payment routes for Celo agents, including network identifier, recipient, token, 402 response shape, and facilitator compatibility. Where hosted facilitator support is unavailable, Preflight reports the exact missing configuration or custom facilitator requirement.

This makes payment ambiguity part of the problem Preflight solves.

## Why Frontier

This maps directly to Frontier's infrastructure focus:

- **Agent identity/discovery:** validates ERC-8004 registry data, metadata, service declarations, and domain proof.
- **Agent-to-agent transactions:** checks x402-compatible payment readiness before another agent pays.
- **AI-native developer tooling:** ships MCP, CLI, API, CI, and JSON reports.
- **Verification/trust infrastructure:** publishes reproducible reports and Celo mainnet attestations.
- **Interoperability:** checks ERC-8004, MCP, A2A, x402-compatible routes, Self Agent ID, and Celo activity together.

## MVP success criteria before applying

- [ ] Public GitHub repository.
- [ ] Runnable CLI prototype.
- [ ] Runnable MCP server prototype.
- [ ] Verified Celo mainnet attestation contract.
- [ ] At least 3 public readiness reports.
- [ ] ReadyList `/agents` index populated from those reports.
- [ ] At least 3 Celo report-attestation transactions.
- [ ] Demo video showing CLI/MCP/API/report/attestation flow.
- [ ] Evidence Register filled with explorer links.

Stretch proof:

- [ ] 10 public readiness reports.
- [ ] 1-2 external builders acknowledge reports.
- [ ] 1 public PR/issue opened from a report.
- [ ] 1 badge/report link added to a public repo or metadata file.

## First 10 users

The first 10 users are existing Celo agent builders and Frontier applicants.

Activation loop:

1. Scan public Celo agents from 8004scan, AgentScan, hackathons, and GitHub.
2. Publish a free readiness report.
3. Send the builder one concrete issue and one quick win.
4. Offer a PR adding the report link or badge to docs/metadata.
5. Ask permission to list them as early users.

## First 100 agents

Scale path:

- daily ERC-8004 Celo agent indexing
- draft report generation for public agents
- ReadyList filters and stale-report detection
- claimed-agent re-runs
- GitHub Action for pre-merge checks
- MCP server for assistant-driven setup
- "Celo Agent Ready" badge
- DevRel/hackathon launch checklist

## Grant-funded milestones

Milestone 1: Live conformance core.

- scanner library
- CLI
- report schema
- ERC-8004 metadata and endpoint checks
- Celo activity checks
- first public reports

Milestone 2: Onchain evidence.

- Celo mainnet attestation contract
- contract verification
- report hash publication
- report page hash verification
- ReadyList index links reports to agents and attestations
- evidence documentation

Milestone 3: Agent-native interfaces.

- MCP server
- API
- `preflight_before_payment` workflow
- x402-compatible route checker
- Self Agent ID check

Milestone 4: Adoption.

- first 10 builders/agents contacted
- GitHub Action
- badge/report-link flow
- public onboarding docs
- final delivery report with tx hashes and usage evidence

## Naming

Use **Celo Agent Preflight**.

Alternatives if needed:

- AgentPreflight Celo
- Celo Agent Ready
- Preflight402
- AgentConform Celo
