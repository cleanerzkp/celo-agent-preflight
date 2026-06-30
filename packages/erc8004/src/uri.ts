import { safeFetchText, type SafeFetchOptions } from "./safe-fetch.js";

export interface ResolveJsonOptions extends SafeFetchOptions {
  readonly ipfsGatewayBaseUrl?: string;
}

export interface ResolvedJsonDocument {
  readonly uri: string;
  readonly fetchedUrl: string;
  readonly statusCode?: number;
  readonly durationMs?: number;
  readonly json: unknown;
}

const DEFAULT_IPFS_GATEWAY = "https://ipfs.io/ipfs/";

export async function resolveJsonUri(
  uri: string,
  options: ResolveJsonOptions = {}
): Promise<ResolvedJsonDocument> {
  const maxBytes = options.maxBytes ?? 256_000;

  if (uri.startsWith("data:")) {
    const body = decodeDataUri(uri, maxBytes);

    return {
      uri,
      fetchedUrl: uri,
      json: JSON.parse(body.toString("utf8"))
    };
  }

  const fetchUrl = uri.startsWith("ipfs://")
    ? toIpfsGatewayUrl(uri, options.ipfsGatewayBaseUrl ?? DEFAULT_IPFS_GATEWAY)
    : uri;

  const response = await safeFetchText(fetchUrl, options);

  return {
    uri,
    fetchedUrl: response.url,
    statusCode: response.statusCode,
    ...(response.durationMs === undefined ? {} : { durationMs: response.durationMs }),
    json: JSON.parse(response.bodyText)
  };
}

export function toIpfsGatewayUrl(uri: string, gatewayBaseUrl = DEFAULT_IPFS_GATEWAY): string {
  const withoutScheme = uri.slice("ipfs://".length);

  if (!withoutScheme) {
    throw new Error("IPFS URI is missing a CID.");
  }

  if (withoutScheme.includes("?") || withoutScheme.includes("#")) {
    throw new Error("IPFS URI query strings and fragments are not supported.");
  }

  const path = withoutScheme.split("/").map(encodeIpfsPathSegment).join("/");

  return new URL(path, ensureTrailingSlash(gatewayBaseUrl)).href;
}

function decodeDataUri(uri: string, maxBytes: number): Buffer {
  const match = /^data:application\/json(?<base64>;base64)?,(?<data>[\s\S]*)$/iu.exec(uri);

  if (!match?.groups) {
    throw new Error("Only data:application/json URIs are supported.");
  }

  const data = match.groups.data ?? "";

  if (match.groups.base64) {
    const decodedBytes = decodedBase64ByteLength(data);

    if (decodedBytes > maxBytes) {
      throw new Error(`Data URI exceeds ${maxBytes} bytes.`);
    }

    return Buffer.from(data, "base64");
  }

  return percentDecodeToBuffer(data, maxBytes);
}

function decodedBase64ByteLength(input: string): number {
  const normalized = input.replace(/\s/gu, "");
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;

  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

function percentDecodeToBuffer(input: string, maxBytes: number): Buffer {
  const bytes: number[] = [];

  for (let index = 0; index < input.length;) {
    if (input[index] === "%") {
      const hex = input.slice(index + 1, index + 3);

      if (!/^[\da-f]{2}$/iu.test(hex)) {
        throw new Error("Data URI contains malformed percent encoding.");
      }

      bytes.push(Number.parseInt(hex, 16));
      index += 3;
    } else {
      const codePoint = input.codePointAt(index);

      if (codePoint === undefined) {
        break;
      }

      const value = String.fromCodePoint(codePoint);
      bytes.push(...Buffer.from(value, "utf8"));
      index += value.length;
    }

    if (bytes.length > maxBytes) {
      throw new Error(`Data URI exceeds ${maxBytes} bytes.`);
    }
  }

  return Buffer.from(bytes);
}

function ensureTrailingSlash(input: string): string {
  return input.endsWith("/") ? input : `${input}/`;
}

function encodeIpfsPathSegment(segment: string): string {
  if (!segment) {
    throw new Error("IPFS URI contains an empty path segment.");
  }

  const decoded = decodeURIComponent(segment);

  if (decoded === "." || decoded === ".." || decoded.includes("/") || decoded.includes("\\")) {
    throw new Error(`IPFS URI contains an unsafe path segment: ${segment}`);
  }

  return encodeURIComponent(decoded);
}
