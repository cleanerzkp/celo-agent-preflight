import Link from "next/link";

import { ScanForm } from "../../src/components/scan-form";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

export default function ScanPage() {
  return (
    <main className={styles.shell}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Run Preflight</p>
            <h1>Generate a report</h1>
          </div>
          <Link href="/" className={styles.textLink}>
            Overview
          </Link>
        </div>
        <div className={styles.scanPanel}>
          <div>
            <p className={styles.lede}>
              Scan an ERC-8004 agent ID or a direct metadata URL. The result is
              persisted by report hash and becomes available to ReadyList, the
              reports API, and public report pages.
            </p>
          </div>
          <ScanForm />
        </div>
      </section>
    </main>
  );
}
