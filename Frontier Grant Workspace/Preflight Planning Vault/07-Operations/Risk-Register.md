# Risk Register

## Risk: looks like another explorer
Mitigation: lead with MCP/CLI/API conformance checks, reproducible reports, and onchain attestations. Position explorers as discovery surfaces and Preflight as readiness infrastructure.

## Risk: x402/Celo support ambiguity
Mitigation: validate exact Celo x402 route. If hosted facilitator support is not available, implement or document a Celo-compatible payment verification path and phrase it carefully.

## Risk: too many checks for MVP
Mitigation: ship ERC-8004 metadata, endpoints, MCP manifest, x402 402 response, Celo activity, and attestation first. Defer deep security/payment fuzzing.

## Risk: no real users before submission
Mitigation: scan existing agents first and publish reports before applying. Outreach should start immediately.

## Risk: report score becomes misleading
Mitigation: call it readiness/conformance, not safety or truth. Include severity and evidence per check.
