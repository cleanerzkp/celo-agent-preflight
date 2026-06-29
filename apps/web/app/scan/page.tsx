import type { Metadata } from "next";

import { ScanForm } from "../../src/components/scan-form";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Run a check",
  description:
    "Run a Celo Agent Preflight on an ERC-8004 agent ID or an agent.json URL and get a scored, hash-verifiable report."
};

export default function ScanPage() {
  return (
    <main id="main-content" className={styles.shell}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Run a preflight</p>
            <h1>Check an agent</h1>
          </div>
        </div>
        <div className={styles.scanPanel}>
          <div>
            <p className={styles.lede}>
              Enter an ERC-8004 agent ID or an agent.json URL on Celo. We verify identity, live
              endpoints, payment routes, Self status, and onchain activity, then return a scored,
              hash-verifiable report you can share.
            </p>
            <p className={styles.sectionLede}>Same input, same hash, every time.</p>
          </div>
          <ScanForm />
        </div>
      </section>
    </main>
  );
}
