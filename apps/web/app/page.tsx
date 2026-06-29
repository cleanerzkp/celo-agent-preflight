import Link from "next/link";
import type { Route } from "next";

import {
  getReadyListSnapshot,
  registryAddress
} from "../src/data/reports";
import { PreflightVerifier } from "../src/components/preflight-verifier";
import { SITE, shortHash } from "../src/site";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const snapshot = getReadyListSnapshot();
  const { entries: agents, reports, summary } = snapshot;

  return (
    <main id="main-content" className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>ReadyList for Celo agents</p>
          <h1>{SITE.name}</h1>
          <p className={styles.lede}>
            Deterministic Preflight Reports for ERC-8004
            metadata, MCP/A2A endpoints, x402 payment routes, Self Agent ID status,
            and Celo onchain evidence.
          </p>
          <div className={styles.actionRow}>
            <Link href={"/scan" as Route} className={`${styles.primaryAction} onGreen`}>
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

        <PreflightVerifier />
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
                        name={agent.name}
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
                <span className={styles.reportName}>
                  {reportAgentName(report) ?? "AgentProof report"}
                </span>
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
        {name ?? "Metadata scan"}
      </Link>
    );
  }

  return (
    <Link
      href={`/agents/${chainId}/${registryAddress(registry)}/${agentId}` as Route}
      className={styles.rowLink}
    >
      {name ?? `Agent ${agentId}`}
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

function reportAgentName(report: {
  readonly checks: readonly {
    readonly id: string;
    readonly evidence: readonly {
      readonly label: string;
      readonly value: string;
    }[];
  }[];
}): string | undefined {
  return report.checks
    .find((checkEntry) => checkEntry.id === "metadata.name.present")
    ?.evidence.find((evidence) => evidence.label === "name")
    ?.value;
}
