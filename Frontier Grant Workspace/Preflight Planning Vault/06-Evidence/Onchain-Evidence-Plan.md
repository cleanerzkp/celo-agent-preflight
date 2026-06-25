# Onchain Evidence Plan

## Required evidence for grant submission

- Celo mainnet attestation contract address
- verified source code link
- deployment transaction hash
- at least 3 to 10 report attestation transaction hashes
- sample report hash and JSON file
- ERC-8004 agent ID for Preflight if applicable
- Self Agent ID proof/status
- demo video showing CLI/MCP/API/report/attestation flow

## Event design

```solidity
event AgentReportAttested(
    uint256 indexed agentId,
    bytes32 indexed reportHash,
    uint16 score,
    string reportURI
);
```

## Demo transaction sequence

1. Deploy attestation contract on Celo mainnet.
2. Register Preflight agent/project if applicable.
3. Run report against a test agent.
4. Publish report JSON.
5. Hash report.
6. Attest hash onchain.
7. Show report page verifying hash and transaction.
8. Show ReadyList entry linking agent, report, status, score, and attestation tx.
9. Query via MCP/API before interacting with target agent.
