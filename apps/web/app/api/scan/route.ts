import { runPreflight, type PreflightTarget } from "@celo-agent-preflight/preflight-core";
import type { Address } from "viem";

export async function POST(request: Request) {
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

  try {
    return Response.json({ report: await runPreflight(target.value) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

type ParseResult =
  | { readonly ok: true; readonly value: PreflightTarget }
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

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input && typeof input === "object" && !Array.isArray(input));
}

function isAddress(input: unknown): input is Address {
  return typeof input === "string" && /^0x[a-fA-F0-9]{40}$/.test(input);
}
