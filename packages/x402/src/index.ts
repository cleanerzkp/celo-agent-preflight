import type { Address } from "viem";

export const CELO_X402_TOKENS = {
  USDC: {
    address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as Address,
    decimals: 6
  },
  USDT: {
    address: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e" as Address,
    decimals: 6
  },
  USDm: {
    address: "0x765DE816845861e75A25fCA122bb6898B8B1282a" as Address,
    decimals: 18
  }
} as const;

export type X402ProbeMode = "probe-only" | "owned-settlement-demo";

export interface X402PaymentRequirement {
  readonly scheme?: string;
  readonly network?: string;
  readonly asset?: string;
  readonly payTo?: string;
  readonly maxAmountRequired?: string;
  readonly raw: Record<string, unknown>;
}

export interface X402ProbeSummary {
  readonly mode: X402ProbeMode;
  readonly endpoint: string;
  readonly statusCode?: number;
  readonly paymentRequired: boolean;
  readonly validPaymentDetails: boolean;
  readonly network?: "celo" | "celo-sepolia" | string;
  readonly requirements: readonly X402PaymentRequirement[];
  readonly issues: readonly string[];
}

export interface X402ProbeInput {
  readonly endpoint: string;
  readonly statusCode?: number;
  readonly bodyText?: string;
}

export function summarizeX402Probe(input: X402ProbeInput): X402ProbeSummary {
  const paymentRequired = input.statusCode === 402;
  const parsedBody = parseJsonObject(input.bodyText);
  const requirements = parsedBody ? extractRequirements(parsedBody) : [];
  const network = requirements.find((requirement) => requirement.network)?.network;
  const issues: string[] = [];

  if (!paymentRequired) {
    issues.push("Endpoint did not return HTTP 402 Payment Required.");
  }

  if (paymentRequired && !parsedBody) {
    issues.push("HTTP 402 response body is not valid JSON.");
  }

  if (paymentRequired && requirements.length === 0) {
    issues.push("HTTP 402 response did not include payment requirements.");
  }

  if (requirements.length > 0 && !requirements.some(hasUsableRequirementShape)) {
    issues.push("Payment requirements are missing network, asset, payTo, or amount fields.");
  }

  return {
    mode: "probe-only",
    endpoint: input.endpoint,
    ...(input.statusCode === undefined ? {} : { statusCode: input.statusCode }),
    paymentRequired,
    validPaymentDetails: paymentRequired && requirements.some(hasUsableRequirementShape),
    ...(network ? { network } : {}),
    requirements,
    issues
  };
}

export function isCeloX402Network(network: string | undefined): boolean {
  if (!network) {
    return false;
  }

  const normalized = network.toLowerCase();

  return (
    normalized === "celo" ||
    normalized === "celo-sepolia" ||
    normalized === "eip155:42220" ||
    normalized === "eip155:11142220"
  );
}

function extractRequirements(body: Record<string, unknown>): X402PaymentRequirement[] {
  const candidates = [body.accepts, body.paymentRequirements, body.requirements]
    .filter(Array.isArray)
    .flat() as unknown[];

  return candidates
    .filter(isRecord)
    .map((requirement) => ({
      ...optionalString("scheme", requirement.scheme),
      ...optionalString("network", requirement.network),
      ...optionalString("asset", requirement.asset),
      ...optionalString("payTo", requirement.payTo),
      ...optionalString("maxAmountRequired", requirement.maxAmountRequired),
      raw: requirement
    }));
}

function hasUsableRequirementShape(requirement: X402PaymentRequirement): boolean {
  return Boolean(
    requirement.network &&
      requirement.asset &&
      requirement.payTo &&
      requirement.maxAmountRequired
  );
}

function parseJsonObject(input: string | undefined): Record<string, unknown> | undefined {
  if (!input) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(input) as unknown;

    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input && typeof input === "object" && !Array.isArray(input));
}

function optionalString(key: string, value: unknown): Record<string, string> {
  return typeof value === "string" && value.length > 0 ? { [key]: value } : {};
}
