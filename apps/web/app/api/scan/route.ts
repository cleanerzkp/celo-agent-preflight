import {
  runPreflight,
  type PreflightTarget,
  type RunPreflightOptions
} from "@celo-agent-preflight/preflight-core";
import type { Address } from "viem";

import { publishReport } from "../../../src/data/reports";

const MAX_SCAN_BODY_BYTES = 16_384;

export async function POST(request: Request) {
  if (process.env.PREFLIGHT_SCAN_API_ENABLED === "false") {
    return Response.json({ error: "Scan API is disabled." }, { status: 503 });
  }

  const auth = authorizeScanRequest(request);

  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  const contentLength = request.headers.get("content-length");

  if (contentLength && Number(contentLength) > MAX_SCAN_BODY_BYTES) {
    return Response.json({ error: "Request body is too large." }, { status: 413 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const target = parseScanTarget(body);

  if (!target.ok) {
    return Response.json({ error: target.error }, { status: 400 });
  }

  const options = parseScanOptions(body);

  if (!options.ok) {
    return Response.json({ error: options.error }, { status: 400 });
  }

  try {
    const report = await runPreflight(target.value, options.value);
    const persisted = publishReport(report);

    return Response.json(
      {
        persisted: true,
        report: persisted.report,
        reportUrl: `/reports/${persisted.report.reportHash}`
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

type AuthResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

function authorizeScanRequest(request: Request): AuthResult {
  const apiKey = process.env.PREFLIGHT_SCAN_API_KEY;

  if (!apiKey) {
    return { ok: true };
  }

  const authorization = request.headers.get("authorization");
  const providedApiKey = request.headers.get("x-api-key");

  if (authorization === `Bearer ${apiKey}` || providedApiKey === apiKey) {
    return { ok: true };
  }

  return { ok: false, error: "Missing or invalid scan API credentials." };
}

type ParseResult =
  | { readonly ok: true; readonly value: PreflightTarget }
  | { readonly ok: false; readonly error: string };

type OptionsParseResult =
  | { readonly ok: true; readonly value: RunPreflightOptions }
  | { readonly ok: false; readonly error: string };

function parseScanTarget(input: unknown): ParseResult {
  if (!isRecord(input)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const chain = input.chain ?? "celo";

  if (chain !== "celo" && chain !== "celo-sepolia") {
    return { ok: false, error: "chain must be celo or celo-sepolia." };
  }

  const agentId = typeof input.agentId === "string" ? input.agentId : undefined;
  const metadataUrl = typeof input.metadataUrl === "string" ? input.metadataUrl : undefined;

  if (!agentId && !metadataUrl) {
    return { ok: false, error: "agentId or metadataUrl is required." };
  }

  if (input.registry !== undefined && !isAddress(input.registry)) {
    return { ok: false, error: "registry must be a 0x-prefixed EVM address." };
  }

  return {
    ok: true,
    value: {
      chain,
      ...(agentId ? { agentId } : {}),
      ...(metadataUrl ? { metadataUrl } : {}),
      ...(isAddress(input.registry) ? { registry: input.registry } : {})
    }
  };
}

function parseScanOptions(input: unknown): OptionsParseResult {
  if (!isRecord(input)) {
    return { ok: false, error: "Request body must be an object." };
  }

  if (
    input.probeEndpoints !== undefined &&
    typeof input.probeEndpoints !== "boolean"
  ) {
    return { ok: false, error: "probeEndpoints must be a boolean." };
  }

  if (
    input.maxEndpointProbes !== undefined &&
    !isBoundedInteger(input.maxEndpointProbes, 0, 20)
  ) {
    return { ok: false, error: "maxEndpointProbes must be an integer from 0 to 20." };
  }

  if (
    input.generatedAt !== undefined &&
    (typeof input.generatedAt !== "string" || Number.isNaN(Date.parse(input.generatedAt)))
  ) {
    return { ok: false, error: "generatedAt must be an ISO timestamp." };
  }

  return {
    ok: true,
    value: {
      ...(typeof input.probeEndpoints === "boolean"
        ? { probeEndpoints: input.probeEndpoints }
        : {}),
      ...(typeof input.maxEndpointProbes === "number"
        ? { maxEndpointProbes: input.maxEndpointProbes }
        : {}),
      ...(typeof input.generatedAt === "string"
        ? { generatedAt: input.generatedAt }
        : {})
    }
  };
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input && typeof input === "object" && !Array.isArray(input));
}

function isBoundedInteger(input: unknown, min: number, max: number): input is number {
  return typeof input === "number" && Number.isInteger(input) && input >= min && input <= max;
}

function isAddress(input: unknown): input is Address {
  return typeof input === "string" && /^0x[a-fA-F0-9]{40}$/.test(input);
}
