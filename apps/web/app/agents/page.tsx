import Link from "next/link";
import type { Route } from "next";

import {
  listReadyListEntries,
  registryAddress
} from "../../src/data/reports";
import styles from "../page.module.css";

export default function AgentsPage() {
  const agents = listReadyListEntries();

  return (
    <main className={styles.shell}>
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
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Status</th>
                <th>Score</th>
                <th>Owner</th>
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
                      {agent.chainId} / {agent.agentId}
                    </Link>
                  </td>
                  <td>{agent.status.replaceAll("_", " ")}</td>
                  <td>{agent.score}</td>
                  <td className={styles.mono}>{agent.owner ?? "unknown"}</td>
                  <td>
                    <Link href={agent.latestReportUrl as Route} className={styles.textLink}>
                      {agent.latestReportHash.slice(0, 10)}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
