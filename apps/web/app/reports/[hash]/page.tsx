import Link from "next/link";
import { notFound } from "next/navigation";

import {
  canonicalJson,
  hashPreflightReport,
  toHashableReport
} from "@celo-agent-preflight/report-schema";

import { getReportByHash } from "../../../src/data/reports";
import { celoscanTx } from "../../../src/site";
import styles from "../../page.module.css";

export const dynamic = "force-dynamic";

interface ReportPageParams {
  readonly hash: string;
}

export default async function ReportPage({
  params
}: {
  readonly params: Promise<ReportPageParams>;
}) {
  const { hash } = await params;
  const report = getReportByHash(hash);

  if (!report) {
    notFound();
  }

  const canonical = canonicalJson(toHashableReport(report));
  const recomputedHash = hashPreflightReport(report);
  const hashVerified = report.reportHash === recomputedHash;
  const attestationUrl = report.attestation?.txHash
    ? celoscanTx(report.attestation.txHash, report.attestation.chainId)
    : undefined;

  return (
    <main id="main-content" className={styles.shell}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Preflight Report</p>
            <h1>{report.score.value} / {report.score.label.replaceAll("_", " ")}</h1>
          </div>
          <Link href="/agents" className={styles.textLink}>
            ReadyList
          </Link>
        </div>
        <div className={styles.statusRow}>
          <span className={`${styles.badge} ${hashVerified ? styles.pass : styles.fail}`}>
            {hashVerified ? "hash verified" : "hash mismatch"}
          </span>
          <span className={styles.mono}>schema {report.schemaVersion}</span>
        </div>
        <div className={styles.verificationGrid}>
          <div className={styles.commandBox}>
            <span>Stored report hash</span>
            <code>{report.reportHash}</code>
          </div>
          <div className={styles.commandBox}>
            <span>Recomputed canonical hash</span>
            <code>{recomputedHash}</code>
          </div>
          <div className={styles.commandBox}>
            <span>Celo attestation</span>
            {attestationUrl ? (
              <a href={attestationUrl} className={styles.textLink}>
                {report.attestation?.txHash}
              </a>
            ) : (
              <code>not attested</code>
            )}
          </div>
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Canonical JSON</p>
            <h2>Hash preimage</h2>
          </div>
        </div>
        <pre className={styles.jsonBlock}>{canonical}</pre>
      </section>
      <section className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Check</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {report.checks.map((check) => (
                <tr key={check.id}>
                  <td className={styles.mono}>{check.id}</td>
                  <td>{check.status}</td>
                  <td>{check.severity}</td>
                  <td>{check.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
