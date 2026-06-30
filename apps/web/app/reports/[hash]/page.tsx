import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  canonicalJson,
  hashPreflightReport,
  toHashableReport,
  type CheckCategory,
  type CheckStatus,
  type Evidence,
  type ReadinessCheck
} from "@celo-agent-preflight/report-schema";

import { getReportByHash } from "../../../src/data/reports";
import { SITE, celoscanAddress, celoscanTx, shortHash } from "../../../src/site";
import { decodeMetadataUri, metadataImageSrc } from "../../../src/metadata";
import { CopyButton } from "../../../src/components/copy-button";
import { CheckTick } from "../../../src/components/icons";
import pageStyles from "../../page.module.css";
import styles from "./report.module.css";

export const dynamic = "force-dynamic";

interface ReportPageParams {
  readonly hash: string;
}

const CATEGORY_ORDER: readonly CheckCategory[] = [
  "erc8004",
  "metadata",
  "domain",
  "endpoint",
  "mcp",
  "a2a",
  "x402",
  "self_agent_id",
  "celo_activity",
  "contract",
  "attestation",
  "security"
];

const CATEGORY_LABELS: Record<CheckCategory, string> = {
  erc8004: "ERC-8004 identity",
  metadata: "Metadata",
  domain: "Domain",
  endpoint: "Endpoint",
  mcp: "MCP",
  a2a: "A2A",
  x402: "x402 payments",
  self_agent_id: "Self Agent ID",
  celo_activity: "Celo activity",
  contract: "Contract",
  attestation: "Attestation",
  security: "Security"
};

const STATUS_ORDER: readonly CheckStatus[] = ["fail", "error", "warn", "skip", "pass"];

export async function generateMetadata({
  params
}: {
  readonly params: Promise<ReportPageParams>;
}): Promise<Metadata> {
  const { hash } = await params;
  const report = getReportByHash(hash);

  if (!report) {
    return { title: "Report not found" };
  }

  const label = report.score.label.replaceAll("_", " ");
  return {
    title: `Report ${report.score.value}/100 (${label})`,
    description: `Preflight report ${shortHash(hash)} on Celo: ${report.checks.length} checks, score ${report.score.value}/100 (${label}).`,
    alternates: { canonical: `/reports/${hash}` }
  };
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
  const counts = countStatuses(report.checks);
  const grouped = groupByCategory(report.checks);
  const meta = decodeMetadataUri(report.subject.metadataURI);
  const imageSrc = metadataImageSrc(meta.image);
  const attestationTxUrl = report.attestation?.txHash
    ? celoscanTx(report.attestation.txHash, report.attestation.chainId)
    : undefined;

  return (
    <main id="main-content" className={pageStyles.shell}>
      <section className={pageStyles.section}>
        <div className={styles.reportHero}>
          <p className={pageStyles.kicker}>Preflight Report</p>
          <h1 className={styles.scoreRow}>
            <span className="srOnly">Readiness score </span>
            <span className={styles.scoreBig}>{report.score.value}</span>
            <span className={styles.scoreDenom}>/ 100</span>
            <span className={`${styles.scoreLabel} ${pageStyles[report.score.label]}`}>
              {report.score.label.replaceAll("_", " ")}
            </span>
          </h1>
          <div className={styles.metaRow}>
            <span className={`${pageStyles.badge} ${hashVerified ? pageStyles.verified : pageStyles.fail}`}>
              {hashVerified ? (
                <>
                  <CheckTick size={12} /> Hash verified
                </>
              ) : (
                "Hash mismatch"
              )}
            </span>
            <span>{report.checks.length} checks</span>
            <span className={styles.dot}>/</span>
            <span>generated {formatDate(report.generatedAt)}</span>
            <span className={styles.dot}>/</span>
            <span className={pageStyles.mono}>{report.generator.name} {report.generator.version}</span>
          </div>
          <div className={styles.countBar}>
            {STATUS_ORDER.filter((status) => counts[status] > 0).map((status) => (
              <span key={status} className={styles.countPill}>
                <span className={`${styles.countNum} ${pageStyles[status]}`}>{counts[status]}</span>
                <span className={styles.countLabel}>{status}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {meta.kind === "data-json" && (meta.name || meta.description || imageSrc) ? (
        <section className={`${pageStyles.section} ${pageStyles.sectionTight}`}>
          <div className={styles.identityCard}>
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.identityImg} src={imageSrc} alt="" />
            ) : null}
            <div className={styles.identityBody}>
              {meta.name ? <span className={styles.identityName}>{meta.name}</span> : null}
              {meta.description ? <span className={styles.identityDesc}>{meta.description}</span> : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className={`${pageStyles.section} ${pageStyles.sectionTight}`} aria-labelledby="subject-heading">
        <div className={pageStyles.sectionHeader}>
          <div>
            <p className={pageStyles.kicker}>Subject</p>
            <h2 id="subject-heading">What was scanned</h2>
          </div>
        </div>
        <div className={styles.subjectGrid}>
          <SubjectItem label="Chain">
            <span>Celo</span>
            <span className={pageStyles.mono}>{report.subject.chainId}</span>
          </SubjectItem>
          {report.subject.agentId ? (
            <SubjectItem label="Agent ID">
              <span className={pageStyles.mono}>{report.subject.agentId}</span>
            </SubjectItem>
          ) : null}
          {report.subject.owner ? (
            <SubjectItem label="Owner">
              <a href={celoscanAddress(report.subject.owner)} target="_blank" rel="noopener noreferrer">
                {shortHash(report.subject.owner, 10, 8)}
              </a>
              <CopyButton value={report.subject.owner} label="owner address" />
            </SubjectItem>
          ) : null}
          {report.subject.agentRegistry ? (
            <SubjectItem label="Registry">
              <span className={pageStyles.mono}>{report.subject.agentRegistry}</span>
            </SubjectItem>
          ) : null}
          {report.subject.primaryUrl ? (
            <SubjectItem label="Primary URL">
              <a href={report.subject.primaryUrl} target="_blank" rel="noopener noreferrer">
                {report.subject.primaryUrl}
              </a>
            </SubjectItem>
          ) : null}
          <SubjectItem label="Metadata">
            <MetadataValue meta={meta} />
          </SubjectItem>
        </div>
      </section>

      <section className={`${pageStyles.section} ${pageStyles.sectionTight}`} aria-labelledby="verify-heading">
        <div className={pageStyles.sectionHeader}>
          <div>
            <p className={pageStyles.kicker}>Verifiability</p>
            <h2 id="verify-heading">Recompute the hash yourself</h2>
          </div>
        </div>
        <div className={styles.verifyGrid}>
          <div className={styles.verifyExplain}>
            <p>
              The report hash is <code>keccak256</code> of the canonical JSON below (sorted keys, no
              whitespace). Recompute it from the same input and you get the same hash, every
              time. Anyone can verify this report without trusting us.
            </p>
            <div className={styles.cmd}>
              <span className={styles.cmdPrompt}>$</span>
              <code>npx celo-agent-preflight hash report.json</code>
              <CopyButton value="npx celo-agent-preflight hash report.json" label="command" />
            </div>
          </div>

          <HashCard label="Stored report hash" value={report.reportHash ?? recomputedHash} />
          <HashCard label="Recomputed canonical hash" value={recomputedHash} />

          <div className={styles.hashCard}>
            <div className={styles.hashHead}>
              <span className={styles.hashLabel}>Celo attestation</span>
              {attestationTxUrl ? (
                <span className={`${pageStyles.badge} ${pageStyles.verified}`}>Attested</span>
              ) : (
                <span className={`${pageStyles.badge} ${pageStyles.unknown}`}>Not attested</span>
              )}
            </div>
            {report.attestation ? (
              <>
                <div className={styles.hashLine}>
                  <span className={styles.hashCode}>
                    <a href={celoscanAddress(report.attestation.contract)} target="_blank" rel="noopener noreferrer" className={pageStyles.textLink}>
                      contract {shortHash(report.attestation.contract, 10, 8)}
                    </a>
                  </span>
                </div>
                {attestationTxUrl && report.attestation.txHash ? (
                  <div className={styles.hashLine}>
                    <a href={attestationTxUrl} target="_blank" rel="noopener noreferrer" className={`${styles.hashCode} ${pageStyles.textLink}`}>
                      tx {shortHash(report.attestation.txHash, 10, 8)}
                    </a>
                  </div>
                ) : null}
              </>
            ) : (
              <p className={styles.checkSummary}>
                This report has not been anchored onchain. Attesting writes the hash to the Celo
                attestation contract for tamper-evident provenance.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={`${pageStyles.section} ${pageStyles.sectionTight}`} aria-labelledby="checks-heading">
        <div className={pageStyles.sectionHeader}>
          <div>
            <p className={pageStyles.kicker}>Evidence</p>
            <h2 id="checks-heading">{report.checks.length} checks, by category</h2>
          </div>
        </div>
        <div className={styles.groups}>
          {grouped.map(({ category, checks }) => (
            <div key={category} className={styles.group}>
              <div className={styles.groupHead}>
                <h3 className={styles.groupName}>{CATEGORY_LABELS[category]}</h3>
                <span className={styles.groupCounts}>
                  {STATUS_ORDER.filter((s) => checks.some((c) => c.status === s)).map((s) => (
                    <span key={s} className={`${styles.miniCount} ${pageStyles[s]}`}>
                      {checks.filter((c) => c.status === s).length} {s}
                    </span>
                  ))}
                </span>
              </div>
              {checks.map((check) => (
                <div key={check.id} className={styles.check}>
                  <div className={styles.checkHead}>
                    <span className={`${pageStyles.badge} ${pageStyles[check.status]}`}>{check.status}</span>
                    <span className={styles.checkTitle}>{check.title}</span>
                    <span className={styles.checkId}>{check.id}</span>
                  </div>
                  <p className={styles.checkSummary}>{check.summary}</p>
                  {check.evidence.length > 0 ? (
                    <div className={styles.evidence}>
                      {check.evidence.map((ev, index) => (
                        <EvidenceChip key={`${check.id}-${index}`} evidence={ev} chainId={report.subject.chainId} />
                      ))}
                    </div>
                  ) : null}
                  {check.remediation ? (
                    <div className={styles.remediation}>
                      <span className={styles.remediationKey}>Fix</span>
                      <span>{check.remediation}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className={`${pageStyles.section} ${pageStyles.sectionTight}`}>
        <details className={styles.appendix}>
          <summary className={styles.appendixSummary}>
            <span>Hash preimage: canonical JSON</span>
            <span className={styles.appendixHint}>keccak256 input</span>
          </summary>
          <pre className={pageStyles.jsonBlock} tabIndex={0} role="region" aria-label="Canonical report JSON, the hash preimage">
            {canonical}
          </pre>
        </details>
      </section>
    </main>
  );
}

function SubjectItem({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className={styles.subjectItem}>
      <span className={styles.subjectKey}>{label}</span>
      <span className={styles.subjectVal}>{children}</span>
    </div>
  );
}

function HashCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className={styles.hashCard}>
      <div className={styles.hashHead}>
        <span className={styles.hashLabel}>{label}</span>
      </div>
      <div className={styles.hashLine}>
        <span className={styles.hashCode}>{value}</span>
        <CopyButton value={value} label={label} />
      </div>
    </div>
  );
}

function MetadataValue({ meta }: { readonly meta: ReturnType<typeof decodeMetadataUri> }) {
  if (meta.kind === "empty") {
    return <span className={pageStyles.mono}>not provided</span>;
  }
  if (meta.kind === "url") {
    return (
      <a href={meta.raw} target="_blank" rel="noopener noreferrer">
        {meta.raw}
      </a>
    );
  }
  if (meta.kind === "data-json" || meta.kind === "data-other") {
    return (
      <details>
        <summary className={pageStyles.textLink} style={{ cursor: "pointer" }}>
          inline data: URI ({meta.bytes ?? 0} bytes): view
        </summary>
        <pre className={pageStyles.jsonBlock} style={{ marginTop: 10, maxHeight: 360 }} tabIndex={0} role="region" aria-label="Inline metadata payload">
          {meta.pretty ?? meta.raw}
        </pre>
      </details>
    );
  }
  return <span className={pageStyles.mono}>{meta.raw}</span>;
}

function EvidenceChip({ evidence, chainId }: { readonly evidence: Evidence; readonly chainId: number }) {
  const { label, value, txHash, address, statusCode, durationMs } = evidence;

  if (txHash) {
    return (
      <a className={styles.evChip} href={celoscanTx(txHash, chainId)} target="_blank" rel="noopener noreferrer">
        <span className={styles.evKey}>{label}</span>
        {shortHash(txHash, 8, 6)}
      </a>
    );
  }
  if (address) {
    return (
      <a className={styles.evChip} href={celoscanAddress(address)} target="_blank" rel="noopener noreferrer">
        <span className={styles.evKey}>{label}</span>
        {shortHash(address, 8, 6)}
      </a>
    );
  }
  if (/^https?:\/\//.test(value)) {
    return (
      <a className={styles.evChip} href={value} target="_blank" rel="noopener noreferrer" title={value}>
        <span className={styles.evKey}>{label}</span>
        {truncate(value, 48)}
      </a>
    );
  }

  const extra = [
    statusCode !== undefined ? `HTTP ${statusCode}` : undefined,
    durationMs !== undefined ? `${durationMs}ms` : undefined
  ].filter(Boolean).join(" ");

  return (
    <span className={styles.evChip} title={`${label}: ${value}`}>
      <span className={styles.evKey}>{label}</span>
      {truncate(value, 48)}{extra ? ` ${extra}` : ""}
    </span>
  );
}

function countStatuses(checks: readonly ReadinessCheck[]): Record<CheckStatus, number> {
  const counts: Record<CheckStatus, number> = { pass: 0, warn: 0, fail: 0, skip: 0, error: 0 };
  for (const check of checks) {
    counts[check.status] += 1;
  }
  return counts;
}

function groupByCategory(
  checks: readonly ReadinessCheck[]
): readonly { category: CheckCategory; checks: readonly ReadinessCheck[] }[] {
  const byCategory = new Map<CheckCategory, ReadinessCheck[]>();
  for (const check of checks) {
    const list = byCategory.get(check.category) ?? [];
    list.push(check);
    byCategory.set(check.category, list);
  }
  return CATEGORY_ORDER.filter((category) => byCategory.has(category)).map((category) => ({
    category,
    checks: byCategory.get(category) ?? []
  }));
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
}

function formatDate(input: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(input));
}
