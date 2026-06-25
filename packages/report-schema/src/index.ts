export const REPORT_SCHEMA_VERSION = "preflight.report.v0.1" as const;

export interface PackageMarker {
  readonly packageName: "@celo-agent-preflight/report-schema";
  readonly schemaVersion: typeof REPORT_SCHEMA_VERSION;
}

export const reportSchemaPackage: PackageMarker = {
  packageName: "@celo-agent-preflight/report-schema",
  schemaVersion: REPORT_SCHEMA_VERSION
};
