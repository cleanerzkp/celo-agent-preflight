import Link from "next/link";
import type { Route } from "next";

import {
  getReadyListSnapshot,
  registryAddress
} from "../../src/data/reports";
import { shortHash } from "../../src/site";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

export default function AgentsPage() {
  const { entries: agents, summary } = getReadyListSnapshot();

  return (
    <main id="main-content" className={styles.shell}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>ReadyList</p>
            <h1>Indexed Celo agents</h1>
          </div>
          <Link href="/" className={styles.textLink}>
            Overview
          </Link>
        </div>
        <section className={styles.metrics} aria-label="ReadyList summary">
          <Metric label="Indexed agents" value={summary.indexedAgents} tone="neutral" />
          <Metric label="Reports" value={summary.reportsGenerated} tone="neutral" />
          <Metric label="Attestations" value={summary.celoAttestations} tone="neutral" />
          <Metric label="Needs remediation" value={summary.needsRemediation} tone="warn" />
        </section>
        {agents.length === 0 ? (
          <div className={styles.emptyState}>
            <strong>No report-backed agents yet</strong>
            <span>
              ReadyList reads from canonical Preflight Reports in storage/reports,
              so it stays empty until Preflight publishes real evidence.
            </span>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>MCP</th>
                  <th>A2A</th>
                  <th>x402</th>
                  <th>Self</th>
                  <th>Celo activity</th>
                  <th>Latency</th>
                  <th>Last scan</th>
                  <th>Attestation</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={`${agent.chainId}:${agent.registry}:${agent.agentId}`}>
                    <td>
                      <AgentLink
                        agentId={agent.agentId}
                        chainId={agent.chainId}
                        name={agent.name}
                        registry={agent.registry}
                        reportUrl={agent.latestReportUrl}
                      />
                    </td>
                    <td><StatusBadge status={agent.status} /></td>
                    <td>{agent.score}</td>
                    <td><StatusBadge status={agent.mcp} /></td>
                    <td><StatusBadge status={agent.a2a} /></td>
                    <td><StatusBadge status={agent.x402} /></td>
                    <td><StatusBadge status={agent.selfAgentId} /></td>
                    <td><StatusBadge status={agent.celoActivity} /></td>
                    <td>{formatLatency(agent.latencyMs)}</td>
                    <td>{formatDate(agent.lastScanAt)}</td>
                    <td className={styles.mono}>
                      {agent.attestationTx ? shortHash(agent.attestationTx) : "none"}
                    </td>
                    <td>
                      <Link href={agent.latestReportUrl as Route} className={styles.textLink}>
                        {shortHash(agent.latestReportHash)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({
  label,
  tone,
  value
}: {
  readonly label: string;
  readonly tone: "bad" | "good" | "neutral" | "warn";
  readonly value: number | string;
}) {
  return (
    <div className={`${styles.metric} ${styles[tone]}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }: { readonly status: string }) {
  return <span className={`${styles.badge} ${styles[status]}`}>{status.replaceAll("_", " ")}</span>;
}

function AgentLink({
  agentId,
  chainId,
  name,
  registry,
  reportUrl
}: {
  readonly agentId: string;
  readonly chainId: number;
  readonly name: string | undefined;
  readonly registry: string;
  readonly reportUrl: string;
}) {
  if (registry === "metadata-only" || agentId === "metadata-url") {
    return (
      <Link href={reportUrl as Route} className={styles.rowLink}>
        {name ?? `${chainId} / metadata scan`}
      </Link>
    );
  }

  return (
    <Link
      href={`/agents/${chainId}/${registryAddress(registry)}/${agentId}` as Route}
      className={styles.rowLink}
    >
      {name ?? `${chainId} / ${agentId}`}
    </Link>
  );
}

function formatDate(input: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(input));
}

function formatLatency(input: number | undefined): string {
  return input === undefined ? "n/a" : `${input}ms`;
}
