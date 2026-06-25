#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

import {
  preflightEngineInfo,
  runPreflight,
  type PreflightTarget,
  type RunPreflightOptions
} from "@celo-agent-preflight/preflight-core";
import {
  attachReportHash,
  hashPreflightReport,
  parsePreflightReport,
  type PreflightReport
} from "@celo-agent-preflight/report-schema";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseAbi,
  type Address,
  type Hex
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo, celoSepolia } from "viem/chains";

const attestationAbi = parseAbi([
  "function attestAgentReport(uint256 agentId,address subject,bytes32 reportHash,uint16 score,string reportURI)"
]);

const CELO_RPC_URL = "https://forno.celo.org";
const CELO_SEPOLIA_RPC_URL = "https://forno.celo-sepolia.celo-testnet.org";

const args = process.argv.slice(2);
const command = args[0] === "--" ? args[1] : args[0];
const commandArgs = args[0] === "--" ? args.slice(2) : args.slice(1);

try {
  await main(command, parseFlags(commandArgs));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

async function main(command: string | undefined, flags: ParsedFlags): Promise<void> {
  if (!command || command === "help" || command === "--help") {
    printHelp();
    return;
  }

  if (command === "check" || command === "check-url") {
    await runCheck(flags, command === "check-url");
    return;
  }

  if (command === "hash") {
    await runHash(flags);
    return;
  }

  if (command === "explain") {
    await runExplain(flags);
    return;
  }

  if (command === "attest") {
    await runAttest(flags);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

async function runCheck(flags: ParsedFlags, metadataUrlRequired: boolean): Promise<void> {
  const target = buildTarget(flags, metadataUrlRequired);
  const report = await runPreflight(target, buildRunOptions(flags));

  if (flags.output) {
    await writeFile(flags.output, `${JSON.stringify(report, null, 2)}\n`);
  }

  if (flags.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printReportSummary(report);

  if (flags.output) {
    console.log("");
    console.log(`Wrote report: ${flags.output}`);
  }
}

async function runHash(flags: ParsedFlags): Promise<void> {
  const path = firstPositional(flags);

  if (!path) {
    throw new Error("hash requires a report path or '-'.");
  }

  const input = JSON.parse(await readPathOrStdin(path)) as unknown;
  const report = attachReportHash(input);

  if (flags.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(report.reportHash ?? hashPreflightReport(report));
}

async function runExplain(flags: ParsedFlags): Promise<void> {
  const path = firstPositional(flags);

  if (!path) {
    throw new Error("explain requires a report path or '-'.");
  }

  printReportSummary(parsePreflightReport(JSON.parse(await readPathOrStdin(path))));
}

async function runAttest(flags: ParsedFlags): Promise<void> {
  const reportPath = flags.report ?? firstPositional(flags);

  if (!reportPath) {
    throw new Error("attest requires --report <path> or a positional report path.");
  }

  if (!flags.contract) {
    throw new Error("attest requires --contract <attestation contract address>.");
  }

  if (!flags.reportUri) {
    throw new Error("attest requires --report-uri <public report URI>.");
  }

  const report = attachReportHash(JSON.parse(await readPathOrStdin(reportPath)));
  const contract = parseAddress(flags.contract, "--contract");
  const subject = parseAddress(
    flags.subject ?? report.subject.agentWallet ?? report.subject.owner ?? "",
    "--subject"
  );
  const agentId = parseAgentId(flags.agentId ?? report.subject.agentId ?? "0");
  const reportHash = report.reportHash as Hex;
  const args = [
    agentId,
    subject,
    reportHash,
    report.score.value,
    flags.reportUri
  ] as const;
  const data = encodeFunctionData({
    abi: attestationAbi,
    functionName: "attestAgentReport",
    args
  });
  const privateKey = normalizePrivateKey(flags.privateKey ?? process.env.DEPLOYER_PRIVATE_KEY);

  if (flags.dryRun || !privateKey) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          to: contract,
          functionName: "attestAgentReport",
          args: {
            agentId: agentId.toString(),
            subject,
            reportHash,
            score: report.score.value,
            reportURI: flags.reportUri
          },
          data
        },
        null,
        2
      )
    );
    return;
  }

  const chainKey = flags.chain ?? chainFromReport(report);
  const chain = parseViemChain(chainKey);
  const account = privateKeyToAccount(privateKey);
  const rpcUrl = resolveRpcUrl(chainKey, flags.rpcUrl);
  const transport = http(rpcUrl);
  const walletClient = createWalletClient({ account, chain, transport });
  const publicClient = createPublicClient({ chain, transport });
  const txHash = await walletClient.writeContract({
    address: contract,
    abi: attestationAbi,
    functionName: "attestAgentReport",
    args
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  console.log(
    JSON.stringify(
      {
        mode: "submitted",
        txHash,
        blockNumber: receipt.blockNumber.toString(),
        contract,
        reportHash
      },
      null,
      2
    )
  );
}

function buildTarget(flags: ParsedFlags, metadataUrlRequired: boolean): PreflightTarget {
  const chain = parseChain(flags.chain ?? "celo");
  const metadataUrl = flags.metadataUrl;
  const agentId = flags.agentId;

  if (metadataUrlRequired && !metadataUrl) {
    throw new Error("check-url requires --metadata-url.");
  }

  if (!metadataUrl && !agentId) {
    throw new Error("check requires --agent-id or --metadata-url.");
  }

  return {
    chain,
    ...(agentId ? { agentId } : {}),
    ...(metadataUrl ? { metadataUrl } : {}),
    ...(flags.registry ? { registry: parseAddress(flags.registry, "--registry") } : {})
  };
}

function buildRunOptions(flags: ParsedFlags): RunPreflightOptions {
  return {
    ...(flags.commit ? { commit: flags.commit } : {}),
    ...(flags.ipfsGateway ? { ipfsGatewayBaseUrl: flags.ipfsGateway } : {}),
    ...(flags.maxBytes === undefined ? {} : { maxBytes: flags.maxBytes }),
    ...(flags.timeoutMs === undefined ? {} : { timeoutMs: flags.timeoutMs }),
    ...(flags.userAgent ? { userAgent: flags.userAgent } : {}),
    ...(flags.noProbeEndpoints ? { probeEndpoints: false } : {})
  };
}

function printReportSummary(report: PreflightReport): void {
  console.log(`${preflightEngineInfo.name} v${preflightEngineInfo.version}`);
  console.log(`Score: ${report.score.value} (${report.score.label})`);
  console.log(`Subject: ${formatSubject(report)}`);
  console.log(`Report hash: ${report.reportHash ?? hashPreflightReport(report)}`);
  console.log("");

  for (const check of report.checks) {
    const marker = check.status.toUpperCase().padEnd(5, " ");
    console.log(`${marker} ${check.id} - ${check.summary}`);
  }
}

function formatSubject(report: PreflightReport): string {
  if (report.subject.agentRegistry && report.subject.agentId) {
    return `${report.subject.agentRegistry} / agentId ${report.subject.agentId}`;
  }

  return report.subject.metadataURI
    ? compactUri(report.subject.metadataURI)
    : report.subject.primaryUrl ?? `chain ${report.subject.chainId}`;
}

interface ParsedFlags {
  readonly positional: readonly string[];
  readonly agentId?: string;
  readonly chain?: string;
  readonly commit?: string;
  readonly contract?: string;
  readonly dryRun: boolean;
  readonly ipfsGateway?: string;
  readonly json: boolean;
  readonly maxBytes?: number;
  readonly metadataUrl?: string;
  readonly noProbeEndpoints: boolean;
  readonly output?: string;
  readonly privateKey?: string;
  readonly registry?: string;
  readonly report?: string;
  readonly reportUri?: string;
  readonly rpcUrl?: string;
  readonly subject?: string;
  readonly timeoutMs?: number;
  readonly userAgent?: string;
}

function parseFlags(argsToParse: readonly string[]): ParsedFlags {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < argsToParse.length; index += 1) {
    const arg = argsToParse[index] as string;

    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    const [rawKey = "", inlineValue] = arg.slice(2).split("=", 2);
    const key = normalizeFlag(rawKey);

    if (isBooleanFlag(key)) {
      flags[key] = inlineValue === undefined ? true : inlineValue !== "false";
      continue;
    }

    const value = inlineValue ?? argsToParse[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${rawKey}.`);
    }

    flags[key] = value;

    if (inlineValue === undefined) {
      index += 1;
    }
  }

  const agentId = stringFlag(flags.agentId);
  const chain = stringFlag(flags.chain);
  const commit = stringFlag(flags.commit);
  const contract = stringFlag(flags.contract);
  const ipfsGateway = stringFlag(flags.ipfsGateway);
  const maxBytes = numberFlag(flags.maxBytes, "--max-bytes");
  const metadataUrl = stringFlag(flags.metadataUrl);
  const output = stringFlag(flags.output);
  const privateKey = stringFlag(flags.privateKey);
  const registry = stringFlag(flags.registry);
  const report = stringFlag(flags.report);
  const reportUri = stringFlag(flags.reportUri);
  const rpcUrl = stringFlag(flags.rpcUrl);
  const subject = stringFlag(flags.subject);
  const timeoutMs = numberFlag(flags.timeoutMs, "--timeout-ms");
  const userAgent = stringFlag(flags.userAgent);

  return {
    positional,
    ...(agentId ? { agentId } : {}),
    ...(chain ? { chain } : {}),
    ...(commit ? { commit } : {}),
    ...(contract ? { contract } : {}),
    dryRun: Boolean(flags.dryRun),
    ...(ipfsGateway ? { ipfsGateway } : {}),
    json: Boolean(flags.json),
    ...(maxBytes === undefined ? {} : { maxBytes }),
    ...(metadataUrl ? { metadataUrl } : {}),
    noProbeEndpoints: Boolean(flags.noProbeEndpoints),
    ...(output ? { output } : {}),
    ...(privateKey ? { privateKey } : {}),
    ...(registry ? { registry } : {}),
    ...(report ? { report } : {}),
    ...(reportUri ? { reportUri } : {}),
    ...(rpcUrl ? { rpcUrl } : {}),
    ...(subject ? { subject } : {}),
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
    ...(userAgent ? { userAgent } : {})
  };
}

function parseChain(input: string): PreflightTarget["chain"] {
  if (input === "celo" || input === "celo-sepolia") {
    return input;
  }

  throw new Error("--chain must be celo or celo-sepolia.");
}

function parseAddress(input: string, flag: string): Address {
  if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
    return input as Address;
  }

  throw new Error(`${flag} must be a 0x-prefixed EVM address.`);
}

function firstPositional(flags: ParsedFlags): string | undefined {
  return flags.positional[0];
}

async function readPathOrStdin(path: string): Promise<string> {
  if (path !== "-") {
    return readFile(path, "utf8");
  }

  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function normalizeFlag(input: string): string {
  return input.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function isBooleanFlag(key: string): boolean {
  return key === "dryRun" || key === "json" || key === "noProbeEndpoints";
}

function stringFlag(input: string | boolean | undefined): string | undefined {
  return typeof input === "string" ? input : undefined;
}

function numberFlag(input: string | boolean | undefined, label: string): number | undefined {
  if (input === undefined) {
    return undefined;
  }

  if (typeof input !== "string" || input.length === 0) {
    throw new Error(`${label} must be a number.`);
  }

  const parsed = Number(input);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return parsed;
}

function compactUri(uri: string): string {
  return uri.startsWith("data:") ? "data:application/json" : uri;
}

function parseAgentId(input: string): bigint {
  try {
    const parsed = BigInt(input);

    if (parsed >= 0n) {
      return parsed;
    }
  } catch {
    // handled below
  }

  throw new Error("agentId must be a non-negative integer.");
}

function chainFromReport(report: PreflightReport): PreflightTarget["chain"] {
  return report.subject.chainId === 11142220 ? "celo-sepolia" : "celo";
}

function parseViemChain(input: string) {
  const chain = parseChain(input);

  return chain === "celo" ? celo : celoSepolia;
}

function resolveRpcUrl(chain: string, explicitRpcUrl: string | undefined): string {
  if (explicitRpcUrl) {
    return explicitRpcUrl;
  }

  return parseChain(chain) === "celo"
    ? process.env.CELO_RPC_URL ?? CELO_RPC_URL
    : process.env.CELO_SEPOLIA_RPC_URL ?? CELO_SEPOLIA_RPC_URL;
}

function normalizePrivateKey(input: string | undefined): Hex | undefined {
  if (!input) {
    return undefined;
  }

  const prefixed = input.startsWith("0x") ? input : `0x${input}`;

  if (/^0x[a-fA-F0-9]{64}$/.test(prefixed)) {
    return prefixed as Hex;
  }

  throw new Error("private key must be 32 bytes hex; prefer DEPLOYER_PRIVATE_KEY over --private-key.");
}

function printHelp(): void {
  console.log(`${preflightEngineInfo.name} v${preflightEngineInfo.version}`);
  console.log("");
  console.log("Usage:");
  console.log("  celo-agent-preflight check --chain celo --agent-id 123");
  console.log("  celo-agent-preflight check-url --metadata-url https://example.com/agent.json");
  console.log("  celo-agent-preflight hash report.json");
  console.log("  celo-agent-preflight attest --report report.json --report-uri https://example.com/report.json --contract 0x...");
  console.log("  celo-agent-preflight explain report.json");
  console.log("");
  console.log("Options:");
  console.log("  --chain celo|celo-sepolia       Defaults to celo");
  console.log("  --agent-id <id>                 ERC-8004 Identity Registry token id");
  console.log("  --metadata-url <url>            HTTPS, IPFS, or data:application/json metadata URI");
  console.log("  --registry <address>            Override ERC-8004 Identity Registry");
  console.log("  --output <path>                 Write full report JSON");
  console.log("  --json                          Print full report JSON");
  console.log("  --no-probe-endpoints            Skip live endpoint probes");
  console.log("  --rpc-url <url>                 Override Celo RPC for attest writes");
  console.log("  --dry-run                       Print attestation calldata without sending a transaction");
}
