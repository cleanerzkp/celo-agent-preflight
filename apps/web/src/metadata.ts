/**
 * Decode an ERC-8004 metadataURI for display. Registries commonly store a
 * base64 `data:` JSON blob on-chain; dumping it raw blows out the layout, so we
 * decode + pretty-print it and surface the agent's name / description / image.
 */

export type MetadataKind = "data-json" | "data-other" | "url" | "text" | "empty";

export interface DecodedMetadata {
  readonly kind: MetadataKind;
  readonly raw: string;
  readonly pretty?: string;
  readonly bytes?: number;
  readonly name?: string;
  readonly description?: string;
  readonly image?: string;
}

function decodeBase64(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64").toString("utf8");
  }
  // Edge / browser fallback.
  return atob(value);
}

export function decodeMetadataUri(uri: string | undefined): DecodedMetadata {
  if (!uri || uri.trim().length === 0) {
    return { kind: "empty", raw: "" };
  }

  const raw = uri.trim();

  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("ipfs://")) {
    return { kind: "url", raw };
  }

  if (raw.startsWith("data:")) {
    const comma = raw.indexOf(",");
    const header = comma === -1 ? raw : raw.slice(0, comma);
    const payload = comma === -1 ? "" : raw.slice(comma + 1);
    const isBase64 = header.includes(";base64");
    const isJson = header.includes("application/json") || header.includes("text/json");

    let decoded = payload;
    try {
      decoded = isBase64 ? decodeBase64(payload) : decodeURIComponent(payload);
    } catch {
      decoded = payload;
    }

    const bytes = decoded.length;

    if (isJson) {
      try {
        const parsed = JSON.parse(decoded) as Record<string, unknown>;
        return {
          kind: "data-json",
          raw,
          pretty: JSON.stringify(parsed, null, 2),
          bytes,
          ...(typeof parsed.name === "string" ? { name: parsed.name } : {}),
          ...(typeof parsed.description === "string"
            ? { description: parsed.description }
            : {}),
          ...(typeof parsed.image === "string" ? { image: parsed.image } : {})
        };
      } catch {
        return { kind: "data-other", raw, pretty: decoded, bytes };
      }
    }

    return { kind: "data-other", raw, pretty: decoded, bytes };
  }

  return { kind: "text", raw };
}
