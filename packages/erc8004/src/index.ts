export {
  identityRegistryAbi,
  readIdentityRegistryAgent,
  type IdentityRegistryAgent
} from "./registry.js";
export {
  assertSafeHttpUrl,
  safeFetchText,
  type SafeFetchOptions,
  type SafeFetchResult
} from "./safe-fetch.js";
export {
  normalizeAgentMetadata,
  validateAgentMetadata
} from "./metadata.js";
export {
  resolveJsonUri,
  toIpfsGatewayUrl,
  type ResolveJsonOptions,
  type ResolvedJsonDocument
} from "./uri.js";
export type {
  Erc8004RegistrationRef,
  Erc8004ServiceEndpoint,
  Erc8004ServiceType,
  ExpectedAgentRegistration,
  MetadataIssue,
  MetadataValidationResult,
  NormalizedAgentMetadata
} from "./types.js";
