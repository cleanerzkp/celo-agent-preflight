import type {
  CheckCategory,
  CheckSeverity,
  CheckStatus,
  Evidence,
  ReadinessCheck
} from "@celo-agent-preflight/report-schema";

interface CheckInput {
  readonly id: string;
  readonly category: CheckCategory;
  readonly title: string;
  readonly status: CheckStatus;
  readonly severity: CheckSeverity;
  readonly summary: string;
  readonly evidence?: readonly Evidence[];
  readonly remediation?: string;
}

const FAIL_PENALTIES = {
  info: 0,
  low: -5,
  medium: -10,
  high: -20,
  critical: -30
} as const satisfies Record<CheckSeverity, number>;

export function check(input: CheckInput): ReadinessCheck {
  return {
    id: input.id,
    category: input.category,
    title: input.title,
    status: input.status,
    severity: input.severity,
    scoreImpact: scoreImpact(input.status, input.severity),
    summary: input.summary,
    evidence: [...(input.evidence ?? [])],
    ...(input.remediation ? { remediation: input.remediation } : {})
  };
}

function scoreImpact(status: CheckStatus, severity: CheckSeverity): number {
  if (status === "warn") {
    return -2;
  }

  if (status === "fail" || status === "error") {
    return FAIL_PENALTIES[severity];
  }

  return 0;
}
