import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { getReportForAgent } from "../../../../../src/data/reports";
import styles from "../../../../page.module.css";

export const dynamic = "force-dynamic";

interface AgentPageParams {
  readonly agentId: string;
  readonly chainId: string;
  readonly registry: string;
}

export default async function AgentPage({
  params
}: {
  readonly params: Promise<AgentPageParams>;
}) {
  const { agentId, chainId, registry } = await params;
  const report = getReportForAgent({ agentId, chainId, registry });

  if (!report) {
    notFound();
  }

  const name = reportAgentName(report);

  return (
    <main className={styles.shell}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Agent detail</p>
            <h1>{name ?? `Agent ${report.subject.agentId}`}</h1>
          </div>
          <Link href="/agents" className={styles.textLink}>
            ReadyList
          </Link>
        </div>
        <div className={styles.metrics}>
          <div className={`${styles.metric} ${styles[report.score.label]}`}>
            <span>Status</span>
            <strong>{report.score.label.replaceAll("_", " ")}</strong>
          </div>
          <div className={styles.metric}>
            <span>Score</span>
            <strong>{report.score.value}</strong>
          </div>
          <div className={styles.metric}>
            <span>Checks</span>
            <strong>{report.checks.length}</strong>
          </div>
          <div className={styles.metric}>
            <span>Chain</span>
            <strong>{report.subject.chainId}</strong>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th>Registry</th>
                <td className={styles.mono}>{report.subject.agentRegistry}</td>
              </tr>
              <tr>
                <th>Owner</th>
                <td className={styles.mono}>{report.subject.owner ?? "unknown"}</td>
              </tr>
              <tr>
                <th>Metadata</th>
                <td>{report.subject.metadataURI}</td>
              </tr>
              <tr>
                <th>Preflight Report</th>
                <td>
                  <Link href={`/reports/${report.reportHash}` as Route} className={styles.textLink}>
                    {report.reportHash}
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
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
