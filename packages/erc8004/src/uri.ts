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
    const body = decodeDataUri(uri);

    if (body.byteLength > maxBytes) {
      throw new Error(`Data URI exceeds ${maxBytes} bytes.`);
    }

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

function decodeDataUri(uri: string): Buffer {
  const match = /^data:application\/json(?<base64>;base64)?,(?<data>.*)$/iu.exec(uri);

  if (!match?.groups) {
    throw new Error("Only data:application/json URIs are supported.");
  }

  const data = match.groups.data ?? "";

  return match.groups.base64
    ? Buffer.from(data, "base64")
    : Buffer.from(decodeURIComponent(data), "utf8");
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
