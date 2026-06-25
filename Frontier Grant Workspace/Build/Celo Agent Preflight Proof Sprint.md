# Celo Agent Preflight Proof Sprint

Goal: submit the Frontier application as live infrastructure, not a concept.

## North star

By submission, we should be able to say:

> We deployed a verified Celo mainnet attestation contract, scanned real Celo agents, published public readiness reports, listed them in ReadyList, and wrote report hashes onchain.

## Build order

1. CLI scanner
2. JSON report schema
3. ERC-8004 metadata validation
4. endpoint reachability checks
5. MCP manifest checker
6. A2A agent-card checker if declared
7. Celo activity checker
8. attestation contract
9. public report page
10. ReadyList report-backed agent index
11. MCP server
12. x402-compatible payment-route checker
13. Self Agent ID integration
14. GitHub Action
15. badge/ReadyList filters

The first ten create grant-verifiable evidence fastest. ReadyList should initially index the reports we already publish, not require a full crawler.

## Minimum viable proof

- [ ] public GitHub repository
- [ ] `npx celo-agent-preflight check --chain celo --agent-id <id>`
- [ ] deterministic JSON report
- [ ] report hash generation
- [ ] verified Celo mainnet attestation contract
- [ ] at least 3 public reports
- [ ] at least 3 Celo attestation transactions
- [ ] one public report page
- [ ] ReadyList `/agents` index showing the reported agents
- [ ] MCP server with `scan_agent` and `explain_remediation`
- [ ] 2-4 minute demo video

## Strong proof

- [ ] 10 public reports
- [ ] 1 public PR or issue opened from a report
- [ ] 1 badge/report link added to a public repo or agent metadata
- [ ] one external builder acknowledgment
- [ ] API endpoint used by the demo
- [ ] ReadyList filters for MCP, A2A, x402, Self Agent ID, attested, and needs remediation
- [ ] MCP query: "Should my agent call/pay this agent?"

## Report schema v0

```json
{
  "schemaVersion": "0.1.0",
  "network": "eip155:42220",
  "agentRegistry": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  "agentId": "1870",
  "generatedAt": "2026-06-25T00:00:00.000Z",
  "score": 0,
  "status": "pass|warn|fail",
  "checks": [
    {
      "id": "erc8004.metadata.resolves",
      "title": "ERC-8004 metadata resolves",
      "status": "pass|warn|fail|skipped",
      "severity": "critical|high|medium|low",
      "observed": "string",
      "remediation": "string",
      "source": "url-or-chain-reference"
    }
  ],
  "reportHash": "0x...",
  "attestationTx": "0x..."
}
```

## Check categories

100 points total:

- 20 ERC-8004 identity and metadata
- 15 endpoint reachability and domain proof
- 15 MCP/A2A service conformance
- 15 x402-compatible Celo payment readiness
- 10 Self Agent ID / sybil-resistance signal
- 10 Celo mainnet activity and contract evidence
- 10 reproducibility, report integrity, and attestation
- 5 docs, open-source metadata, and remediation clarity

Do not call this a trust score or safety score. It is a readiness/conformance score.

## Attestation contract v0

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgentPreflightAttestor {
    event AgentReportAttested(
        uint256 indexed agentId,
        bytes32 indexed reportHash,
        uint16 score,
        string reportURI
    );

    function attestAgentReport(
        uint256 agentId,
        bytes32 reportHash,
        uint16 score,
        string calldata reportURI
    ) external {
        require(score <= 10000, "score too high");
        emit AgentReportAttested(agentId, reportHash, score, reportURI);
    }
}
```

Use basis points for score if we want decimals later: `8350` means `83.50`.

## Demo script

1. Open a Celo ERC-8004 agent profile.
2. Run CLI preflight.
3. Show pass/warn/fail checks.
4. Fix or explain one issue.
5. Generate report JSON.
6. Hash report.
7. Attest report hash on Celo.
8. Open report page.
9. Open ReadyList and filter to the scanned agent.
10. Copy the "Use this agent" JSON or CLI command.
11. Ask MCP: "Should my agent call/pay this agent?"
12. MCP returns readiness status, evidence, and remediation.

## Outreach list

Start with:

- public Celo agents listed on 8004scan
- agents visible on AgentScan
- Celo hackathon winners/builders
- Frontier Pool applicants if publicly discoverable
- teams using `celo-org/agent-skills`
- Toppa-style x402/API agents
- Self Agent ID builders

## Application wording to protect

Use:

> Preflight validates x402-compatible payment routes for Celo agents, including network identifier, recipient, token, 402 response shape, and facilitator compatibility.

Avoid:

> Celo x402 is fully supported by every hosted facilitator.

Use:

> Preflight proves readiness claims are reproducible.

Avoid:

> Preflight proves the agent is safe or trustworthy.
