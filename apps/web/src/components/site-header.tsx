"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import { SITE } from "../site";
import { ArrowRight, ArrowUpRight, CheckTick } from "./icons";
import styles from "./site-chrome.module.css";

const PrimaryNav = [
  { href: "/agents", label: "ReadyList", match: (p: string) => p.startsWith("/agents") },
  { href: "/scan", label: "Verify", match: (p: string) => p === "/scan" }
] as const;

export function SiteHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href={"/" as Route} className={styles.brand} aria-label={`${SITE.name} home`}>
          <span className={styles.brandMark} aria-hidden="true">
            <BrandGlyph />
          </span>
          <span className={styles.brandText}>{SITE.name}</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {PrimaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href as Route}
              className={styles.navLink}
              data-active={item.match(pathname) ? "true" : "false"}
              aria-current={item.match(pathname) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}

          <a className={`${styles.navLink} ${styles.navSecondary}`} href={SITE.links.reportsApi}>
            API
            <ArrowUpRight className={styles.extGlyph} />
          </a>

          {SITE.links.github ? (
            <a
              className={`${styles.navLink} ${styles.navSecondary}`}
              href={SITE.links.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
              <ArrowUpRight className={styles.extGlyph} />
            </a>
          ) : null}

          <Link href={"/scan" as Route} className={`${styles.cta} onGreen`}>
            <span className={styles.ctaLabel}>Run a check</span>
            <ArrowRight className={styles.ctaArrow} size={15} />
          </Link>
        </nav>
      </div>
    </header>
  );
}

function BrandGlyph() {
  return <CheckTick size={16} />;
}

export default SiteHeader;
