import Link from "next/link";
import type { Route } from "next";

import {
  listReadyListEntries,
  listReports,
  registryAddress
} from "../src/data/reports";

import styles from "./page.module.css";

export default function HomePage() {
  const reports = listReports();
  const agents = listReadyListEntries();
  const readyCount = agents.filter((agent) => agent.status === "ready").length;
  const warningCount = agents.filter((agent) => agent.status === "ready_with_warnings").length;
  const notReadyCount = agents.filter((agent) => agent.status === "not_ready").length;

  return (
    <main className={styles.shell}>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Celo Agent Preflight</p>
          <h1>Deterministic readiness reports for Celo agents.</h1>
          <p className={styles.lede}>
            One scanner core powers the CLI, MCP server, API, public reports, and
            ReadyList directory for ERC-8004, x402, MCP, Self, and onchain evidence.
          </p>
        </div>
        <div className={styles.commandBox} aria-label="CLI command">
          <span>npx celo-agent-preflight check</span>
          <code>--chain celo --agent-id 1</code>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Readiness summary">
        <Metric label="Reports" value={reports.length} tone="neutral" />
        <Metric label="Ready" value={readyCount} tone="good" />
        <Metric label="Warnings" value={warningCount} tone="warn" />
        <Metric label="Not ready" value={notReadyCount} tone="bad" />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>ReadyList</p>
            <h2>Latest indexed agents</h2>
          </div>
          <Link href="/agents" className={styles.textLink}>
            View directory
          </Link>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Status</th>
                <th>Score</th>
                <th>Registry</th>
                <th>Report</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={`${agent.chainId}:${agent.registry}:${agent.agentId}`}>
                  <td>
                    <Link
                      href={`/agents/${agent.chainId}/${registryAddress(agent.registry)}/${agent.agentId}` as Route}
                      className={styles.rowLink}
                    >
                      Agent {agent.agentId}
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={agent.status} />
                  </td>
                  <td>{agent.score}</td>
                  <td className={styles.mono}>{registryAddress(agent.registry)}</td>
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
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Reports API</p>
            <h2>Reusable evidence</h2>
          </div>
          <Link href="/api/agents" className={styles.textLink}>
            JSON index
          </Link>
        </div>
        <div className={styles.reportGrid}>
          {reports.map((report) => (
            <Link
              key={report.reportHash}
              href={`/reports/${report.reportHash}` as Route}
              className={styles.reportCard}
            >
              <span className={styles.mono}>{shortHash(report.reportHash ?? "")}</span>
              <strong>{report.score.value} / {report.score.label}</strong>
              <span>{report.checks.length} checks, generated {formatDate(report.generatedAt)}</span>
            </Link>
          ))}
        </div>
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
  readonly value: number;
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

function shortHash(hash: string): string {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

function formatDate(input: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(input));
}
