import { z } from "zod";

export const REPORT_SCHEMA_VERSION = "preflight.report.v0.1" as const;

export const CheckStatusSchema = z.enum([
  "pass",
  "warn",
  "fail",
  "skip",
  "error"
]);

export const CheckSeveritySchema = z.enum([
  "info",
  "low",
  "medium",
  "high",
  "critical"
]);

export const CheckCategorySchema = z.enum([
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
]);

export const EvidenceSchema = z
  .object({
    type: z.enum([
      "url",
      "chain",
      "http",
      "json",
      "mcp",
      "a2a",
      "x402",
      "self",
      "manual"
    ]),
    label: z.string().min(1),
    value: z.string().min(1),
    chainId: z.number().int().positive().optional(),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
    blockNumber: z.number().int().nonnegative().optional(),
    statusCode: z.number().int().min(100).max(599).optional(),
    fetchedAt: z.string().datetime().optional()
  })
  .strict();

export const ReadinessCheckSchema = z
  .object({
    id: z.string().min(1),
    category: CheckCategorySchema,
    title: z.string().min(1),
    status: CheckStatusSchema,
    severity: CheckSeveritySchema,
    scoreImpact: z.number().int().max(0),
    summary: z.string().min(1),
    evidence: z.array(EvidenceSchema).default([]),
    remediation: z.string().optional()
  })
  .strict();

export const ScoreSchema = z
  .object({
    value: z.number().int().min(0).max(100),
    label: z.enum(["ready", "ready_with_warnings", "not_ready", "unknown"])
  })
  .strict();

export const SubjectSchema = z
  .object({
    chainId: z.number().int().positive(),
    agentRegistry: z.string().optional(),
    agentId: z.string().optional(),
    owner: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
    agentWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
    metadataURI: z.string().optional(),
    primaryUrl: z.string().url().optional()
  })
  .strict();

export const AttestationSchema = z
  .object({
    chainId: z.number().int().positive(),
    contract: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional()
  })
  .strict();

export const PreflightReportSchema = z
  .object({
    schemaVersion: z.literal(REPORT_SCHEMA_VERSION),
    generatedAt: z.string().datetime(),
    generator: z
      .object({
        name: z.literal("celo-agent-preflight"),
        version: z.string().min(1),
        commit: z.string().optional()
      })
      .strict(),
    subject: SubjectSchema,
    score: ScoreSchema,
    checks: z.array(ReadinessCheckSchema),
    reportHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
    attestation: AttestationSchema.optional()
  })
  .strict();

export type CheckStatus = z.infer<typeof CheckStatusSchema>;
export type CheckSeverity = z.infer<typeof CheckSeveritySchema>;
export type CheckCategory = z.infer<typeof CheckCategorySchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type ReadinessCheck = z.infer<typeof ReadinessCheckSchema>;
export type Score = z.infer<typeof ScoreSchema>;
export type PreflightReport = z.infer<typeof PreflightReportSchema>;

export function parsePreflightReport(input: unknown): PreflightReport {
  return PreflightReportSchema.parse(input);
}
