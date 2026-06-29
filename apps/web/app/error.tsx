"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect } from "react";

import styles from "./page.module.css";

export default function Error({
  error,
  reset
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    // Surface the failure for observability without crashing the shell.
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className={styles.shell}>
      <section className={styles.section} aria-labelledby="err-heading">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Error</p>
            <h1 id="err-heading">Something went wrong</h1>
          </div>
        </div>
        <div className={styles.emptyState}>
          <strong>This view failed to render</strong>
          <span>
            A report or data source could not be read. The rest of the site is unaffected;
            try again, or head back to the ReadyList.
          </span>
          <div className={styles.actionRow}>
            <button type="button" onClick={reset} className={`${styles.emptyAction} onGreen`}>
              Try again
            </button>
            <Link href={"/agents" as Route} className={styles.textLink}>
              Back to ReadyList
            </Link>
          </div>
          {error.digest ? (
            <span className={styles.mono}>ref {error.digest}</span>
          ) : null}
        </div>
      </section>
    </main>
  );
}
