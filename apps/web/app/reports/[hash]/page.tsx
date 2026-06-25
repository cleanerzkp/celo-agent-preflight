import Link from "next/link";
import { notFound } from "next/navigation";

import { getReportByHash } from "../../../src/data/reports";
import styles from "../../page.module.css";

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

  return (
    <main className={styles.shell}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Preflight report</p>
            <h1>{report.score.value} / {report.score.label.replaceAll("_", " ")}</h1>
          </div>
          <Link href="/agents" className={styles.textLink}>
            ReadyList
          </Link>
        </div>
        <div className={styles.commandBox}>
          <span>Report hash</span>
          <code>{report.reportHash}</code>
        </div>
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
