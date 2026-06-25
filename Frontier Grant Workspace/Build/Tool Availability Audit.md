# Tool Availability Audit

Date: 2026-06-25

Purpose: verify whether this Celo Agent Preflight workspace has the tools, plugins, skills, and local CLIs needed for the grant sprint.

## Final status

The repo is ready to build.

Verified with:

```bash
pnpm doctor
pnpm peers check
pnpm ignored-builds
pnpm audit --audit-level moderate
pnpm security:secrets
pnpm security:osv
pnpm security:semgrep
brew bundle check --file Brewfile
```

Results:

- `pnpm doctor`: passed.
- `pnpm peers check`: passed.
- `pnpm ignored-builds`: no pending ignored builds; only optional websocket perf packages are explicitly disabled.
- `pnpm audit --audit-level moderate`: no known vulnerabilities.
- `pnpm security:secrets`: no leaks found.
- `pnpm security:osv`: no issues found.
- `pnpm security:semgrep`: 0 findings.
- `brew bundle check`: dependencies satisfied.

## Repo-level files added

- `.mise.toml` pins Node `24.17.0`.
- `package.json` pins `pnpm@11.9.0` and declares project tooling.
- `pnpm-workspace.yaml` defines monorepo package globs and pnpm build-script approvals.
- `pnpm-workspace.yaml` also pins patched transitive `ws` and `postcss` versions through pnpm overrides.
- `pnpm-lock.yaml` locks the installed dependency graph.
- `Brewfile` installs security CLIs.
- `.env.example` documents required environment variables.
- `.semgrepignore` excludes generated dependency/build paths.
- `.gitleaks.toml` excludes generated dependency/build paths.
- `contracts/foundry.toml` defines Foundry defaults for Celo.
- `contracts/remappings.txt` defines OpenZeppelin and forge-std remappings.
- `scripts/tool-doctor.mjs` verifies the toolchain.

## Verified local runtime and CLIs

`pnpm doctor` passes with:

- Node: `v24.17.0`
- pnpm: `11.9.0`
- Corepack: `0.35.0`
- forge: `1.7.1`
- cast: `1.7.1`
- anvil: `1.7.1`
- solc: `0.8.24`
- slither: `0.11.5`
- wrangler: `4.104.0`
- semgrep: `1.167.0`
- gitleaks: `8.30.1`
- osv-scanner: `2.4.0`
- vercel: `50.37.1`
- gh: `2.95.0`
- ctx7: `0.5.3`
- context7-mcp: `3.2.2`

Note: non-login Codex shell resolution may still find Homebrew Node first. The repo and normal login shell are pinned correctly. Use `zsh -lic 'cd /Users/kacper/Documents/Celo && pnpm doctor'` if checking from Codex tool calls.

## Project Celo agent skills

Installed with `openskills` under `.claude/skills` and exposed in `AGENTS.md`:

- `8004`
- `bridging`
- `celo-composer`
- `celo-defi`
- `celo-rpc`
- `celo-stablecoins`
- `contract-verification`
- `evm-foundry`
- `evm-hardhat`
- `evm-wallet-integration`
- `fee-abstraction`
- `minipay-integration`
- `thirdweb`
- `viem`
- `wagmi`
- `x402`

Most important for Preflight:

- `8004`
- `x402`
- `celo-rpc`
- `viem`
- `evm-foundry`
- `contract-verification`
- `celo-stablecoins`
- `fee-abstraction`

## Installed repo packages

Production/runtime packages:

- `@coinbase/cdp-sdk@1.51.2`
- `@coinbase/x402@2.1.0`
- `@modelcontextprotocol/sdk@1.29.0`
- `@x402/evm@2.16.0`
- `viem@2.53.1`
- `zod@4.4.3`

Development/tooling packages:

- `@celo/celo-composer@2.4.13`
- `@openzeppelin/contracts@5.6.1`
- `@types/node@24.13.2`
- `@upstash/context7-mcp@3.2.2`
- `ctx7@0.5.3`
- `next@16.2.9`
- `react@18.3.1`
- `react-dom@18.3.1`
- `shadcn@4.11.0`
- `tsx@4.22.4`
- `turbo@2.10.0`
- `typescript@5.9.3`
- `wrangler@4.104.0`

Dependency note:

- TypeScript is pinned to `5.9.3`, not npm latest `6.0.3`, because Coinbase/x402 transitive Solana packages require `^5.0.0`.
- React is pinned to `18.3.1` because Next 16 accepts React 18 and this avoids a transitive React peer warning.
- The broad `x402` meta package was removed because it pulled wallet-heavy dependencies not needed for deterministic Preflight checks.
- `ws` and `postcss` are overridden to patched versions to keep `pnpm audit --audit-level moderate` clean.

## pnpm build-script policy

Allowed builds:

- `@coinbase/x402`
- `esbuild`
- `keccak`
- `sharp`
- `workerd`

Explicitly disabled optional builds:

- `bufferutil`
- `utf-8-validate`

Reason:

- `esbuild`, `sharp`, and `workerd` are needed for Next/Wrangler tooling.
- `keccak` and `@coinbase/x402` are needed for crypto/x402 package behavior.
- `bufferutil` and `utf-8-validate` are optional websocket performance native packages, not required for the MVP.

## Codex/plugin tools available

Available and useful:

- **Vercel plugin**
  - Docs search, project/deployment management, deploy current project, fetch protected Vercel URLs.
  - Use for Next.js report site and API deployment.

- **GitHub plugin**
  - Repository lookup, issues, PRs, PR creation.
  - Use for public proof PRs/issues and GitHub research.

- **Codex Security plugin**
  - Security scan workspace and scan context/progress tools.
  - Use after contracts/API code exists.

- **Cloudflare plugin**
  - Docs search and API execution.
  - Use as fallback for Workers/Pages or later scheduled scanning.

- **OpenAI DevDocs plugin**
  - OpenAI docs search/fetch and OpenAPI endpoint lookup.
  - Use only if we add OpenAI/agent functionality.

- **Supabase plugin**
  - Available, but not needed for MVP unless report history/claiming becomes necessary.

## Not available as Codex plugins/connectors

- **Coinbase/CDP plugin**
  - No callable Coinbase/CDP plugin or connector appeared in tool discovery or the installable plugin list.
  - Repo-level alternative is installed: `@coinbase/cdp-sdk`, `@coinbase/x402`, and `@x402/evm`.

- **Context7 Codex plugin**
  - No installable Context7 plugin/connector appeared in the app plugin list.
  - Repo-level alternative is installed: `ctx7` and `@upstash/context7-mcp`.
  - `ctx7 setup --mcp` is available if we want to wire Context7 into local agent configuration.

## Foundry best-practice baseline

Configured in `contracts/foundry.toml`:

- Solidity `0.8.24`.
- Celo RPC endpoints:
  - `celo`
  - `celo_sepolia`
  - `forno`
  - `forno_sepolia`
  - `localhost`
- optimizer enabled, `optimizer_runs = 200`.
- `evm_version = "cancun"`.
- `bytecode_hash = "ipfs"` for verification friendliness.
- separate `ci` profile with higher fuzz/invariant runs.
- Celoscan/Etherscan v2 API config.
- limited read-only filesystem permission.

Use:

```bash
pnpm foundry:build
pnpm foundry:test
pnpm foundry:fmt
```

after contracts are added.

## Current build decision

Proceed with:

- TypeScript-first monorepo.
- deterministic `preflight-core`.
- MCP/CLI/API as thin adapters.
- Foundry attestation contract.
- Next.js report site on Vercel.

Do not make Coinbase, Context7, Supabase, Cloudflare, or OpenAI runtime-critical for MVP.
