import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.shell}>
      <p className={styles.eyebrow}>Celo Agent Preflight</p>
      <h1>Readiness evidence for Celo agents.</h1>
      <p>
        Preflight will expose CLI, MCP, API, report pages, ReadyList, and Celo
        attestation flows from one deterministic scanner core.
      </p>
    </main>
  );
}
