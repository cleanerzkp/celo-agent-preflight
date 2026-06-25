# Celo Agent Preflight Reviewer Guide

## Setup

```bash
pnpm install
pnpm ci
```

`pnpm ci` runs tool checks, TypeScript, tests, builds, Foundry formatting/tests, and secret scanning.

## CLI Scan

```bash
pnpm --filter @celo-agent-preflight/cli dev -- check \
  --chain celo \
  --agent-id 1 \
  --output report.json
```

For metadata-only validation:

```bash
pnpm --filter @celo-agent-preflight/cli dev -- check-url \
  --metadata-url https://example.com/.well-known/agent.json \
  --no-probe-endpoints
```

Useful report commands:

```bash
pnpm --filter @celo-agent-preflight/cli dev -- hash report.json
pnpm --filter @celo-agent-preflight/cli dev -- explain report.json
```

## Attestation

Deploy the attestation contract:

```bash
cd contracts
export DEPLOYER_PRIVATE_KEY=0x...
forge script script/DeployAgentPreflightAttestation.s.sol:DeployAgentPreflightAttestation \
  --rpc-url "${CELO_RPC_URL:-https://forno.celo.org}" \
  --broadcast \
  --verify \
  --etherscan-api-key "$CELOSCAN_API_KEY"
```

The deploy script refuses Celo mainnet or Celo Sepolia broadcasts unless
`DEPLOYER_PRIVATE_KEY` is set. Local Anvil deployments may still use the default
Foundry sender.

Generate calldata without sending a transaction:

```bash
pnpm --filter @celo-agent-preflight/cli dev -- attest \
  --report report.json \
  --report-uri https://example.com/reports/report.json \
  --contract 0x0000000000000000000000000000000000000000 \
  --subject 0x0000000000000000000000000000000000000000 \
  --dry-run
```

For a live write, set `DEPLOYER_PRIVATE_KEY` and omit `--dry-run`.

## MCP

```bash
pnpm --filter @celo-agent-preflight/mcp dev
```

Exposed read-only tools:

- `scan_agent`
- `validate_erc8004_metadata`
- `check_x402_endpoint`

The MCP server calls `packages/preflight-core`; it does not duplicate scanner logic or expose write tools by default.

## Web And API

```bash
pnpm --filter @celo-agent-preflight/web dev
```

Routes:

- `/` overview dashboard
- `/scan` scan form that persists a report by hash
- `/agents` ReadyList directory
- `/reports/[hash]` report detail
- `/api/agents`
- `/api/reports`
- `/api/scan`

`/api/scan` writes canonical report JSON to `storage/reports` by default. Set
`PREFLIGHT_REPORT_DIR` to point the web app at another report storage directory.

The production build uses the webpack builder intentionally because Next 16 Turbopack currently follows monorepo TypeScript source aliases in a way that conflicts with ESM `.js` package specifiers.
