import assert from "node:assert/strict";
import test from "node:test";

import { isCeloX402Network, summarizeX402Probe } from "./index.js";

test("summarizeX402Probe accepts a valid Celo payment-required response", () => {
  const summary = summarizeX402Probe({
    endpoint: "https://agent.example/pay",
    statusCode: 402,
    bodyText: JSON.stringify({
      accepts: [
        {
          scheme: "exact",
          network: "celo",
          asset: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
          payTo: "0x0000000000000000000000000000000000000001",
          maxAmountRequired: "10000"
        }
      ]
    })
  });

  assert.equal(summary.paymentRequired, true);
  assert.equal(summary.validPaymentDetails, true);
  assert.equal(summary.network, "celo");
  assert.equal(summary.requirements.length, 1);
  assert.deepEqual(summary.issues, []);
});

test("summarizeX402Probe reports malformed payment details", () => {
  const summary = summarizeX402Probe({
    endpoint: "https://agent.example/pay",
    statusCode: 402,
    bodyText: JSON.stringify({ accepts: [{ network: "celo" }] })
  });

  assert.equal(summary.paymentRequired, true);
  assert.equal(summary.validPaymentDetails, false);
  assert.ok(summary.issues.some((issue) => issue.includes("missing network")));
});

test("summarizeX402Probe reports endpoints that do not require payment", () => {
  const summary = summarizeX402Probe({
    endpoint: "https://agent.example/pay",
    statusCode: 200,
    bodyText: "{}"
  });

  assert.equal(summary.paymentRequired, false);
  assert.equal(summary.validPaymentDetails, false);
  assert.ok(summary.issues.some((issue) => issue.includes("did not return HTTP 402")));
});

test("isCeloX402Network accepts Celo network aliases", () => {
  assert.equal(isCeloX402Network("celo"), true);
  assert.equal(isCeloX402Network("celo-sepolia"), true);
  assert.equal(isCeloX402Network("eip155:42220"), true);
  assert.equal(isCeloX402Network("base"), false);
});
