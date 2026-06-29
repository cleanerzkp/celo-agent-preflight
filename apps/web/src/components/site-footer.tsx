import Link from "next/link";
import type { Route } from "next";

import { SITE, celoscanAddress, shortHash } from "../site";
import { ArrowUpRight } from "./icons";
import styles from "./site-chrome.module.css";

function ExtLink({ href, children }: { readonly href: string; readonly children: React.ReactNode }) {
  return (
    <a className={styles.footerLink} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <ArrowUpRight className={styles.extGlyph} />
    </a>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <Link href={"/" as Route} className={styles.brand} aria-label={`${SITE.name} home`}>
            <span className={styles.brandMark} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3.4 8.4l3 3 6.2-6.8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
            </span>
            <span className={styles.brandText}>{SITE.name}</span>
          </Link>
          <p className={styles.footerLede}>
            Deterministic, hash-verifiable readiness reports for AI agents, so builders can
            confirm identity, endpoints, payments, and onchain activity before they rely on one.
          </p>
          <div className={styles.footerMeta}>
            <span className={styles.chip}>
              <span className={styles.chipDot} aria-hidden="true" />
              Built on Celo
            </span>
            <span className={styles.chip}>
              {SITE.chain.name} / <span className={styles.chipMono}>{SITE.chain.id}</span>
            </span>
          </div>
        </div>

        <nav className={styles.footerCol} aria-label="Product">
          <h2 className={styles.footerHeading}>Product</h2>
          <Link className={styles.footerLink} href={"/scan" as Route}>Run a check</Link>
          <Link className={styles.footerLink} href={"/agents" as Route}>ReadyList</Link>
          <a className={styles.footerLink} href={SITE.links.reportsApi}>
            Reports API
            <ArrowUpRight className={styles.extGlyph} />
          </a>
        </nav>

        <nav className={styles.footerCol} aria-label="Protocols">
          <h2 className={styles.footerHeading}>Protocols</h2>
          <a className={styles.footerLink} href={celoscanAddress(SITE.contracts.erc8004Identity)} target="_blank" rel="noopener noreferrer">
            ERC-8004 registry
            <ArrowUpRight className={styles.extGlyph} />
          </a>
          <ExtLink href={SITE.external.self}>Self Agent ID</ExtLink>
          <ExtLink href={SITE.external.x402}>x402 payments</ExtLink>
          <ExtLink href={SITE.external.mcp}>MCP / A2A</ExtLink>
        </nav>

        <nav className={styles.footerCol} aria-label="Project">
          <h2 className={styles.footerHeading}>Project</h2>
          {SITE.links.github ? <ExtLink href={SITE.links.github}>GitHub</ExtLink> : null}
          {SITE.links.docs ? <ExtLink href={SITE.links.docs}>Docs</ExtLink> : null}
          <ExtLink href={SITE.external.celo}>Celo</ExtLink>
        </nav>
      </div>

      <div className={styles.footerBottom}>
        <span>
          Copyright {year} {SITE.name} / Reports are content-addressed by hash
        </span>
        <a href={celoscanAddress(SITE.contracts.erc8004Identity)} target="_blank" rel="noopener noreferrer">
          Identity registry {shortHash(SITE.contracts.erc8004Identity, 6, 4)}
        </a>
      </div>
    </footer>
  );
}

export default SiteFooter;
