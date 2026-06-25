# Tooling, Dependencies, and Automations

## Principle

Spend most of the time sharpening the axe. For this grant, that means choosing boring, verifiable infrastructure pieces that let us ship Celo mainnet evidence quickly.

Do not optimize for the fanciest stack. Optimize for:

- audited/standard libraries;
- fast Celo mainnet deployment;
- clear contract verification;
- public evidence links;
- simple demos reviewers can verify in minutes.

## Context7 status

Context7 is useful, but it is not currently callable in this Codex session.

What I checked:

- `tool_search` did not expose Context7 MCP tools.
- installable plugin list did not include Context7.
- Exa-code was available as an alternate docs tool, but returned `401`, so it is also not usable right now.

How to add Context7 later:

- recommended CLI setup: `npx ctx7 setup`
- remote MCP endpoint: `https://mcp.context7.com/mcp`
- local MCP package: `@upstash/context7-mcp`
- API key is recommended for rate limits.

Use Context7 for docs lookup only. Do not make it a product runtime dependency.

## Codex/plugin tools to use

Installed/available from the current session and screenshots:

- **GitHub plugin**: research repos, PRs, issues; later create repo/PR if needed.
- **Vercel plugin**: best deployment path for Next.js dashboard/API if we choose Vercel.
- **Cloudflare plugin**: alternative for Workers/Pages if we choose a worker-first API.
- **Supabase plugin**: only if we need persisted report history beyond onchain hashes.
- **OpenAI Developers plugin/docs**: only if we build an LLM-powered verifier. Not needed for MVP.
- **Chrome/Browser tools**: verify demo, capture screenshots/video.
- **Codex Security plugin**: useful before submitting public contracts/API.

Not needed for MVP:

- Replit/Base44/Lovable/Wix: too much app scaffolding risk.
- Netlify/Render: okay alternatives, but not necessary if Vercel/Cloudflare are available.
- Apollo/Clay/CRM tools: not relevant.

## Runtime dependencies

### Contracts

Choose one:

- **Foundry** for fast Solidity tests/deploy scripts.
- **Hardhat** only if verification/deploy scripts are easier with existing Celo docs.

Recommended: **Foundry + forge-std**, with a small Hardhat verify fallback only if needed.

Contract libraries:

- OpenZeppelin Contracts:
  - `Ownable` or `AccessControl`
  - `ReentrancyGuard`
  - `SafeERC20`
  - ERC-20 interface
- Solidity `^0.8.24` or newer stable compatible with chosen tooling.

Contracts:

- `AgentPreflightAttestor`

Defer registry and escrow contracts. The fastest grant-proof contract is an attestor that writes report hashes, agent IDs, scores, and report URIs to Celo mainnet.

### TypeScript worker/API

Required:

- Node.js 22+ or 24+
- TypeScript
- `viem`
- `zod`
- `tsx`
- `dotenv`

Useful:

- `pino` for logs
- `hono` or lightweight Next.js route handlers
- `@selfxyz/agent-sdk` only if we implement Self Agent ID registration/checks directly
- x402 packages only if we implement payment-route probing beyond response-shape checks in MVP

Avoid until needed:

- large agent frameworks;
- LangChain/LangGraph;
- complex indexing frameworks;
- custom databases before the demo needs them.

### Frontend/dashboard

Recommended:

- Next.js or Vite React.

If we need speed and hosted API routes: **Next.js on Vercel**.
If we want minimal surface area: **Vite + Hono/Cloudflare Worker**.

UI dependencies:

- React
- Tailwind or plain CSS
- shadcn/ui only if we need forms/tables quickly
- lucide-react for icons

## External services

Required:

- Celo RPC provider: public RPC is okay for demo; QuickNode is better if available.
- Celo explorer/Celoscan links for evidence.
- GitHub public repo.
- Deployment host for demo/API.

Likely required:

- Domain or simple hosted URL.
- Short demo video.
- KarmaGAP profile.

Optional:

- Supabase/Postgres for report history.
- Sentry for demo monitoring.
- OpenAI/LLM API for natural-language report summaries.

## Automations we should create

### CI

On every push/PR:

- install dependencies with locked package manager;
- run Solidity tests;
- run TypeScript typecheck;
- run lint;
- run unit tests;
- run contract size/gas snapshot if time allows;
- build dashboard/API.

### Security

Before submission:

- dependency audit;
- secret scan;
- static contract scan;
- no private keys in repo;
- verify env var list is documented.

### Evidence generation

Scripted command:

- deploy or read deployed contract addresses;
- generate demo readiness report;
- publish report hash through `AgentPreflightAttestor`;
- write `evidence.json` with tx hashes, addresses, report URL, report hash, and explorer links.

### Grant deadline operations

Manual or Codex automation:

- daily source refresh until 30 June 2026;
- daily evidence checklist check;
- final submission reminder on 30 June 2026.

Do not create these reminders until the exact submission owner/timezone is confirmed.

## Recommended minimal stack

Use this unless a blocker appears:

- pnpm 10+
- Node 24
- TypeScript
- Foundry
- Solidity + OpenZeppelin
- viem
- zod
- Next.js on Vercel
- GitHub Actions
- Celo mainnet + Celo Sepolia rehearsal

## What not to build

- generic MCP server;
- generic wallet assistant;
- complex multi-agent framework;
- pretty dashboard without onchain evidence;
- elaborate AI evaluator before deterministic checks work.

The grant wants infrastructure other agents/builders depend on. Our proof should be a scanner, MCP/CLI/API surface, report, and Celo attestation flow, not a vibe.
