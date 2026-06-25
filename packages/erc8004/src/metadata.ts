import { z } from "zod";

import type {
  Erc8004RegistrationRef,
  Erc8004ServiceEndpoint,
  ExpectedAgentRegistration,
  MetadataIssue,
  MetadataValidationResult,
  NormalizedAgentMetadata
} from "./types.js";

const ERC_8004_REGISTRATION_TYPE =
  "https://eips.ethereum.org/EIPS/eip-8004#registration-v1";

const RawServiceSchema = z
  .object({
    type: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    url: z.string().optional(),
    endpoint: z.string().optional(),
    address: z.string().optional(),
    chainId: z.number().int().positive().optional()
  })
  .passthrough();

const RawRegistrationSchema = z
  .object({
    agentRegistry: z.string().min(1),
    agentId: z.union([z.string().min(1), z.number().int().nonnegative()])
  })
  .passthrough();

const RawMetadataSchema = z
  .object({
    type: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    active: z.boolean().optional(),
    services: z.array(RawServiceSchema).optional(),
    endpoints: z.array(RawServiceSchema).optional(),
    registrations: z.array(RawRegistrationSchema).optional(),
    supportedTrust: z.array(z.string()).optional(),
    x402Support: z.union([z.boolean(), z.record(z.string(), z.unknown())]).optional()
  })
  .passthrough();

export function normalizeAgentMetadata(input: unknown): NormalizedAgentMetadata {
  const raw = RawMetadataSchema.parse(input);
  const services = raw.services ?? [];
  const endpoints = raw.endpoints ?? [];
  const sourceShape = getSourceShape(services.length, endpoints.length);

  return {
    ...(raw.type ? { type: raw.type } : {}),
    ...(raw.name ? { name: raw.name } : {}),
    ...(raw.description ? { description: raw.description } : {}),
    ...(raw.image ? { image: raw.image } : {}),
    ...(raw.active === undefined ? {} : { active: raw.active }),
    services: [...services, ...endpoints].map(normalizeService),
    registrations: (raw.registrations ?? []).map(normalizeRegistration),
    supportedTrust: raw.supportedTrust ?? [],
    ...(raw.x402Support === undefined
      ? {}
      : { x402Support: typeof raw.x402Support === "boolean" ? raw.x402Support : true }),
    sourceShape
  };
}

export function validateAgentMetadata(
  input: unknown,
  expected?: ExpectedAgentRegistration
): MetadataValidationResult {
  const metadata = normalizeAgentMetadata(input);
  const issues: MetadataIssue[] = [];

  if (!metadata.type) {
    issues.push({
      id: "metadata.type.missing",
      severity: "warn",
      message: "Metadata type is missing."
    });
  } else if (!isAcceptedMetadataType(metadata.type)) {
    issues.push({
      id: "metadata.type.invalid",
      severity: "warn",
      message: "Metadata type should identify an Agent or ERC-8004 registration document."
    });
  }

  if (!metadata.name) {
    issues.push({
      id: "metadata.name.missing",
      severity: "fail",
      message: "Agent metadata is missing a name."
    });
  }

  if (!metadata.description) {
    issues.push({
      id: "metadata.description.missing",
      severity: "fail",
      message: "Agent metadata is missing a description."
    });
  }

  if (!metadata.image) {
    issues.push({
      id: "metadata.image.missing",
      severity: "warn",
      message: "Agent metadata is missing an image."
    });
  }

  if (metadata.active === false) {
    issues.push({
      id: "metadata.active.false",
      severity: "fail",
      message: "Agent metadata declares active=false."
    });
  }

  if (metadata.services.length === 0) {
    issues.push({
      id: "metadata.services.missing",
      severity: "fail",
      message: "Agent metadata has no services or endpoints."
    });
  }

  metadata.services.forEach((service, index) => {
    if (!service.url && !service.address) {
      issues.push({
        id: "metadata.services.locator.missing",
        severity: "fail",
        message: `Service ${index + 1} (${service.type}) has no url, endpoint, or address locator.`
      });
    }
  });

  if (expected && !hasExpectedRegistration(metadata.registrations, expected)) {
    issues.push({
      id: "metadata.registration.mismatch",
      severity: "fail",
      message: "Agent metadata registrations do not include the expected ERC-8004 agent reference."
    });
  }

  return { metadata, issues };
}

function normalizeService(service: z.infer<typeof RawServiceSchema>): Erc8004ServiceEndpoint {
  const url = service.url ?? service.endpoint;

  return {
    type: service.type ?? service.name ?? "other",
    ...(url ? { url } : {}),
    ...(service.address ? { address: service.address } : {}),
    ...(service.chainId === undefined ? {} : { chainId: service.chainId })
  };
}

function normalizeRegistration(
  registration: z.infer<typeof RawRegistrationSchema>
): Erc8004RegistrationRef {
  return {
    agentRegistry: registration.agentRegistry,
    agentId: String(registration.agentId)
  };
}

function getSourceShape(
  serviceCount: number,
  endpointCount: number
): NormalizedAgentMetadata["sourceShape"] {
  if (serviceCount > 0 && endpointCount > 0) {
    return "mixed";
  }

  if (serviceCount > 0) {
    return "services";
  }

  if (endpointCount > 0) {
    return "endpoints";
  }

  return "unknown";
}

function hasExpectedRegistration(
  registrations: readonly Erc8004RegistrationRef[],
  expected: ExpectedAgentRegistration
): boolean {
  return registrations.some(
    (registration) =>
      registration.agentRegistry.toLowerCase() === expected.agentRegistry.toLowerCase() &&
      registration.agentId === expected.agentId
  );
}

function isAcceptedMetadataType(type: string): boolean {
  const normalized = type.toLowerCase();

  return normalized === "agent" || normalized === ERC_8004_REGISTRATION_TYPE.toLowerCase();
}
