"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import type { Route } from "next";

import { ArrowRight, CheckTick } from "./icons";
import styles from "../../app/page.module.css";

interface ScanResponse {
  readonly error?: string;
  readonly persisted?: boolean;
  readonly report?: {
    readonly reportHash?: string;
    readonly score?: {
      readonly label: string;
      readonly value: number;
    };
  };
  readonly reportUrl?: string;
}

const SAMPLE_METADATA_URL =
  "https://myday-guardian-production.up.railway.app/.well-known/agent.json";

export function ScanForm() {
  const [agentId, setAgentId] = useState("");
  const [chain, setChain] = useState("celo");
  const [error, setError] = useState<string | undefined>();
  const [maxEndpointProbes, setMaxEndpointProbes] = useState(5);
  const [metadataUrl, setMetadataUrl] = useState("");
  const [probeEndpoints, setProbeEndpoints] = useState(true);
  const [result, setResult] = useState<ScanResponse | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = (agentId.trim().length > 0 || metadataUrl.trim().length > 0) && !submitting;

  function clearFeedback() {
    if (error) setError(undefined);
    if (result) setResult(undefined);
  }

  function fillSampleAgent() {
    setAgentId("1");
    setMetadataUrl("");
    setChain("celo");
    clearFeedback();
  }

  function fillSampleUrl() {
    setMetadataUrl(SAMPLE_METADATA_URL);
    setAgentId("");
    clearFeedback();
  }

  async function submitScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setResult(undefined);
    setSubmitting(true);

    const body = {
      chain,
      ...(agentId.trim() ? { agentId: agentId.trim() } : {}),
      ...(metadataUrl.trim() ? { metadataUrl: metadataUrl.trim() } : {}),
      maxEndpointProbes,
      probeEndpoints
    };

    try {
      const response = await fetch("/api/scan", {
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const payload = await response.json() as ScanResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? `Scan failed with HTTP ${response.status}.`);
      }

      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.scanForm} onSubmit={submitScan} aria-busy={submitting}>
      <div className={styles.fieldGrid}>
        <label className={styles.fieldGroup}>
          <span>Chain</span>
          <select value={chain} onChange={(event) => setChain(event.target.value)}>
            <option value="celo">Celo mainnet</option>
            <option value="celo-sepolia">Celo Sepolia</option>
          </select>
        </label>
        <label className={styles.fieldGroup}>
          <span>ERC-8004 agent ID</span>
          <input
            inputMode="numeric"
            onChange={(event) => {
              setAgentId(event.target.value);
              clearFeedback();
            }}
            placeholder="1"
            value={agentId}
          />
        </label>
      </div>
      <label className={styles.fieldGroup}>
        <span>Metadata URL</span>
        <input
          onChange={(event) => {
            setMetadataUrl(event.target.value);
            clearFeedback();
          }}
          placeholder="https://agent.example/.well-known/agent.json"
          type="url"
          value={metadataUrl}
        />
      </label>
      <div className={styles.sampleRow}>
        <span className={styles.sampleLabel}>Try a sample:</span>
        <button type="button" className={styles.sampleChip} onClick={fillSampleAgent}>
          Agent ID
        </button>
        <button type="button" className={styles.sampleChip} onClick={fillSampleUrl}>
          agent.json URL
        </button>
      </div>
      <div className={styles.fieldGrid}>
        <label className={styles.fieldGroup}>
          <span>Endpoint probe cap</span>
          <input
            max={20}
            min={0}
            onChange={(event) => setMaxEndpointProbes(Number(event.target.value))}
            type="number"
            value={maxEndpointProbes}
          />
        </label>
        <label className={styles.checkboxRow}>
          <input
            checked={probeEndpoints}
            onChange={(event) => setProbeEndpoints(event.target.checked)}
            type="checkbox"
          />
          <span>Probe live endpoints</span>
        </label>
      </div>
      <div className={styles.formActions}>
        <button disabled={!canSubmit} type="submit" className="onGreen">
          {submitting ? (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              Scanning&hellip;
            </>
          ) : (
            <>
              Run scan
              <ArrowRight size={15} />
            </>
          )}
        </button>
        <span>
          {submitting
            ? "Probing live endpoints; this can take up to ~10s."
            : "Each scan produces a hash-verifiable report you can share or re-verify."}
        </span>
      </div>
      {error ? (
        <div className={styles.errorBox} role="alert">
          {error}
        </div>
      ) : null}
      {result?.report ? (
        <div className={styles.resultBox} role="status" aria-live="polite">
          <span className={`${styles.badge} ${styles.pass}`}>
            <CheckTick size={12} />
            Report saved
          </span>
          <strong>
            {result.report.score?.value ?? "n/a"} /{" "}
            {result.report.score?.label.replaceAll("_", " ") ?? "unknown"}
          </strong>
          <code>{result.report.reportHash}</code>
          {result.reportUrl ? (
            <Link href={result.reportUrl as Route} className={styles.textLink}>
              Open report
              <ArrowRight size={14} />
            </Link>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
