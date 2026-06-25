import Link from "next/link";
import type { Route } from "next";

import {
  getReadyListSnapshot,
  registryAddress
} from "../src/data/reports";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const snapshot = getReadyListSnapshot();
  const { entries: agents, reports, summary } = snapshot;
  const featuredReport = reports[0];
  const featuredChecks = featuredReport?.checks.slice(0, 4) ?? [];

  return (
    <main className={styles.shell}>
      <nav className={styles.nav} aria-label="Primary">
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>PF</span>
          <span>Celo Agent Preflight</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href={"/scan" as Route}>Scan</Link>
          <Link href="/agents">ReadyList</Link>
          <Link href="/api/agents">API</Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>ReadyList for Celo agents</p>
          <h1>Celo Agent Preflight</h1>
          <p className={styles.lede}>
            Deterministic Preflight Reports for ERC-8004
            metadata, MCP/A2A endpoints, x402 payment routes, Self Agent ID status,
            and Celo onchain evidence.
          </p>
          <div className={styles.actionRow}>
            <Link href={"/scan" as Route} className={styles.primaryAction}>
              <span>Run scan</span>
              <span aria-hidden="true">-&gt;</span>
            </Link>
            <Link href="/agents" className={styles.secondaryAction}>
              Open ReadyList
            </Link>
          </div>
          <div className={styles.protocolStrip} aria-label="Supported evidence surfaces">
            <span>ERC-8004</span>
            <span>MCP</span>
            <span>x402</span>
            <span>Self ID</span>
            <span>Celo attestations</span>
          </div>
        </div>

        <div
          className={styles.consoleShell}
          role="img"
          aria-label="A Celo Agent Preflight readiness console showing command output, score, and evidence checks."
        >
          <div className={styles.consoleHeader}>
            <span>Celo Agent Preflight</span>
            <span>chain 42220</span>
          </div>
          <div className={styles.commandBox} aria-label="CLI command">
            <span>npx agentproof check</span>
            <code>--chain celo --registry erc8004 --agent-id 1</code>
          </div>
          <div className={styles.scanGrid} aria-hidden="true">
            <span>metadata</span>
            <span>service</span>
            <span>payment</span>
            <span>attest</span>
          </div>
          <div className={styles.scorePanel}>
            <div>
              <span>Readiness score</span>
              <strong>{featuredReport?.score.value ?? 0}</strong>
            </div>
            <p>{featuredReport?.score.label.replaceAll("_", " ") ?? "awaiting report"}</p>
          </div>
          {featuredChecks.length === 0 ? (
            <div className={styles.consoleEmpty}>Publish a Preflight Report JSON file to show live checks.</div>
          ) : (
            <ol className={styles.checkList}>
              {featuredChecks.map((check) => (
                <li key={check.id}>
                  <span className={`${styles.checkDot} ${styles[check.status]}`} aria-hidden="true" />
                  <div>
                    <strong>{check.title}</strong>
                    <span>{check.category} / {check.status}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div className={styles.hashBar}>
            <span>Preflight Report hash</span>
            <code>{featuredReport?.reportHash ? shortHash(featuredReport.reportHash) : "not published"}</code>
          </div>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Readiness summary">
        <Metric label="Indexed agents" value={summary.indexedAgents} tone="neutral" />
        <Metric label="Ready agents" value={summary.readyAgents} tone="good" />
        <Metric label="Warnings" value={summary.readyWithWarnings} tone="warn" />
        <Metric label="Blocked agents" value={summary.notReadyAgents} tone="bad" />
        <Metric label="Preflight Reports" value={summary.reportsGenerated} tone="neutral" />
        <Metric label="Celo attestations" value={summary.celoAttestations} tone="neutral" />
        <Metric label="MCP checked" value={summary.mcpEndpointsChecked} tone="neutral" />
        <Metric label="x402 checked" value={summary.x402EndpointsChecked} tone="neutral" />
        <Metric label="Self coverage" value={`${summary.selfAgentIdCoveragePct}%`} tone="neutral" />
        <Metric
          label="Median latency"
          value={summary.medianEndpointLatencyMs === undefined
            ? "n/a"
            : `${summary.medianEndpointLatencyMs}ms`}
          tone="neutral"
        />
        <Metric label="Fresh reports" value={summary.reportsRefreshedLast24h} tone="good" />
        <Metric label="Stale reports" value={summary.staleReports} tone="warn" />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>ReadyList</p>
            <h2>Agents with current evidence</h2>
          </div>
          <Link href="/agents" className={styles.textLink}>
            View directory
          </Link>
        </div>
        {agents.length === 0 ? (
          <EmptyState
            title="No published Preflight Reports yet"
            body="Run Celo Agent Preflight and write canonical report JSON into storage/reports to populate ReadyList."
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>MCP</th>
                  <th>x402</th>
                  <th>Self</th>
                  <th>Latency</th>
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
                        registry={agent.registry}
                        reportUrl={agent.latestReportUrl}
                      />
                    </td>
                    <td>
                      <StatusBadge status={agent.status} />
                    </td>
                    <td>{agent.score}</td>
                    <td><StatusBadge status={agent.mcp} /></td>
                    <td><StatusBadge status={agent.x402} /></td>
                    <td><StatusBadge status={agent.selfAgentId} /></td>
                    <td>{formatLatency(agent.latencyMs)}</td>
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

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Preflight Reports API</p>
            <h2>Machine-readable proof trail</h2>
          </div>
          <Link href="/api/agents" className={styles.textLink}>
            JSON index
          </Link>
        </div>
        {reports.length === 0 ? (
          <EmptyState
            title="Preflight Report catalog is empty"
            body="The API stays empty until Celo Agent Preflight publishes canonical report JSON."
          />
        ) : (
          <div className={styles.reportGrid}>
            {reports.map((report) => (
              <Link
                key={report.reportHash}
                href={`/reports/${report.reportHash}` as Route}
                className={styles.reportCard}
              >
                <span className={styles.mono}>{shortHash(report.reportHash ?? "")}</span>
                <strong>{report.score.value} / {report.score.label.replaceAll("_", " ")}</strong>
                <span>{report.checks.length} checks, generated {formatDate(report.generatedAt)}</span>
              </Link>
            ))}
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
  registry,
  reportUrl
}: {
  readonly agentId: string;
  readonly chainId: number;
  readonly registry: string;
  readonly reportUrl: string;
}) {
  if (registry === "metadata-only" || agentId === "metadata-url") {
    return (
      <Link href={reportUrl as Route} className={styles.rowLink}>
        Metadata scan
      </Link>
    );
  }

  return (
    <Link
      href={`/agents/${chainId}/${registryAddress(registry)}/${agentId}` as Route}
      className={styles.rowLink}
    >
      Agent {agentId}
    </Link>
  );
}

function EmptyState({
  body,
  title
}: {
  readonly body: string;
  readonly title: string;
}) {
  return (
    <div className={styles.emptyState}>
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
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

function formatLatency(input: number | undefined): string {
  return input === undefined ? "n/a" : `${input}ms`;
}
