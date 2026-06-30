import assert from "node:assert/strict";
import test from "node:test";

import {
  authorizeScanRequest,
  consumeScanRateLimit,
  parseScanOptions,
  readJsonRequestBody,
  reserveScanSlot,
  resetScanApiSecurityState
} from "./scan-api.js";

test("authorizeScanRequest fails closed when no real key is configured", async () => {
  await withEnv(
    {
      NODE_ENV: "production",
      PREFLIGHT_SCAN_API_ALLOW_UNAUTHENTICATED: "false",
      PREFLIGHT_SCAN_API_KEY: undefined,
      SCAN_API_ALLOW_UNAUTHENTICATED: undefined,
      SCAN_API_KEY: undefined
    },
    () => {
      const result = authorizeScanRequest(
        new Request("https://app.example/api/scan", {
          headers: { authorization: "Bearer undefined", "x-api-key": "" }
        })
      );

      assert.equal(result.ok, false);
      assert.match(result.ok ? "" : result.error, /key is not configured/);
    }
  );
});

test("authorizeScanRequest accepts a configured non-empty key", async () => {
  await withEnv(
    {
      NODE_ENV: "production",
      PREFLIGHT_SCAN_API_ALLOW_UNAUTHENTICATED: "false",
      PREFLIGHT_SCAN_API_KEY: "scan-secret",
      SCAN_API_ALLOW_UNAUTHENTICATED: undefined,
      SCAN_API_KEY: undefined
    },
    () => {
      const result = authorizeScanRequest(
        new Request("https://app.example/api/scan", {
          headers: { authorization: "Bearer scan-secret" }
        })
      );

      assert.equal(result.ok, true);
    }
  );
});

test("readJsonRequestBody enforces maxBytes without Content-Length", async () => {
  const body = JSON.stringify({ metadataUrl: "x".repeat(128) });
  const request = new Request("https://app.example/api/scan", {
    method: "POST",
    body
  });

  assert.equal(request.headers.get("content-length"), null);

  const result = await readJsonRequestBody(request, 32);

  assert.equal(result.ok, false);
  assert.equal(result.ok ? 0 : result.status, 413);
});

test("parseScanOptions rejects caller-controlled generatedAt", () => {
  const result = parseScanOptions({
    metadataUrl: "data:application/json,{}",
    generatedAt: "2099-01-01T00:00:00.000Z"
  });

  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.error, /server-controlled/);
});

test("consumeScanRateLimit applies per-subject request limits", async () => {
  await withEnv(
    {
      PREFLIGHT_RATE_LIMIT_MAX_REQUESTS: "1",
      PREFLIGHT_RATE_LIMIT_WINDOW_SECONDS: "60",
      RATE_LIMIT_MAX_REQUESTS: undefined,
      RATE_LIMIT_WINDOW_SECONDS: undefined
    },
    () => {
      resetScanApiSecurityState();

      const request = new Request("https://app.example/api/scan", {
        headers: { "x-forwarded-for": "203.0.113.10" }
      });

      assert.equal(consumeScanRateLimit(request, 1_000).ok, true);

      const limited = consumeScanRateLimit(request, 1_001);

      assert.equal(limited.ok, false);
      assert.equal(limited.ok ? 0 : limited.status, 429);
      assert.equal(limited.ok ? 0 : limited.retryAfterSeconds, 60);
    }
  );
});

test("reserveScanSlot caps concurrent scan execution", async () => {
  await withEnv(
    {
      PREFLIGHT_SCAN_MAX_CONCURRENT_REQUESTS: "1",
      SCAN_MAX_CONCURRENT_REQUESTS: undefined
    },
    () => {
      resetScanApiSecurityState();

      const first = reserveScanSlot();

      assert.equal(first.ok, true);

      const second = reserveScanSlot();

      assert.equal(second.ok, false);
      assert.equal(second.ok ? 0 : second.status, 429);

      if (first.ok) {
        first.release();
      }

      const third = reserveScanSlot();

      assert.equal(third.ok, true);

      if (third.ok) {
        third.release();
      }
    }
  );
});

async function withEnv<T>(
  updates: Record<string, string | undefined>,
  fn: () => T | Promise<T>
): Promise<T> {
  const previous = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(updates)) {
    previous.set(key, process.env[key]);

    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return await fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    resetScanApiSecurityState();
  }
}
