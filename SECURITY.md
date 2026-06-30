# Security Policy

## Supported Branch

Security fixes are accepted for `master`, the public release branch for Celo Agent Preflight.

## Reporting a Vulnerability

Please do not open a public issue for a suspected vulnerability. Use GitHub's private vulnerability reporting flow when it is available for this repository, or contact the maintainer directly through the GitHub profile.

Include the affected route, package, contract, or workflow; a minimal reproduction; expected impact; and any public deployment assumptions. The project does not currently operate a paid bug bounty program.

## Security Expectations

- Public scan writes must be disabled or authenticated unless a deliberate public scanner mode is configured.
- Secrets, private keys, RPC credentials, and deployment tokens must stay out of git history.
- Changes touching scanner fetches, report publication, x402 payment evidence, attestation writes, or GitHub/Vercel deployment settings need explicit security review.
