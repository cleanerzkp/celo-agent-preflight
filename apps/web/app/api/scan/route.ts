import {
  runPreflight,
} from "@celo-agent-preflight/preflight-core";

import { publishReport } from "../../../src/data/reports";
import {
  authorizeScanRequest,
  consumeScanRateLimit,
  parseScanOptions,
  parseScanTarget,
  readJsonRequestBody,
  reserveScanSlot,
  scanApiEnabled
} from "../../../src/scan-api";

export async function POST(request: Request) {
  if (scanApiEnabled() === false) {
    return Response.json({ error: "Scan API is disabled." }, { status: 503 });
  }

  const auth = authorizeScanRequest(request);

  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  const rateLimit = consumeScanRateLimit(request);

  if (!rateLimit.ok) {
    return Response.json(
      { error: rateLimit.error },
      {
        status: rateLimit.status,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) }
      }
    );
  }

  const body = await readJsonRequestBody(request);

  if (!body.ok) {
    return Response.json({ error: body.error }, { status: body.status });
  }

  const target = parseScanTarget(body.value);

  if (!target.ok) {
    return Response.json({ error: target.error }, { status: 400 });
  }

  const options = parseScanOptions(body.value);

  if (!options.ok) {
    return Response.json({ error: options.error }, { status: 400 });
  }

  const scanSlot = reserveScanSlot();

  if (!scanSlot.ok) {
    return Response.json({ error: scanSlot.error }, { status: scanSlot.status });
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
  } finally {
    scanSlot.release();
  }
}
