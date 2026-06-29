import Link from "next/link";
import type { Route } from "next";

import {
  getReadyListSnapshot,
  registryAddress
} from "../src/data/reports";
import { PreflightVerifier } from "../src/components/preflight-verifier";
import {
  ArrowRight,
  EndpointIcon,
  IdentityIcon,
  OnchainIcon,
  PaymentIcon
} from "../src/components/icons";
import { shortHash } from "../src/site";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const PILLARS = [
  {
    key: "identity",
    Icon: IdentityIcon,
    label: "Identity",
    category: "ERC-8004",
    title: "Real, registered identity",
    body: "Resolve the agent's ERC-8004 registry record, owner, and signed agent.json metadata.",
    meta: "erc8004 / metadata / domain"
  },
  {
    key: "endpoint",
    Icon: EndpointIcon,
    label: "Endpoint readiness",
    category: "MCP / A2A",
    title: "Live, reachable endpoints",
    body: "Probe the declared MCP and A2A endpoints for a fast, well-formed response.",
    meta: "endpoint / mcp / a2a"
  },
  {
    key: "payment",
    Icon: PaymentIcon,
    label: "Payment routes",
    category: "x402",
    title: "Payable on Celo",
    body: "Confirm x402 returns valid Celo payment requirements before any money moves.",
    meta: "x402"
  },
  {
    key: "onchain",
    Icon: OnchainIcon,
    label: "Onchain evidence",
    category: "Celo / Self",
    title: "Active and human-backed",
    body: "Capture Celo onchain activity and Self proof-of-personhood for the agent wallet.",
    meta: "celo_activity / self_agent_id"
  }
] as const;

const STEPS = [
  {
    num: "01",
    title: "Point at an agent",
    body: "Give us an ERC-8004 agent ID or an agent.json URL on Celo, no integration required."
  },
  {
    num: "02",
    title: "Run the preflight",
    body: "Identity, MCP/A2A endpoints, x402 payment routes, Self Agent ID, and Celo onchain activity, checked in one deterministic pass."
  },
  {
    num: "03",
    title: "Get a verifiable report",
    body: "A scored Preflight Report with a content hash anyone can recompute, optionally attested onchain on Celo."
  }
] as const;

export default function HomePage() {
  const snapshot = getReadyListSnapshot();
  const { entries: agents, reports, summary } = snapshot;
  const hasData = summary.reportsGenerated > 0;

  return (
    <main id="main-content" className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            Agent assurance, built on Celo
          </p>
          <h1>
            Verify an AI agent <span className={styles.heroAccent}>before</span> you trust it.
          </h1>
          <p className={styles.lede}>
            One deterministic check confirms an agent is real, reachable, payable, and active
            onchain, then issues a Preflight Report whose hash anyone can recompute.
          </p>
          <div className={styles.actionRow}>
            <Link href={"/scan" as Route} className={`${styles.primaryAction} onGreen`}>
              <span>Run a check</span>
              <span aria-hidden="true"><ArrowRight size={16} /></span>
            </Link>
            <Link href="/agents" className={styles.secondaryAction}>
              See verified agents
            </Link>
          </div>
          <div className={styles.protocolStrip} role="group" aria-label="Evidence surfaces">
            <span>ERC-8004</span>
            <span>MCP / A2A</span>
            <span>x402</span>
            <span>Self</span>
            <span>Celo attestations</span>
          </div>
        </div>

        <div className={styles.heroAside}>
          <PreflightVerifier />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="how-heading">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>How it works</p>
            <h2 id="how-heading">From an agent ID to verifiable proof</h2>
          </div>
        </div>
        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step.num} className={styles.step}>
              <span className={styles.stepNum}>{step.num}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepBody}>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="pillars-heading">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Four pillars</p>
            <h2 id="pillars-heading">What every check covers</h2>
          </div>
        </div>
        <div className={styles.pillars}>
          {PILLARS.map(({ Icon, ...pillar }) => (
            <article key={pillar.key} className={styles.pillar}>
              <span className={styles.pillarIcon} aria-hidden="true">
                <Icon size={28} />
              </span>
              <span className={styles.pillarLabel}>{pillar.label} / {pillar.category}</span>
              <h3 className={styles.pillarTitle}>{pillar.title}</h3>
              <p className={styles.pillarBody}>{pillar.body}</p>
              <span className={styles.pillarMeta}>{pillar.meta}</span>
            </article>
          ))}
        </div>
      </section>

      {hasData ? (
        <section className={styles.section} aria-labelledby="status-heading">
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="status-heading">Network status</h2>
            </div>
            <Link href="/agents" className={styles.textLink}>
              Open ReadyList
            </Link>
          </div>
          <div className={styles.metrics}>
            <Metric label="Ready agents" value={summary.readyAgents} tone="good" />
            <Metric label="Indexed agents" value={summary.indexedAgents} tone="neutral" />
            <Metric label="Preflight reports" value={summary.reportsGenerated} tone="neutral" />
            <Metric label="Celo attestations" value={summary.celoAttestations} tone="neutral" />
            <Metric label="Self-verified" value={`${summary.selfAgentIdCoveragePct}%`} tone="neutral" />
            <Metric
              label="Median latency"
              value={summary.medianEndpointLatencyMs === undefined
                ? "n/a"
                : `${summary.medianEndpointLatencyMs}ms`}
              tone="neutral"
            />
          </div>
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="readylist-heading">
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="readylist-heading">Agents with current evidence</h2>
          </div>
          <Link href="/agents" className={styles.textLink}>
            View directory
          </Link>
        </div>
        {agents.length === 0 ? (
          <EmptyState
            title="No agents have passed preflight yet"
            body="Run the first check to publish a verifiable Preflight Report. It appears here the moment it is generated."
            actionHref="/scan"
            actionLabel="Run a check"
          />
        ) : (
          <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="ReadyList of verified agents">
            <table className={styles.table}>
              <caption className="srOnly">Celo agents with current Preflight evidence</caption>
              <thead>
                <tr>
                  <th scope="col">Agent</th>
                  <th scope="col">Status</th>
                  <th scope="col">Score</th>
                  <th scope="col">MCP</th>
                  <th scope="col">x402</th>
                  <th scope="col">Self</th>
                  <th scope="col">Latency</th>
                  <th scope="col">Report</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={`${agent.chainId}:${agent.registry}:${agent.agentId}`}>
                    <td>
                      <AgentLink
                        agentId={agent.agentId}
                        chainId={agent.chainId}
                        name={agent.name}
                        registry={agent.registry}
                        reportUrl={agent.latestReportUrl}
                      />
                    </td>
                    <td>
                      <StatusBadge status={agent.status} />
                    </td>
                    <td className={styles.num}>{agent.score}</td>
                    <td><StatusBadge status={agent.mcp} /></td>
                    <td><StatusBadge status={agent.x402} /></td>
                    <td><StatusBadge status={agent.selfAgentId} /></td>
                    <td className={styles.num}>{formatLatency(agent.latencyMs)}</td>
                    <td>
                      <Link href={agent.latestReportUrl as Route} className={styles.textLink}>
                        <span className={styles.mono}>{shortHash(agent.latestReportHash)}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.section} aria-labelledby="reports-heading">
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="reports-heading">A machine-readable proof trail</h2>
          </div>
          <Link href="/api/agents" className={styles.textLink}>
            JSON index
          </Link>
        </div>
        {reports.length === 0 ? (
          <EmptyState
            title="No reports published yet"
            body="Every completed scan appears here as canonical, hash-addressed JSON, ready to share or re-verify."
            actionHref="/scan"
            actionLabel="Run a check"
          />
        ) : (
          <div className={styles.reportGrid}>
            {reports.map((report) => (
              <Link
                key={report.reportHash}
                href={`/reports/${report.reportHash}` as Route}
                className={styles.reportCard}
              >
                <span className={styles.mono}>{shortHash(report.reportHash ?? "")}</span>
                <span className={styles.reportName}>
                  {reportAgentName(report) ?? "Preflight report"}
                </span>
                <strong>{report.score.value} / {report.score.label.replaceAll("_", " ")}</strong>
                <span>{report.checks.length} checks / generated {formatDate(report.generatedAt)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({
  label,
  tone,
  value
}: {
  readonly label: string;
  readonly tone: "bad" | "good" | "neutral" | "warn";
  readonly value: number | string;
}) {
  return (
    <div className={`${styles.metric} ${styles[tone]}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }: { readonly status: string }) {
  return <span className={`${styles.badge} ${styles[status]}`}>{status.replaceAll("_", " ")}</span>;
}

function AgentLink({
  agentId,
  chainId,
  name,
  registry,
  reportUrl
}: {
  readonly agentId: string;
  readonly chainId: number;
  readonly name: string | undefined;
  readonly registry: string;
  readonly reportUrl: string;
}) {
  if (registry === "metadata-only" || agentId === "metadata-url") {
    return (
      <Link href={reportUrl as Route} className={styles.rowLink}>
        {name ?? "Metadata scan"}
      </Link>
    );
  }

  return (
    <Link
      href={`/agents/${chainId}/${registryAddress(registry)}/${agentId}` as Route}
      className={styles.rowLink}
    >
      {name ?? `Agent ${agentId}`}
    </Link>
  );
}

function EmptyState({
  actionHref,
  actionLabel,
  body,
  title
}: {
  readonly actionHref?: string;
  readonly actionLabel?: string;
  readonly body: string;
  readonly title: string;
}) {
  return (
    <div className={styles.emptyState}>
      <strong>{title}</strong>
      <span>{body}</span>
      {actionHref && actionLabel ? (
        <Link href={actionHref as Route} className={`${styles.emptyAction} onGreen`}>
          <span>{actionLabel}</span>
          <ArrowRight size={15} />
        </Link>
      ) : null}
    </div>
  );
}

function formatDate(input: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(input));
}

function formatLatency(input: number | undefined): string {
  return input === undefined ? "n/a" : `${input}ms`;
}

function reportAgentName(report: {
  readonly checks: readonly {
    readonly id: string;
    readonly evidence: readonly {
      readonly label: string;
      readonly value: string;
    }[];
  }[];
}): string | undefined {
  return report.checks
    .find((checkEntry) => checkEntry.id === "metadata.name.present")
    ?.evidence.find((evidence) => evidence.label === "name")
    ?.value;
}
