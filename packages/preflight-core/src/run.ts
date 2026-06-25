import {
  createCeloPublicClient,
  getCeloNetwork
} from "@celo-agent-preflight/celo";
import {
  readIdentityRegistryAgent,
  resolveJsonUri,
  safeFetchText,
  validateAgentMetadata,
  type Erc8004ServiceEndpoint,
  type ExpectedAgentRegistration,
  type NormalizedAgentMetadata,
  type SafeFetchOptions,
  type SafeFetchResult
} from "@celo-agent-preflight/erc8004";
import {
  attachReportHash,
  REPORT_SCHEMA_VERSION,
  scoreChecks,
  type Evidence,
  type PreflightReport,
  type ReadinessCheck
} from "@celo-agent-preflight/report-schema";
import {
  isCeloX402Network,
  summarizeX402Probe
} from "@celo-agent-preflight/x402";
import type { Address } from "viem";

import { check } from "./checks.js";
import {
  preflightEngineInfo,
  type PreflightTarget,
  type RunPreflightOptions
} from "./types.js";

const DEFAULT_MAX_ENDPOINT_PROBES = 5;

export async function runPreflight(
  target: PreflightTarget,
  options: RunPreflightOptions = {}
): Promise<PreflightReport> {
  if (!target.agentId && !target.metadataUrl) {
    throw new Error("Preflight requires either agentId or metadataUrl.");
  }

  const generatedAt = toIsoString(options.generatedAt ?? new Date());
  const network = getCeloNetwork(target.chain);
  const chainId = network.chain.id;
  const registry = target.registry ?? network.identityRegistry;
  const agentRegistry = target.agentId || target.registry
    ? formatAgentRegistry(chainId, registry)
    : undefined;
  const subject: PreflightReport["subject"] = {
    chainId,
    ...(agentRegistry ? { agentRegistry } : {}),
    ...(target.agentId ? { agentId: target.agentId } : {})
  };
  const checks: ReadinessCheck[] = [
    check({
      id: "chain.configured",
      category: "contract",
      title: "Celo network configured",
      status: "pass",
      severity: "info",
      summary: `Using ${target.chain} chain ${chainId}.`,
      evidence: [
        {
          type: "chain",
          label: "chain",
          value: target.chain,
          chainId
        },
        {
          type: "chain",
          label: "identity registry",
          value: registry,
          chainId,
          address: registry
        }
      ]
    })
  ];
  let metadataUri = target.metadataUrl;

  if (target.agentId) {
    const parsedAgentId = parseAgentId(target.agentId);

    if (parsedAgentId === undefined) {
      checks.push(
        check({
          id: "erc8004.agent_id.valid",
          category: "erc8004",
          title: "Agent ID is parseable",
          status: "fail",
          severity: "high",
          summary: `Agent ID ${target.agentId} is not a non-negative integer.`,
          remediation: "Pass the numeric ERC-8004 agentId minted by the Identity Registry."
        })
      );
    } else {
      try {
        const client = options.client ?? createCeloPublicClient(target.chain);
        const registryAgent = await readIdentityRegistryAgent({
          // Keep viem's deep PublicClient type out of declaration emit.
          client: client as never,
          registry,
          agentId: parsedAgentId
        });
        const blockNumber = toSafeBlockNumber(registryAgent.blockNumber);

        subject.owner = registryAgent.owner;
        subject.agentWallet = registryAgent.agentWallet;
        metadataUri = registryAgent.metadataURI;
        checks.push(
          check({
            id: "erc8004.registry.read",
            category: "erc8004",
            title: "ERC-8004 registry record resolves",
            status: "pass",
            severity: "critical",
            summary: "Identity Registry owner, wallet, and metadata URI resolved at one block.",
            evidence: [
              {
                type: "chain",
                label: "owner",
                value: registryAgent.owner,
                chainId,
                address: registryAgent.owner,
                ...(blockNumber === undefined ? {} : { blockNumber })
              },
              {
                type: "chain",
                label: "agent wallet",
                value: registryAgent.agentWallet,
                chainId,
                address: registryAgent.agentWallet,
                ...(blockNumber === undefined ? {} : { blockNumber })
              },
              {
                type: "chain",
                label: "metadata URI",
                value: compactUri(registryAgent.metadataURI),
                chainId,
                address: registry,
                ...(blockNumber === undefined ? {} : { blockNumber })
              }
            ]
          })
        );
      } catch (error) {
        checks.push(
          check({
            id: "erc8004.registry.read",
            category: "erc8004",
            title: "ERC-8004 registry record resolves",
            status: "error",
            severity: "critical",
            summary: `Registry read failed: ${errorMessage(error)}`,
            evidence: [
              {
                type: "chain",
                label: "identity registry",
                value: registry,
                chainId,
                address: registry
              }
            ],
            remediation: "Confirm the chain, registry address, RPC URL, and agentId."
          })
        );
      }
    }
  } else {
    checks.push(
      check({
        id: "erc8004.registry.read",
        category: "erc8004",
        title: "ERC-8004 registry record resolves",
        status: "skip",
        severity: "info",
        summary: "Skipped because this scan uses a direct metadata URL."
      })
    );
  }

  if (!metadataUri) {
    checks.push(
      check({
        id: "metadata.uri.present",
        category: "metadata",
        title: "Metadata URI is present",
        status: "fail",
        severity: "critical",
        summary: "No metadata URI was available from the target or registry.",
        remediation: "Provide --metadata-url or register a tokenURI in the ERC-8004 Identity Registry."
      })
    );

    return finalizeReport({ checks, generatedAt, options, subject });
  }

  subject.metadataURI = metadataUri;
  checks.push(
    check({
      id: "metadata.uri.present",
      category: "metadata",
      title: "Metadata URI is present",
      status: "pass",
      severity: "critical",
      summary: "A metadata URI is available for scanning.",
      evidence: [
        {
          type: "url",
          label: "metadata URI",
          value: compactUri(metadataUri)
        }
      ]
    })
  );

  const resolveOptions = getResolveOptions(options);
  let resolvedJson: unknown;
  let metadataEvidence: Evidence[];

  try {
    const resolved = await resolveJsonUri(metadataUri, resolveOptions);
    resolvedJson = resolved.json;
    metadataEvidence = [
      {
        type: resolved.statusCode ? "http" : "json",
        label: "metadata document",
        value: compactUri(resolved.fetchedUrl),
        ...(resolved.statusCode ? { statusCode: resolved.statusCode } : {}),
        ...(resolved.durationMs === undefined ? {} : { durationMs: resolved.durationMs }),
        fetchedAt: generatedAt
      }
    ];
    checks.push(
      check({
        id: "metadata.resolves",
        category: "metadata",
        title: "Metadata resolves to JSON",
        status: "pass",
        severity: "critical",
        summary: "Metadata URI resolved and parsed as JSON.",
        evidence: metadataEvidence
      })
    );
  } catch (error) {
    checks.push(
      check({
        id: "metadata.resolves",
        category: "metadata",
        title: "Metadata resolves to JSON",
        status: "error",
        severity: "critical",
        summary: `Metadata resolution failed: ${errorMessage(error)}`,
        evidence: [
          {
            type: "url",
            label: "metadata URI",
            value: compactUri(metadataUri)
          }
        ],
        remediation: "Use an HTTPS, IPFS, or data:application/json metadata URI under the scanner limits."
      })
    );

    return finalizeReport({ checks, generatedAt, options, subject });
  }

  const expectedRegistration = agentRegistry && target.agentId
    ? { agentRegistry, agentId: target.agentId }
    : undefined;
  let metadata: NormalizedAgentMetadata;

  try {
    const validation = validateAgentMetadata(resolvedJson, expectedRegistration);
    metadata = validation.metadata;
    addMetadataChecks({
      checks,
      ...(expectedRegistration ? { expectedRegistration } : {}),
      issues: validation.issues,
      metadata,
      metadataEvidence
    });
  } catch (error) {
    checks.push(
      check({
        id: "metadata.schema.valid",
        category: "metadata",
        title: "Metadata follows ERC-8004 shape",
        status: "fail",
        severity: "critical",
        summary: `Metadata validation failed: ${errorMessage(error)}`,
        evidence: metadataEvidence,
        remediation: "Publish an ERC-8004 registration document with name, description, services, and registrations."
      })
    );

    return finalizeReport({ checks, generatedAt, options, subject });
  }

  const primaryUrl = derivePrimaryUrl(metadataUri, metadata);

  if (primaryUrl) {
    subject.primaryUrl = primaryUrl;
  }

  addServiceDeclarationChecks(checks, metadata);
  addSelfAgentIdCheck(checks, metadata, resolvedJson);
  addCeloActivityCheck(checks, subject);

  await addEndpointChecks({
    checks,
    fetchText: options.fetchText ?? safeFetchText,
    generatedAt,
    metadata,
    options
  });

  return finalizeReport({ checks, generatedAt, options, subject });
}

interface AddMetadataChecksInput {
  readonly checks: ReadinessCheck[];
  readonly expectedRegistration?: ExpectedAgentRegistration;
  readonly issues: readonly { readonly id: string }[];
  readonly metadata: NormalizedAgentMetadata;
  readonly metadataEvidence: readonly Evidence[];
}

function addMetadataChecks({
  checks,
  expectedRegistration,
  issues,
  metadata,
  metadataEvidence
}: AddMetadataChecksInput): void {
  const issueIds = new Set(issues.map((issue) => issue.id));

  checks.push(
    check({
      id: "metadata.type.valid",
      category: "metadata",
      title: "Metadata type is recognized",
      status: issueIds.has("metadata.type.invalid") || issueIds.has("metadata.type.missing")
        ? "warn"
        : "pass",
      severity: "low",
      summary: metadata.type
        ? `Metadata type is ${metadata.type}.`
        : "Metadata type is missing.",
      evidence: metadataEvidence,
      remediation: "Use type Agent or the ERC-8004 registration-v1 type URI."
    }),
    check({
      id: "metadata.name.present",
      category: "metadata",
      title: "Metadata has a name",
      status: issueIds.has("metadata.name.missing") ? "fail" : "pass",
      severity: "medium",
      summary: metadata.name ? `Agent name is ${metadata.name}.` : "Agent name is missing.",
      evidence: metadata.name
        ? [{ type: "json", label: "name", value: metadata.name }]
        : [],
      remediation: "Add a stable human-readable agent name."
    }),
    check({
      id: "metadata.description.present",
      category: "metadata",
      title: "Metadata has a description",
      status: issueIds.has("metadata.description.missing") ? "fail" : "pass",
      severity: "medium",
      summary: metadata.description
        ? "Agent description is present."
        : "Agent description is missing.",
      remediation: "Add a concise description of what the agent does and how others should use it."
    }),
    check({
      id: "metadata.image.present",
      category: "metadata",
      title: "Metadata has an image",
      status: issueIds.has("metadata.image.missing") ? "warn" : "pass",
      severity: "low",
      summary: metadata.image ? "Agent image is present." : "Agent image is missing.",
      remediation: "Add an HTTPS or IPFS image so directories can display the agent."
    }),
    check({
      id: "metadata.active.true",
      category: "metadata",
      title: "Metadata marks the agent active",
      status: issueIds.has("metadata.active.false") ? "fail" : "pass",
      severity: "high",
      summary: metadata.active === false
        ? "Metadata declares active=false."
        : "Metadata does not mark the agent inactive.",
      remediation: "Set active=true when the agent is ready to receive traffic."
    }),
    check({
      id: "metadata.services.present",
      category: "metadata",
      title: "Metadata declares services",
      status: issueIds.has("metadata.services.missing") ? "fail" : "pass",
      severity: "high",
      summary: metadata.services.length > 0
        ? `Metadata declares ${metadata.services.length} service(s).`
        : "Metadata declares no services or endpoints.",
      evidence: [
        {
          type: "json",
          label: "service count",
          value: String(metadata.services.length)
        }
      ],
      remediation: "Add at least one MCP, A2A, x402, or other callable service endpoint."
    }),
    check({
      id: "metadata.services.locators",
      category: "metadata",
      title: "Declared services have locators",
      status: metadata.services.length === 0
        ? "skip"
        : issueIds.has("metadata.services.locator.missing")
          ? "fail"
          : "pass",
      severity: "high",
      summary: issueIds.has("metadata.services.locator.missing")
        ? "At least one declared service has no URL or address locator."
        : "Declared services include URL or address locators.",
      remediation: "Add a url, endpoint, or address to every callable service."
    })
  );

  if (!expectedRegistration) {
    checks.push(
      check({
        id: "metadata.registration.matches",
        category: "erc8004",
        title: "Metadata registration matches target",
        status: "skip",
        severity: "info",
        summary: "Skipped because this scan was not tied to an ERC-8004 agentId."
      })
    );
    return;
  }

  checks.push(
    check({
      id: "metadata.registration.matches",
      category: "erc8004",
      title: "Metadata registration matches target",
      status: issueIds.has("metadata.registration.mismatch") ? "fail" : "pass",
      severity: "critical",
      summary: issueIds.has("metadata.registration.mismatch")
        ? "Metadata registrations do not include the scanned agent."
        : "Metadata registrations include the scanned agent.",
      evidence: [
        {
          type: "json",
          label: "expected registration",
          value: `${expectedRegistration.agentRegistry}/${expectedRegistration.agentId}`
        }
      ],
      remediation: "Add the expected agentRegistry and agentId to metadata.registrations."
    })
  );
}

function addServiceDeclarationChecks(
  checks: ReadinessCheck[],
  metadata: NormalizedAgentMetadata
): void {
  addServiceDeclarationCheck(checks, metadata, "mcp", "mcp", "MCP endpoint declared");
  addServiceDeclarationCheck(checks, metadata, "a2a", "a2a", "A2A endpoint declared");
  addX402DeclarationCheck(checks, metadata);
}

function addServiceDeclarationCheck(
  checks: ReadinessCheck[],
  metadata: NormalizedAgentMetadata,
  category: "mcp" | "a2a",
  type: string,
  title: string
): void {
  const services = metadata.services.filter((service) => serviceType(service) === type);

  checks.push(
    check({
      id: `${type}.declared`,
      category,
      title,
      status: services.length > 0 ? "pass" : "skip",
      severity: "medium",
      summary: services.length > 0
        ? `Metadata declares ${services.length} ${type.toUpperCase()} service(s).`
        : `Metadata does not declare ${type.toUpperCase()} service.`,
      evidence: services.map(serviceEvidence)
    })
  );
}

function addX402DeclarationCheck(
  checks: ReadinessCheck[],
  metadata: NormalizedAgentMetadata
): void {
  const services = metadata.services.filter((service) => serviceType(service) === "x402");
  const declared = metadata.x402Support === true || services.length > 0;

  checks.push(
    check({
      id: "x402.declared",
      category: "x402",
      title: "x402 support declared",
      status: declared ? "pass" : "skip",
      severity: "medium",
      summary: declared
        ? "Metadata declares x402 support."
        : "Metadata does not declare x402 support.",
      evidence: services.map(serviceEvidence)
    })
  );
}

function addSelfAgentIdCheck(
  checks: ReadinessCheck[],
  metadata: NormalizedAgentMetadata,
  rawMetadata: unknown
): void {
  const claimed = hasSelfAgentIdClaim(metadata, rawMetadata);

  checks.push(
    check({
      id: "self_agent_id.claimed",
      category: "self_agent_id",
      title: "Self Agent ID declared",
      status: claimed ? "warn" : "skip",
      severity: "low",
      summary: claimed
        ? "Metadata declares Self Agent ID evidence; live Self verification is not enabled in this MVP probe."
        : "Metadata does not declare Self Agent ID evidence.",
      remediation: "Add verifiable Self Agent ID evidence and wire live verification when available."
    })
  );
}

function addCeloActivityCheck(
  checks: ReadinessCheck[],
  subject: PreflightReport["subject"]
): void {
  const address = subject.agentWallet ?? subject.owner;

  checks.push(
    check({
      id: "celo_activity.identity_address.present",
      category: "celo_activity",
      title: "Celo identity address captured",
      status: address ? "pass" : "skip",
      severity: "low",
      summary: address
        ? "The ERC-8004 registry scan captured an owner or agent wallet address."
        : "No onchain owner or agent wallet was available in this metadata-only scan.",
      evidence: address
        ? [
            {
              type: "chain",
              label: "identity address",
              value: address,
              chainId: subject.chainId,
              address
            }
          ]
        : []
    })
  );
}

interface AddEndpointChecksInput {
  readonly checks: ReadinessCheck[];
  readonly fetchText: (url: string, options?: SafeFetchOptions) => Promise<SafeFetchResult>;
  readonly generatedAt: string;
  readonly metadata: NormalizedAgentMetadata;
  readonly options: RunPreflightOptions;
}

async function addEndpointChecks({
  checks,
  fetchText,
  generatedAt,
  metadata,
  options
}: AddEndpointChecksInput): Promise<void> {
  if (options.probeEndpoints === false) {
    checks.push(
      check({
        id: "endpoint.probes.enabled",
        category: "endpoint",
        title: "Endpoint probes enabled",
        status: "skip",
        severity: "info",
        summary: "Endpoint probes were disabled for this run."
      })
    );
    await addX402ProbeCheck({ checks, fetchText, generatedAt, metadata, options });
    return;
  }

  const endpoints = uniqueServiceUrls(metadata.services)
    .filter((service) => isHttpUrl(service.url))
    .slice(0, options.maxEndpointProbes ?? DEFAULT_MAX_ENDPOINT_PROBES);

  if (endpoints.length === 0) {
    checks.push(
      check({
        id: "endpoint.probes.enabled",
        category: "endpoint",
        title: "Endpoint probes enabled",
        status: "skip",
        severity: "info",
        summary: "No HTTP service URLs were available to probe."
      })
    );
  } else {
    checks.push(
      check({
        id: "endpoint.probes.enabled",
        category: "endpoint",
        title: "Endpoint probes enabled",
        status: "pass",
        severity: "info",
        summary: `Probing ${endpoints.length} HTTP service endpoint(s).`
      })
    );
  }

  await Promise.all(
    endpoints.map(async (service, index) => {
      checks.push(await probeEndpoint({ fetchText, generatedAt, index, options, service }));
    })
  );

  await addX402ProbeCheck({ checks, fetchText, generatedAt, metadata, options });
}

interface ProbeEndpointInput {
  readonly fetchText: (url: string, options?: SafeFetchOptions) => Promise<SafeFetchResult>;
  readonly generatedAt: string;
  readonly index: number;
  readonly options: RunPreflightOptions;
  readonly service: Erc8004ServiceEndpoint;
}

async function probeEndpoint({
  fetchText,
  generatedAt,
  index,
  options,
  service
}: ProbeEndpointInput): Promise<ReadinessCheck> {
  const url = service.url as string;

  try {
    const response = await fetchText(url, getFetchOptions(options));
    const isServerError = response.statusCode >= 500;

    return check({
      id: `endpoint.${index + 1}.reachable`,
      category: endpointCategory(service),
      title: `${service.type} endpoint responds`,
      status: isServerError ? "warn" : "pass",
      severity: isServerError ? "medium" : "low",
      summary: `Endpoint responded with HTTP ${response.statusCode}.`,
      evidence: [
        {
          type: "http",
          label: `${service.type} endpoint`,
          value: response.url,
          statusCode: response.statusCode,
          ...(response.durationMs === undefined ? {} : { durationMs: response.durationMs }),
          fetchedAt: generatedAt
        }
      ]
    });
  } catch (error) {
    return check({
      id: `endpoint.${index + 1}.reachable`,
      category: endpointCategory(service),
      title: `${service.type} endpoint responds`,
      status: "fail",
      severity: "high",
      summary: `Endpoint probe failed: ${errorMessage(error)}`,
      evidence: [{ type: "url", label: `${service.type} endpoint`, value: url }],
      remediation: "Make the endpoint reachable over HTTPS and return a bounded response."
    });
  }
}

interface AddX402ProbeInput {
  readonly checks: ReadinessCheck[];
  readonly fetchText: (url: string, options?: SafeFetchOptions) => Promise<SafeFetchResult>;
  readonly generatedAt: string;
  readonly metadata: NormalizedAgentMetadata;
  readonly options: RunPreflightOptions;
}

async function addX402ProbeCheck({
  checks,
  fetchText,
  generatedAt,
  metadata,
  options
}: AddX402ProbeInput): Promise<void> {
  const x402Url = findX402ProbeUrl(metadata);

  if (metadata.x402Support !== true && !x402Url) {
    checks.push(
      check({
        id: "x402.endpoint.probe",
        category: "x402",
        title: "x402 endpoint returns payment requirements",
        status: "skip",
        severity: "info",
        summary: "Skipped because metadata does not declare x402 support."
      })
    );
    return;
  }

  if (!x402Url) {
    checks.push(
      check({
        id: "x402.endpoint.probe",
        category: "x402",
        title: "x402 endpoint returns payment requirements",
        status: "fail",
        severity: "high",
        summary: "x402 is declared but no HTTP endpoint is available to probe.",
        remediation: "Declare an x402 service URL or a payable service endpoint."
      })
    );
    return;
  }

  if (options.probeEndpoints === false) {
    checks.push(
      check({
        id: "x402.endpoint.probe",
        category: "x402",
        title: "x402 endpoint returns payment requirements",
        status: "skip",
        severity: "info",
        summary: "x402 probe skipped because endpoint probes were disabled.",
        evidence: [{ type: "url", label: "x402 endpoint", value: x402Url }]
      })
    );
    return;
  }

  try {
    const response = await fetchText(x402Url, getFetchOptions(options));
    const summary = summarizeX402Probe({
      endpoint: x402Url,
      statusCode: response.statusCode,
      bodyText: response.bodyText
    });
    const validCeloPayment = summary.validPaymentDetails && isCeloX402Network(summary.network);

    checks.push(
      check({
        id: "x402.endpoint.probe",
        category: "x402",
        title: "x402 endpoint returns payment requirements",
        status: validCeloPayment ? "pass" : "fail",
        severity: "high",
        summary: validCeloPayment
          ? `x402 endpoint returned valid Celo payment requirements for ${summary.network}.`
          : `x402 probe failed: ${summary.issues.join(" ") || "payment network is not Celo."}`,
        evidence: [
          {
            type: "x402",
            label: "x402 endpoint",
            value: x402Url,
            statusCode: response.statusCode,
            ...(response.durationMs === undefined ? {} : { durationMs: response.durationMs }),
            fetchedAt: generatedAt
          },
          ...(summary.network
            ? [
                {
                  type: "x402" as const,
                  label: "payment network",
                  value: summary.network
                }
              ]
            : [])
        ],
        remediation: "Return an x402 HTTP 402 response with Celo payment requirements."
      })
    );
  } catch (error) {
    checks.push(
      check({
        id: "x402.endpoint.probe",
        category: "x402",
        title: "x402 endpoint returns payment requirements",
        status: "error",
        severity: "high",
        summary: `x402 probe failed: ${errorMessage(error)}`,
        evidence: [{ type: "url", label: "x402 endpoint", value: x402Url }],
        remediation: "Make the x402 endpoint reachable and return valid payment requirements."
      })
    );
  }
}

function finalizeReport({
  checks,
  generatedAt,
  options,
  subject
}: {
  readonly checks: readonly ReadinessCheck[];
  readonly generatedAt: string;
  readonly options: RunPreflightOptions;
  readonly subject: PreflightReport["subject"];
}): PreflightReport {
  const orderedChecks = [...checks].sort(compareChecks);

  return attachReportHash({
    schemaVersion: REPORT_SCHEMA_VERSION,
    generatedAt,
    generator: {
      name: preflightEngineInfo.name,
      version: preflightEngineInfo.version,
      ...(options.commit ? { commit: options.commit } : {})
    },
    subject,
    score: scoreChecks(orderedChecks),
    checks: orderedChecks
  });
}

function compareChecks(left: ReadinessCheck, right: ReadinessCheck): number {
  return (
    left.id.localeCompare(right.id) ||
    left.category.localeCompare(right.category) ||
    left.title.localeCompare(right.title) ||
    left.summary.localeCompare(right.summary)
  );
}

function findX402ProbeUrl(metadata: NormalizedAgentMetadata): string | undefined {
  const x402Service = metadata.services.find(
    (service) => serviceType(service) === "x402" && isHttpUrl(service.url)
  );

  if (x402Service?.url) {
    return x402Service.url;
  }

  if (metadata.x402Support === true) {
    return metadata.services.find((service) => isHttpUrl(service.url))?.url;
  }

  return undefined;
}

function uniqueServiceUrls(
  services: readonly Erc8004ServiceEndpoint[]
): Erc8004ServiceEndpoint[] {
  const seen = new Set<string>();
  const unique: Erc8004ServiceEndpoint[] = [];

  for (const service of services) {
    if (!service.url || seen.has(service.url)) {
      continue;
    }

    seen.add(service.url);
    unique.push(service);
  }

  return unique;
}

function derivePrimaryUrl(
  metadataUri: string,
  metadata: NormalizedAgentMetadata
): string | undefined {
  for (const service of metadata.services) {
    const origin = httpOrigin(service.url);

    if (origin) {
      return origin;
    }
  }

  return httpOrigin(metadataUri);
}

function hasSelfAgentIdClaim(
  metadata: NormalizedAgentMetadata,
  rawMetadata: unknown
): boolean {
  if (metadata.supportedTrust.some((entry) => entry.toLowerCase().includes("self"))) {
    return true;
  }

  if (metadata.services.some((service) => serviceType(service).includes("self"))) {
    return true;
  }

  if (!isRecord(rawMetadata)) {
    return false;
  }

  return ["self", "selfAgentId", "selfProtocol", "agentIdCard"].some(
    (key) => key in rawMetadata
  );
}

function getResolveOptions(options: RunPreflightOptions) {
  return {
    ...getFetchOptions(options),
    ...(options.ipfsGatewayBaseUrl ? { ipfsGatewayBaseUrl: options.ipfsGatewayBaseUrl } : {})
  };
}

function getFetchOptions(options: RunPreflightOptions): SafeFetchOptions {
  return {
    ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
    ...(options.maxRedirects === undefined ? {} : { maxRedirects: options.maxRedirects }),
    ...(options.maxBytes === undefined ? {} : { maxBytes: options.maxBytes }),
    ...(options.userAgent === undefined ? {} : { userAgent: options.userAgent })
  };
}

function serviceEvidence(service: Erc8004ServiceEndpoint): Evidence {
  const address = isEvmAddress(service.address) ? service.address : undefined;

  return {
    type: address ? "chain" : "url",
    label: service.type,
    value: service.url ?? service.address ?? service.type,
    ...(address ? { address } : {}),
    ...(service.chainId === undefined ? {} : { chainId: service.chainId })
  };
}

function endpointCategory(service: Erc8004ServiceEndpoint): "endpoint" | "mcp" | "a2a" {
  const type = serviceType(service);

  if (type === "mcp" || type === "a2a") {
    return type;
  }

  return "endpoint";
}

function serviceType(service: Erc8004ServiceEndpoint): string {
  return service.type.toLowerCase();
}

function parseAgentId(input: string): bigint | undefined {
  try {
    const parsed = BigInt(input);

    return parsed >= 0n ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function formatAgentRegistry(chainId: number, registry: Address): string {
  return `eip155:${chainId}:${registry}`;
}

function httpOrigin(input: string | undefined): string | undefined {
  if (!input) {
    return undefined;
  }

  try {
    const url = new URL(input);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return undefined;
    }

    return url.origin;
  } catch {
    return undefined;
  }
}

function isHttpUrl(input: string | undefined): input is string {
  return Boolean(httpOrigin(input));
}

function compactUri(uri: string): string {
  return uri.startsWith("data:") ? "data:application/json" : uri;
}

function toIsoString(input: string | Date): string {
  return typeof input === "string" ? input : input.toISOString();
}

function toSafeBlockNumber(blockNumber: bigint): number | undefined {
  const asNumber = Number(blockNumber);

  return Number.isSafeInteger(asNumber) ? asNumber : undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input && typeof input === "object" && !Array.isArray(input));
}

function isEvmAddress(input: string | undefined): input is Address {
  return Boolean(input && /^0x[a-fA-F0-9]{40}$/.test(input));
}
