# GitHub Landscape Scan

Date: 25 June 2026

## Summary

GitHub research confirms the Celo agent ecosystem is already active. There are many agent apps, several docs/skills PRs around ERC-8004/x402/Self, and at least one direct adjacent project around coordination receipts.

This strengthens the earlier conclusion: we should not build a generic Celo agent, generic MCP wrapper, or generic wallet assistant. The better gap is **conformance infrastructure**: verifiable reports, service readiness checks, payment-route diagnostics, and Celo report attestations that other agents can depend on.

## Notable public repos found

- `AgenticEye/AgenticEye-celo-onchain-agents-`
- `aibo-app/jara-agent`
- `heen-ai/agent-kyc-gateway`
- `viktorhugo/remesa-scout`
- `winsznx/warrant`
- `Nuru-AI/sippar-ask-humans`
- `artugrande/minitruco-celo-agent`
- `wkalidev/celobank-agent`
- `SimpleX-T/chama-agent`
- `GigaHierz/utilitypay`
- `artugrande/celo-mcp`

Pattern: lots of app-specific agents and one Celo MCP wrapper surfaced. This is crowded enough that "another agent app" is weak for Frontier.

## Notable PRs and signals

### Celo docs and skills are already covering basics

- `celo-org/docs#2131`: adds ERC-8004 and x402 AI agent protocol docs.
- `celo-org/docs#2134`: features ERC-8004/x402 on docs home.
- `celo-org/agent-skills#1`: adds 8004 and x402 agent skills.
- `celo-org/celopedia-skills#25`: Self Agent ID registration reference.
- `celo-org/celopedia-skills#26`: Agent Visa, Self Agent ID, hackathon, fee-currency updates.

Implication: do not compete with official docs/skills. Build a missing operational layer.

### Existing agents are integrating Celo/Self/ERC-8004

- `cryptoflops/minipay-bot#12`: release notes mention Self Agent ID and ERC-8004 registries.
- `robertocarlous/Cowry#8`: migrates to Celo and adds Self Agent ID/onchain wallet.
- `RomarioKavin1/clawrence#1`: migration to Celo Sepolia, ERC-8004 registries, thirdweb x402.

Implication: agents need readiness, endpoint, identity, and payment-route evidence around these integrations.

### Adjacent infrastructure exists

- `Merit-Systems/awesome-agentic-commerce#299`: adds Cairn, described as a coordination + verifiable-receipt layer for agentic payments with onchain receipts and ERC-8004 identity on Celo.
- `x402-foundation/x402#1780`: adds Ultravioleta DAO facilitator with Celo support, escrow settlement, and ERC-8004 reputation.

Implication: payment receipts/coordination is already emerging. We should differentiate by focusing on Celo agent Preflight reports, MCP/CLI checks, and builder-facing verification APIs, not only receipts.

## Competitive read

Weak idea after this scan:

> Build a Celo MCP server or wallet agent.

Better idea:

> Build Celo Agent Preflight: an MCP/CLI/API readiness layer that checks ERC-8004 metadata, endpoint readiness, MCP/A2A shape, Self Agent ID evidence, Celo activity, and x402-compatible payment-route configuration, then publishes report hashes onchain.

## Dependencies implied by landscape

- viem, because Celo docs use it for fee currency support.
- x402 packages only for payment-route probing if response-shape checks are insufficient.
- Self Agent ID SDK only if direct registration/checking is in scope.
- OpenZeppelin only if needed; the MVP attestor can be a very small custom contract.
- No heavy agent framework in MVP.

## Follow-up research if time allows

- Inspect Cairn more deeply and decide whether to integrate or clearly differentiate.
- Inspect Ultravioleta x402 facilitator docs for Celo facilitator semantics.
- Inspect Self Agent ID PR details for current API host and registration gotchas.
- Check Celo Agent Visa submission requirements.
