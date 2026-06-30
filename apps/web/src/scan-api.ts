import { createHash } from "node:crypto";

import type {
  PreflightTarget,
  RunPreflightOptions
} from "@celo-agent-preflight/preflight-core";
import type { Address } from "viem";

export const MAX_SCAN_BODY_BYTES = 16_384;

const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 30;
const DEFAULT_MAX_CONCURRENT_SCANS = 2;

type AuthResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

type ParseResult =
  | { readonly ok: true; readonly value: PreflightTarget }
  | { readonly ok: false; readonly error: string };

type OptionsParseResult =
  | { readonly ok: true; readonly value: RunPreflightOptions }
  | { readonly ok: false; readonly error: string };

type JsonBodyResult =
  | { readonly ok: true; readonly value: unknown }
  | JsonBodyError;

type JsonBodyError = { readonly ok: false; readonly status: number; readonly error: string };

type TextBodyResult =
  | { readonly ok: true; readonly value: string }
  | JsonBodyError;

type RateLimitResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly status: 429;
      readonly error: string;
      readonly retryAfterSeconds: number;
    };

type ScanSlotResult =
  | { readonly ok: true; readonly release: () => void }
  | { readonly ok: false; readonly status: 429; readonly error: string };

interface RateLimitBucket {
  windowStartedAt: number;
  count: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();
let activeScanRequests = 0;

export function authorizeScanRequest(request: Request): AuthResult {
  const apiKey = configuredScanApiKey();

  if (!apiKey) {
    if (scanApiAllowsUnauthenticatedWrites()) {
      return { ok: true };
    }

    return { ok: false, error: "Scan API key is not configured." };
  }

  const authorization = request.headers.get("authorization");
  const providedApiKey = request.headers.get("x-api-key");

  if (authorization === `Bearer ${apiKey}` || providedApiKey === apiKey) {
    return { ok: true };
  }

  return { ok: false, error: "Missing or invalid scan API credentials." };
}

export function scanApiEnabled(): boolean {
  const value = process.env.PREFLIGHT_SCAN_API_ENABLED ?? process.env.SCAN_API_ENABLED;

  if (value === undefined) {
    return process.env.NODE_ENV !== "production";
  }

  return value !== "false";
}

export function scanApiAllowsUnauthenticatedWrites(): boolean {
  const value = process.env.PREFLIGHT_SCAN_API_ALLOW_UNAUTHENTICATED ??
    process.env.SCAN_API_ALLOW_UNAUTHENTICATED;

  if (value !== undefined) {
    return value === "true";
  }

  return process.env.NODE_ENV !== "production" &&
    process.env.SCAN_API_REQUIRE_KEY !== "true";
}

export async function readJsonRequestBody(
  request: Request,
  maxBytes = MAX_SCAN_BODY_BYTES
): Promise<JsonBodyResult> {
  const contentLength = request.headers.get("content-length");

  if (contentLength) {
    const declaredBytes = Number(contentLength);

    if (!Number.isInteger(declaredBytes) || declaredBytes < 0) {
      return { ok: false, status: 400, error: "Content-Length must be a non-negative integer." };
    }

    if (declaredBytes > maxBytes) {
      return { ok: false, status: 413, error: "Request body is too large." };
    }
  }

  const body = await readRequestBody(request, maxBytes);

  if (!body.ok) {
    return body;
  }

  try {
    return { ok: true, value: JSON.parse(body.value) as unknown };
  } catch {
    return { ok: false, status: 400, error: "Request body must be JSON." };
  }
}

export function consumeScanRateLimit(
  request: Request,
  now = Date.now()
): RateLimitResult {
  const windowMs = positiveIntegerFromEnv(
    process.env.PREFLIGHT_RATE_LIMIT_WINDOW_SECONDS ??
      process.env.RATE_LIMIT_WINDOW_SECONDS,
    DEFAULT_RATE_LIMIT_WINDOW_SECONDS
  ) * 1000;
  const maxRequests = positiveIntegerFromEnv(
    process.env.PREFLIGHT_RATE_LIMIT_MAX_REQUESTS ??
      process.env.RATE_LIMIT_MAX_REQUESTS,
    DEFAULT_RATE_LIMIT_MAX_REQUESTS
  );
  const subject = rateLimitSubject(request);
  const bucket = rateLimitBuckets.get(subject);

  if (!bucket || now - bucket.windowStartedAt >= windowMs) {
    rateLimitBuckets.set(subject, { count: 1, windowStartedAt: now });
    cleanupExpiredRateLimitBuckets(now, windowMs);
    return { ok: true };
  }

  if (bucket.count >= maxRequests) {
    return {
      ok: false,
      status: 429,
      error: "Too many scan requests.",
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((bucket.windowStartedAt + windowMs - now) / 1000)
      )
    };
  }

  bucket.count += 1;
  return { ok: true };
}

export function reserveScanSlot(): ScanSlotResult {
  const maxConcurrentScans = positiveIntegerFromEnv(
    process.env.PREFLIGHT_SCAN_MAX_CONCURRENT_REQUESTS ??
      process.env.SCAN_MAX_CONCURRENT_REQUESTS,
    DEFAULT_MAX_CONCURRENT_SCANS
  );

  if (activeScanRequests >= maxConcurrentScans) {
    return {
      ok: false,
      status: 429,
      error: "Too many scans are already running."
    };
  }

  activeScanRequests += 1;
  let released = false;

  return {
    ok: true,
    release() {
      if (released) {
        return;
      }

      released = true;
      activeScanRequests = Math.max(0, activeScanRequests - 1);
    }
  };
}

export function parseScanTarget(input: unknown): ParseResult {
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

export function parseScanOptions(input: unknown): OptionsParseResult {
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

  if (input.generatedAt !== undefined) {
    return { ok: false, error: "generatedAt is server-controlled for scan API writes." };
  }

  return {
    ok: true,
    value: {
      ...(typeof input.probeEndpoints === "boolean"
        ? { probeEndpoints: input.probeEndpoints }
        : {}),
      ...(typeof input.maxEndpointProbes === "number"
        ? { maxEndpointProbes: input.maxEndpointProbes }
        : {})
    }
  };
}

export function resetScanApiSecurityState(): void {
  rateLimitBuckets.clear();
  activeScanRequests = 0;
}

function configuredScanApiKey(): string | undefined {
  const rawApiKey = process.env.PREFLIGHT_SCAN_API_KEY ?? process.env.SCAN_API_KEY;
  const apiKey = rawApiKey?.trim();

  return apiKey && apiKey.length > 0 ? apiKey : undefined;
}

async function readRequestBody(
  request: Request,
  maxBytes: number
): Promise<TextBodyResult> {
  if (!request.body) {
    return { ok: false, status: 400, error: "Request body must be JSON." };
  }

  const reader = request.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maxBytes) {
      await reader.cancel();
      return { ok: false, status: 413, error: "Request body is too large." };
    }

    chunks.push(Buffer.from(value));
  }

  return { ok: true, value: Buffer.concat(chunks, totalBytes).toString("utf8") };
}

function rateLimitSubject(request: Request): string {
  const credential = request.headers.get("x-api-key") ??
    request.headers.get("authorization");

  if (credential) {
    return `credential:${shortHash(credential)}`;
  }

  const forwardedFor = request.headers.get("x-forwarded-for")
    ?.split(",")
    .map((entry) => entry.trim())
    .find(Boolean);
  const realIp = request.headers.get("x-real-ip")?.trim();

  return `ip:${forwardedFor ?? realIp ?? "anonymous"}`;
}

function cleanupExpiredRateLimitBuckets(now: number, windowMs: number): void {
  if (rateLimitBuckets.size < 1_000) {
    return;
  }

  for (const [subject, bucket] of rateLimitBuckets) {
    if (now - bucket.windowStartedAt >= windowMs) {
      rateLimitBuckets.delete(subject);
    }
  }
}

function shortHash(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

function positiveIntegerFromEnv(input: string | undefined, fallback: number): number {
  if (input === undefined || input.trim() === "") {
    return fallback;
  }

  const value = Number(input);

  return Number.isInteger(value) && value > 0 ? value : fallback;
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
