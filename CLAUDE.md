# Claude Code Project Notes

This project has the Celo Agent Skills installed locally under `.claude/skills`.

Before implementing Celo agent infrastructure, read the relevant skills with:

```bash
npx openskills read 8004,x402
```

For the Frontier grant MVP, prioritize these skills:

- `8004` for ERC-8004 identity, reputation, registry integration, and agent discoverability.
- `x402` for HTTP-native payments, pay-per-use APIs, and agent micropayment flows.
- `evm-foundry`, `viem`, `celo-rpc`, and `contract-verification` for contracts, scripts, deployment, and evidence.

The working project direction is Celo Agent Assurance: Celo-native infrastructure that lets builders verify agent identity, endpoint readiness, onchain activity, and payment completion before relying on ERC-8004/x402 services.
