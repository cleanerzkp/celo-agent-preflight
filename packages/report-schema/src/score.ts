import type { CheckSeverity, ReadinessCheck, Score } from "./schema.js";

const FAIL_PENALTIES = {
  info: 0,
  low: 5,
  medium: 10,
  high: 20,
  critical: 30
} as const satisfies Record<CheckSeverity, number>;

export function scoreChecks(checks: readonly ReadinessCheck[]): Score {
  if (checks.length === 0) {
    return { value: 0, label: "unknown" };
  }

  const penalty = checks.reduce((total, check) => {
    if (check.status === "warn") {
      return total + 2;
    }

    if (check.status === "fail" || check.status === "error") {
      return total + FAIL_PENALTIES[check.severity];
    }

    return total;
  }, 0);

  const value = Math.max(0, 100 - penalty);

  if (value === 0) {
    return { value: 0, label: "not_ready" };
  }

  return labelScore(value);
}

export function labelScore(value: number): Score {
  const score = Math.max(0, Math.min(100, Math.trunc(value)));

  if (score >= 90) {
    return { value: score, label: "ready" };
  }

  if (score >= 70) {
    return { value: score, label: "ready_with_warnings" };
  }

  if (score > 0) {
    return { value: score, label: "not_ready" };
  }

  return { value: 0, label: "unknown" };
}
