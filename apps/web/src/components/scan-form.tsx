"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import type { Route } from "next";

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

export function ScanForm() {
  const [agentId, setAgentId] = useState("");
  const [chain, setChain] = useState("celo");
  const [error, setError] = useState<string | undefined>();
  const [maxEndpointProbes, setMaxEndpointProbes] = useState(5);
  const [metadataUrl, setMetadataUrl] = useState("");
  const [probeEndpoints, setProbeEndpoints] = useState(true);
  const [result, setResult] = useState<ScanResponse | undefined>();
  const [submitting, setSubmitting] = useState(false);

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
    <form className={styles.scanForm} onSubmit={submitScan}>
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
            onChange={(event) => setAgentId(event.target.value)}
            placeholder="1"
            value={agentId}
          />
        </label>
      </div>
      <label className={styles.fieldGroup}>
        <span>Metadata URL</span>
        <input
          onChange={(event) => setMetadataUrl(event.target.value)}
          placeholder="https://agent.example/.well-known/agent.json"
          type="url"
          value={metadataUrl}
        />
      </label>
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
        <button disabled={submitting} type="submit">
          {submitting ? "Scanning..." : "Run scan"}
        </button>
        <span>Scans write canonical JSON into report storage by hash.</span>
      </div>
      {error ? <div className={styles.errorBox}>{error}</div> : null}
      {result?.report ? (
        <div className={styles.resultBox}>
          <span className={`${styles.badge} ${styles.pass}`}>saved</span>
          <strong>
            {result.report.score?.value ?? "n/a"} /{" "}
            {result.report.score?.label.replaceAll("_", " ") ?? "unknown"}
          </strong>
          <code>{result.report.reportHash}</code>
          {result.reportUrl ? (
            <Link href={result.reportUrl as Route} className={styles.textLink}>
              Open report
            </Link>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
