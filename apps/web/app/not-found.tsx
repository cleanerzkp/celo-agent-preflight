import Link from "next/link";
import type { Route } from "next";

import { ArrowRight } from "../src/components/icons";
import styles from "./page.module.css";

export default function NotFound() {
  return (
    <main id="main-content" className={styles.shell}>
      <section className={styles.section} aria-labelledby="nf-heading">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>404</p>
            <h1 id="nf-heading">This page could not be found</h1>
          </div>
        </div>
        <div className={styles.emptyState}>
          <strong>Nothing at this address</strong>
          <span>
            Preflight Reports are addressed by canonical content hash, so a mistyped or stale
            link will not resolve, and it may have been generated on a different
            deployment. Head back to the ReadyList or run a fresh check.
          </span>
          <div className={styles.actionRow}>
            <Link href={"/agents" as Route} className={`${styles.emptyAction} onGreen`}>
              <span>Browse ReadyList</span>
              <ArrowRight size={15} />
            </Link>
            <Link href={"/scan" as Route} className={styles.textLink}>
              Run a check
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
