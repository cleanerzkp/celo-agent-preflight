import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

import {
  Agent,
  fetch as undiciFetch,
  interceptors,
  type Dispatcher
} from "undici";

export interface SafeFetchOptions {
  readonly timeoutMs?: number;
  readonly maxRedirects?: number;
  readonly maxBytes?: number;
  readonly userAgent?: string;
}

export interface SafeFetchResult {
  readonly url: string;
  readonly statusCode: number;
  readonly contentType: string | null;
  readonly durationMs?: number;
  readonly bodyText: string;
}

interface PinnedDnsRecord {
  readonly address: string;
  readonly family: 4 | 6;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_MAX_BYTES = 256_000;
const DEFAULT_USER_AGENT =
  "CeloAgentPreflight/0.1 (+https://github.com/YOUR_ORG/celo-agent-preflight)";
const BLOCKED_IPS = createBlockedIpList();

export async function safeFetchText(
  input: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const startedAt = Date.now();
  let url = new URL(input);

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const pinnedRecord = await resolveSafeHttpUrl(url);
    const dispatcher = pinnedRecord ? createPinnedDnsDispatcher(url, pinnedRecord) : undefined;

    try {
      const response = await undiciFetch(url, {
        ...(dispatcher ? { dispatcher } : {}),
        headers: {
          "user-agent": options.userAgent ?? DEFAULT_USER_AGENT
        },
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (isRedirect(response.status)) {
        const location = response.headers.get("location");

        if (!location) {
          throw new Error(`Redirect from ${url.href} is missing a location header.`);
        }

        await response.body?.cancel();
        url = new URL(location, url);
        continue;
      }

      const contentLength = response.headers.get("content-length");

      if (contentLength && Number(contentLength) > maxBytes) {
        throw new Error(`Response from ${url.href} exceeds ${maxBytes} bytes.`);
      }

      return {
        url: url.href,
        statusCode: response.status,
        contentType: response.headers.get("content-type"),
        durationMs: Date.now() - startedAt,
        bodyText: await readResponseBody(response, maxBytes)
      };
    } finally {
      await dispatcher?.close();
    }
  }

  throw new Error(`Too many redirects while fetching ${input}.`);
}

export async function assertSafeHttpUrl(url: URL): Promise<void> {
  await resolveSafeHttpUrl(url);
}

export async function resolveSafeHttpUrl(url: URL): Promise<PinnedDnsRecord | undefined> {
  if (url.protocol !== "https:") {
    throw new Error(`Unsupported URL protocol: ${url.protocol}. Use HTTPS.`);
  }

  if (url.username || url.password) {
    throw new Error("URLs with embedded credentials are not allowed.");
  }

  const hostname = normalizeHostname(url.hostname);

  if (isBlockedHostname(hostname)) {
    throw new Error(`Blocked internal hostname: ${hostname}`);
  }

  const literalFamily = isIP(hostname);

  if (literalFamily !== 0) {
    assertSafeIp(hostname);
    return undefined;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });

  for (const { address } of addresses) {
    assertSafeIp(address);
  }

  const firstAddress = addresses[0];

  if (!firstAddress) {
    throw new Error(`DNS lookup returned no addresses for ${hostname}.`);
  }

  return normalizeDnsRecord(firstAddress.address, firstAddress.family);
}

async function readResponseBody(
  response: Awaited<ReturnType<typeof undiciFetch>>,
  maxBytes: number
): Promise<string> {
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maxBytes) {
      throw new Error(`Response body exceeds ${maxBytes} bytes.`);
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks).toString("utf8");
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400;
}

function createPinnedDnsDispatcher(url: URL, record: PinnedDnsRecord): Dispatcher {
  const expectedHostname = normalizeHostname(url.hostname).toLowerCase();
  const agent = new Agent();

  return agent.compose(
    interceptors.dns({
      dualStack: record.family === 6,
      lookup(origin, _options, callback) {
        if (origin.hostname.toLowerCase() !== expectedHostname) {
          callback(new Error(`Unexpected DNS lookup for ${origin.hostname}.`), []);
          return;
        }

        callback(null, [{ ...record, ttl: 1 }]);
      },
      pick() {
        return { ...record, ttl: 1 };
      }
    })
  );
}

function normalizeHostname(hostname: string): string {
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "localhost" ||
    normalized === "localhost." ||
    normalized.endsWith(".localhost")
  );
}

function isBlockedIp(address: string): boolean {
  const family = isIP(address);

  if (family === 4) {
    return BLOCKED_IPS.check(address, "ipv4");
  }

  if (family === 6) {
    return BLOCKED_IPS.check(address, "ipv6");
  }

  return true;
}

function assertSafeIp(address: string): void {
  if (isBlockedIp(address)) {
    throw new Error(`Blocked internal address: ${address}`);
  }
}

function normalizeDnsRecord(address: string, family: number): PinnedDnsRecord {
  if (family !== 4 && family !== 6) {
    throw new Error(`Unsupported DNS address family for ${address}.`);
  }

  return { address, family };
}

function createBlockedIpList(): BlockList {
  const blockList = new BlockList();

  blockList.addSubnet("0.0.0.0", 8, "ipv4");
  blockList.addSubnet("10.0.0.0", 8, "ipv4");
  blockList.addSubnet("100.64.0.0", 10, "ipv4");
  blockList.addSubnet("127.0.0.0", 8, "ipv4");
  blockList.addSubnet("169.254.0.0", 16, "ipv4");
  blockList.addSubnet("172.16.0.0", 12, "ipv4");
  blockList.addSubnet("192.0.0.0", 24, "ipv4");
  blockList.addSubnet("192.0.2.0", 24, "ipv4");
  blockList.addSubnet("192.88.99.0", 24, "ipv4");
  blockList.addSubnet("192.168.0.0", 16, "ipv4");
  blockList.addSubnet("198.18.0.0", 15, "ipv4");
  blockList.addSubnet("198.51.100.0", 24, "ipv4");
  blockList.addSubnet("203.0.113.0", 24, "ipv4");
  blockList.addSubnet("224.0.0.0", 4, "ipv4");
  blockList.addSubnet("240.0.0.0", 4, "ipv4");
  blockList.addAddress("::", "ipv6");
  blockList.addAddress("::1", "ipv6");
  blockList.addSubnet("::ffff:0.0.0.0", 96, "ipv6");
  blockList.addSubnet("64:ff9b::", 96, "ipv6");
  blockList.addSubnet("100::", 64, "ipv6");
  blockList.addSubnet("2001::", 23, "ipv6");
  blockList.addSubnet("2001:db8::", 32, "ipv6");
  blockList.addSubnet("2002::", 16, "ipv6");
  blockList.addSubnet("fc00::", 7, "ipv6");
  blockList.addSubnet("fe80::", 10, "ipv6");
  blockList.addSubnet("ff00::", 8, "ipv6");

  return blockList;
}
