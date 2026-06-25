# MVP Architecture

## Components

- TypeScript monorepo
- MCP server package
- CLI package
- scanner library
- Next.js or lightweight report site
- ReadyList directory surface
- API route for report lookup
- API route for agent index lookup
- Celo RPC reads via viem
- Solidity attestation contract
- JSON report storage by hash
- agent index generated from reports first, then ERC-8004 indexing later

## System flow

```txt
ERC-8004 registry / metadata URL / manual target
        ↓
Preflight scanner
        ↓
Canonical JSON report
        ↓
Report hash
        ↓
Celo attestation event
        ↓
Public report page
        ↓
ReadyList agent directory + API + badges + MCP answers
```

In the MVP, ReadyList should be derived from published reports rather than a separate crawler. Continuous ERC-8004 indexing is a v0.2 feature after report generation and attestation are stable.

## MCP tools

- scan_agent(agent_id | address | metadata_url)
- validate_erc8004_metadata(metadata_url)
- check_x402_endpoint(url, chain_id, token)
- check_self_agent_id(agent_id | wallet)
- check_celo_activity(wallet | contract)
- generate_readiness_report(agent_id)
- publish_attestation(report_hash, score)
- explain_remediation(report)
- get_readylist_entry(agent_id | address)

## Attestation event

```solidity
event AgentReportAttested(
    uint256 indexed agentId,
    bytes32 indexed reportHash,
    uint16 score,
    string reportURI
);
```

## MVP checks

- ERC-8004 identity registry read
- agentURI resolves
- metadata schema validation
- services array validation
- endpoint reachability
- MCP endpoint manifest check
- A2A agent card check if declared
- x402 402 response check if declared
- Celo recipient/token/chain check
- Self Agent ID present or missing
- recent Celo wallet/contract activity
- contract/explorer verification links
- reproducible JSON report hash

## ReadyList API shape

MVP routes:

```txt
GET /agents
GET /agents/celo/:agentId
GET /api/agents
GET /api/agents/celo/:agentId
GET /api/reports/:hash
GET /badges/celo/:agentId.svg
```

Each ReadyList entry should be machine-consumable:

```json
{
  "chainId": 42220,
  "registry": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  "agentId": "1870",
  "owner": "0x...",
  "status": "ready|warning|not_ready|stale|unverified",
  "score": 87,
  "capabilities": {
    "mcp": "pass|warn|fail|missing",
    "a2a": "pass|warn|fail|missing",
    "x402": "pass|warn|fail|missing",
    "selfAgentId": "verified|claimed|missing|unchecked"
  },
  "latestReportHash": "0x...",
  "latestReportUrl": "https://...",
  "attestationTx": "0x...",
  "lastScanAt": "2026-06-25T00:00:00.000Z"
}
```

The UI can expose "Use this agent" as a JSON/CLI/MCP config copy action rather than a wallet-connect button.
