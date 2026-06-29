import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import type { PreflightReport } from "@celo-agent-preflight/report-schema";

import { getReportForAgent } from "../../../../../src/data/reports";
import { celoscanAddress, shortHash } from "../../../../../src/site";
import { decodeMetadataUri } from "../../../../../src/metadata";
import { ArrowRight } from "../../../../../src/components/icons";
import styles from "../../../../page.module.css";
import reportStyles from "../../../../reports/[hash]/report.module.css";

export const dynamic = "force-dynamic";

interface AgentPageParams {
  readonly agentId: string;
  readonly chainId: string;
  readonly registry: string;
}

export async function generateMetadata({
  params
}: {
  readonly params: Promise<AgentPageParams>;
}): Promise<Metadata> {
  const { agentId, chainId, registry } = await params;
  const report = getReportForAgent({ agentId, chainId, registry });

  if (!report) {
    return { title: "Agent not found" };
  }

  const name = reportAgentName(report) ?? `Agent ${report.subject.agentId ?? agentId}`;
  return {
    title: name,
    description: `Preflight evidence for ${name} on Celo: score ${report.score.value}/100 (${report.score.label.replaceAll("_", " ")}).`
  };
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
  const meta = decodeMetadataUri(report.subject.metadataURI);

  return (
    <main id="main-content" className={styles.shell}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Agent</p>
            <h1>{name ?? `Agent ${report.subject.agentId ?? agentId}`}</h1>
          </div>
        </div>

        {meta.description || meta.image ? (
          <div className={reportStyles.identityCard}>
            {meta.image && /^https?:\/\//.test(meta.image) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={reportStyles.identityImg} src={meta.image} alt="" />
            ) : null}
            <div className={reportStyles.identityBody}>
              {name ? <span className={reportStyles.identityName}>{name}</span> : null}
              {meta.description ? (
                <span className={reportStyles.identityDesc}>{meta.description}</span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className={styles.metrics}>
          <div className={`${styles.metric} ${styles[report.score.label]}`}>
            <span>Status</span>
            <strong style={{ fontSize: "1.5rem" }}>{report.score.label.replaceAll("_", " ")}</strong>
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

        <div className={reportStyles.subjectGrid} style={{ marginTop: 14 }}>
          {report.subject.agentId ? (
            <div className={reportStyles.subjectItem}>
              <span className={reportStyles.subjectKey}>Agent ID</span>
              <span className={`${reportStyles.subjectVal} ${styles.mono}`}>{report.subject.agentId}</span>
            </div>
          ) : null}
          {report.subject.owner ? (
            <div className={reportStyles.subjectItem}>
              <span className={reportStyles.subjectKey}>Owner</span>
              <span className={reportStyles.subjectVal}>
                <a href={celoscanAddress(report.subject.owner)} target="_blank" rel="noopener noreferrer">
                  {shortHash(report.subject.owner, 10, 8)}
                </a>
              </span>
            </div>
          ) : null}
          {report.subject.agentRegistry ? (
            <div className={reportStyles.subjectItem}>
              <span className={reportStyles.subjectKey}>Registry</span>
              <span className={`${reportStyles.subjectVal} ${styles.mono}`}>{report.subject.agentRegistry}</span>
            </div>
          ) : null}
          {report.subject.primaryUrl ? (
            <div className={reportStyles.subjectItem}>
              <span className={reportStyles.subjectKey}>Primary URL</span>
              <span className={reportStyles.subjectVal}>
                <a href={report.subject.primaryUrl} target="_blank" rel="noopener noreferrer">
                  {report.subject.primaryUrl}
                </a>
              </span>
            </div>
          ) : null}
        </div>

        <div className={styles.actionRow} style={{ marginTop: 22 }}>
          <Link href={`/reports/${report.reportHash}` as Route} className={`${styles.primaryAction} onGreen`}>
            <span>View full Preflight Report</span>
            <span aria-hidden="true"><ArrowRight size={16} /></span>
          </Link>
          <Link href="/agents" className={styles.secondaryAction}>
            Back to ReadyList
          </Link>
        </div>
      </section>
    </main>
  );
}

function reportAgentName(report: PreflightReport): string | undefined {
  return report.checks
    .find((checkEntry) => checkEntry.id === "metadata.name.present")
    ?.evidence.find((evidence) => evidence.label === "name")
    ?.value;
}
