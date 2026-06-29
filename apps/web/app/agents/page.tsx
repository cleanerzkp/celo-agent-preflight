import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

import {
  getReadyListSnapshot,
  registryAddress
} from "../../src/data/reports";
import { ArrowRight } from "../../src/components/icons";
import { shortHash } from "../../src/site";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ReadyList",
  description: "Celo agents with current Preflight evidence: identity, endpoints, payment routes, Self status, and onchain activity."
};

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
        </div>
        {agents.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className={styles.metrics} role="group" aria-label="ReadyList summary">
              <Metric label="Indexed agents" value={summary.indexedAgents} tone="neutral" />
              <Metric label="Reports" value={summary.reportsGenerated} tone="neutral" />
              <Metric label="Attestations" value={summary.celoAttestations} tone="neutral" />
              <Metric
                label="Needs remediation"
                value={summary.needsRemediation}
                tone={summary.needsRemediation > 0 ? "warn" : "neutral"}
              />
            </div>
            <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="ReadyList of indexed Celo agents">
              <table className={styles.table}>
                <caption className="srOnly">
                  Indexed Celo agents with readiness status, capability checks, latency, and report links
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Agent</th>
                    <th scope="col">Status</th>
                    <th scope="col">Score</th>
                    <th scope="col">MCP</th>
                    <th scope="col">A2A</th>
                    <th scope="col">x402</th>
                    <th scope="col">Self</th>
                    <th scope="col">Celo activity</th>
                    <th scope="col">Latency</th>
                    <th scope="col">Last scan</th>
                    <th scope="col">Attestation</th>
                    <th scope="col">Report</th>
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
                      <td className={styles.num}>{agent.score}</td>
                      <td><StatusBadge status={agent.mcp} /></td>
                      <td><StatusBadge status={agent.a2a} /></td>
                      <td><StatusBadge status={agent.x402} /></td>
                      <td><StatusBadge status={agent.selfAgentId} /></td>
                      <td><StatusBadge status={agent.celoActivity} /></td>
                      <td className={styles.num}>{formatLatency(agent.latencyMs)}</td>
                      <td className={styles.num}>{formatDate(agent.lastScanAt)}</td>
                      <td className={styles.mono}>
                        {agent.attestationTx ? shortHash(agent.attestationTx) : "none"}
                      </td>
                      <td>
                        <Link href={agent.latestReportUrl as Route} className={styles.textLink}>
                          <span className={styles.mono}>{shortHash(agent.latestReportHash)}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <strong>No verified agents yet</strong>
      <span>
        ReadyList is built entirely from published Preflight Reports. Run the first check to add an
        agent here with its full evidence trail.
      </span>
      <Link href={"/scan" as Route} className={`${styles.emptyAction} onGreen`}>
        <span>Run a check</span>
        <ArrowRight size={15} />
      </Link>
    </div>
  );
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
