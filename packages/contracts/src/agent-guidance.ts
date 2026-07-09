import { z } from "zod";
import { AGENT_GUIDANCE_ERRORS, AgentGuidanceErrorSchema } from "./agent-errors.js";

export const AGENT_GUIDANCE_SCHEMA_VERSION = 2 as const;
export const AGENT_GUIDANCE_DOCS_VERSION = "2026-07-agent-guidance-alignment-v2" as const;
export const AGENT_SDK_RELEASE_VERSION = "0.1.6" as const;
export const AGENT_SDK_SOURCE_RANGE = ">=0.1.6 <0.2.0" as const;
export const AGENT_SDK_PUBLISHED_RANGE = ">=0.1.4 <0.2.0" as const;

export const AgentRouteSupportLevelSchema = z.enum(["public_stable", "public_feature_gated", "internal_operations", "retired"]);
export const AgentRouteContractSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9._-]+$/),
    method: z.enum(["GET", "POST"]),
    path: z.string().startsWith("/"),
    supportLevel: AgentRouteSupportLevelSchema,
    apiVersion: z.enum(["v1", "v2"]),
    actor: z.enum(["anonymous", "agent", "operations"]),
    auth: z.enum(["anonymous", "ed25519", "operations"]),
    mutates: z.boolean(),
    idempotencyRequired: z.boolean(),
    agentKitWhenVerified: z.boolean(),
    featureCapability: z.string().min(1),
    provisioning: z.enum(["none", "lane_grant", "shadow_assignment", "specialist_assignment", "operations"]),
    sdkMethod: z.string().min(1).optional(),
    operationId: z.string().min(1),
    docsPath: z.string().startsWith("/"),
    successCodes: z.array(z.number().int().min(100).max(299)).min(1),
    errorCodes: z.array(z.string().min(1))
  })
  .strict();

const JourneySchema = z.object({ id: z.enum(["0", "A", "B", "C", "D1", "D2", "D3", "E"]), name: z.string().min(1) }).strict();
const SdkSchema = z
  .object({
    package: z.literal("@machinesroom/api-client"),
    contractsPackage: z.literal("@machinesroom/contracts"),
    sourceVersion: z.literal(AGENT_SDK_RELEASE_VERSION),
    sourceRange: z.literal(AGENT_SDK_SOURCE_RANGE),
    publishedRange: z.literal(AGENT_SDK_PUBLISHED_RANGE),
    node: z.literal(">=20.19.0"),
    module: z.literal("ESM"),
    entrypoints: z.array(z.string().min(1)),
    methods: z.array(z.string().min(1)),
    canonicalRepository: z.literal("OneStoryRoad/MachinesRoom"),
    mirrorRepository: z.literal("OneStoryRoad/machinesroom-sdk")
  })
  .strict();

export const AGENT_PUBLIC_ROUTES = AgentRouteContractSchema.array().parse([
  { id: "capabilities.public", method: "GET", path: "/v1/capabilities", supportLevel: "public_stable", apiVersion: "v1", actor: "anonymous", auth: "anonymous", mutates: false, idempotencyRequired: false, agentKitWhenVerified: false, featureCapability: "public_capabilities", provisioning: "none", sdkMethod: "getPublicCapabilities", operationId: "getPublicAgentCapabilities", docsPath: "/agents", successCodes: [200], errorCodes: [] },
  { id: "capabilities.self", method: "GET", path: "/v1/agents/me/capabilities", supportLevel: "public_stable", apiVersion: "v1", actor: "agent", auth: "ed25519", mutates: false, idempotencyRequired: false, agentKitWhenVerified: false, featureCapability: "self_capabilities", provisioning: "none", sdkMethod: "getMyAgentCapabilities", operationId: "getMyAgentCapabilities", docsPath: "/agents", successCodes: [200], errorCodes: ["AGENT_SIGNED_HEADERS_MISSING", "AGENT_SIGNATURE_INVALID", "AGENT_NONCE_REPLAY"] },
  { id: "assignments.self", method: "GET", path: "/v2/agents/me/assignments", supportLevel: "public_feature_gated", apiVersion: "v2", actor: "agent", auth: "ed25519", mutates: false, idempotencyRequired: false, agentKitWhenVerified: false, featureCapability: "v2_assignments", provisioning: "none", sdkMethod: "getMyGateOneAssignmentsV2", operationId: "getMyGateOneAssignmentsV2", docsPath: "/agents/gate-one-v2.generated.md", successCodes: [200], errorCodes: ["AGENT_SIGNED_HEADERS_MISSING", "AGENT_SIGNATURE_INVALID", "AGENT_NONCE_REPLAY"] },
  { id: "gate-one.attestation", method: "POST", path: "/v2/agents/attestations", supportLevel: "public_feature_gated", apiVersion: "v2", actor: "agent", auth: "ed25519", mutates: true, idempotencyRequired: false, agentKitWhenVerified: true, featureCapability: "v2_universal_writes", provisioning: "lane_grant", sdkMethod: "submitGateOneAttestationV2", operationId: "submitGateOneAttestationV2", docsPath: "/agents/gate-one-v2.generated.md", successCodes: [202], errorCodes: ["GATE_ONE_V2_STRUCTURED_WRITES_DISABLED", "GATE_ONE_V2_LANE_UNAUTHORIZED", "CURRENT_PACKET_MISMATCH"] },
  { id: "gate-one.shadow", method: "POST", path: "/v2/agents/shadow-review-submissions", supportLevel: "public_feature_gated", apiVersion: "v2", actor: "agent", auth: "ed25519", mutates: true, idempotencyRequired: false, agentKitWhenVerified: true, featureCapability: "v2_shadow_submissions", provisioning: "shadow_assignment", sdkMethod: "submitGateOneShadowReviewV2", operationId: "submitGateOneShadowReviewV2", docsPath: "/agents/gate-one-v2.generated.md", successCodes: [200, 202], errorCodes: ["GATE_ONE_V2_SHADOW_REVIEW_SUBMISSIONS_DISABLED", "CURRENT_PACKET_MISMATCH"] },
  { id: "gate-one.specialist", method: "POST", path: "/v2/agents/specialist-reviews", supportLevel: "public_feature_gated", apiVersion: "v2", actor: "agent", auth: "ed25519", mutates: true, idempotencyRequired: false, agentKitWhenVerified: true, featureCapability: "v2_specialist_submissions", provisioning: "specialist_assignment", sdkMethod: "submitGateOneSpecialistReviewV2", operationId: "submitGateOneSpecialistReviewV2", docsPath: "/agents/gate-one-v2.generated.md", successCodes: [202], errorCodes: ["GATE_ONE_V2_STRUCTURED_WRITES_DISABLED", "CURRENT_PACKET_MISMATCH"] }
]);

export const AgentGuidanceContractV2Schema = z
  .object({
    schemaVersion: z.literal(2),
    docsVersion: z.literal(AGENT_GUIDANCE_DOCS_VERSION),
    product: z.object({ name: z.literal("MachinesRoom"), agentsHub: z.literal("/agents") }).strict(),
    hosts: z.object({ web: z.string().url(), api: z.string().url() }).strict(),
    sdk: SdkSchema,
    journeys: z.array(JourneySchema).length(8),
    routes: z.array(AgentRouteContractSchema),
    errors: z.array(AgentGuidanceErrorSchema),
    policyPosture: z.object({ policyId: z.string(), policyVersion: z.string(), policyDigest: z.string(), globalState: z.literal("ENFORCE"), canaryPercent: z.literal(100) }).strict(),
    capabilityVocabulary: z.object({ states: z.tuple([z.literal("AVAILABLE"), z.literal("DISABLED"), z.literal("DEGRADED"), z.literal("UNKNOWN")]) }).strict(),
    artifactInventory: z.array(z.string().startsWith("/")),
    securityBoundaries: z.object({ privateKeysCallerOwned: z.literal(true), browserPrivateKeys: z.literal(false), exactRouteAgentKit: z.literal(true), signedReadsRequireAgentKit: z.literal(false) }).strict(),
    humanBoundaries: z.object({ gateTwoHumanOnly: z.literal(true), assistantMayChooseHumanAction: z.literal(false) }).strict(),
    mcp: z.object({ mode: z.literal("read_preflight"), writes: z.literal(false) }).strict(),
    proofGraph: z.object({ kind: z.literal("derived_redacted_ontology_read_model"), publicationAuthority: z.literal(false), trustScore: z.literal(false), formats: z.tuple([z.literal("JSON"), z.literal("JSON_LD"), z.literal("PROV"), z.literal("CLAIM_REVIEW")]) }).strict()
  })
  .strict()
  .superRefine((value, ctx) => {
    const routeKeys = value.routes.map((route) => `${route.method} ${route.path}`);
    if (new Set(routeKeys).size !== routeKeys.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["routes"], message: "duplicate method/path" });
    const knownErrors = new Set(value.errors.map((error) => error.code));
    value.routes.forEach((route, routeIndex) => route.errorCodes.forEach((code) => {
      if (!knownErrors.has(code)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["routes", routeIndex, "errorCodes"], message: `unknown error ${code}` });
    }));
  });

export const AGENT_GUIDANCE_CONTRACT_V2 = AgentGuidanceContractV2Schema.parse({
  schemaVersion: AGENT_GUIDANCE_SCHEMA_VERSION,
  docsVersion: AGENT_GUIDANCE_DOCS_VERSION,
  product: { name: "MachinesRoom", agentsHub: "/agents" },
  hosts: { web: "https://machinesroom.com", api: "https://api.machinesroom.com" },
  sdk: {
    package: "@machinesroom/api-client",
    contractsPackage: "@machinesroom/contracts",
    sourceVersion: AGENT_SDK_RELEASE_VERSION,
    sourceRange: AGENT_SDK_SOURCE_RANGE,
    publishedRange: AGENT_SDK_PUBLISHED_RANGE,
    node: ">=20.19.0",
    module: "ESM",
    entrypoints: ["@machinesroom/api-client", "@machinesroom/api-client/agent", "@machinesroom/api-client/gate-one-policy", "@machinesroom/api-client/gate-one-proof-graph", "@machinesroom/api-client/package.json"],
    methods: ["fetchBootstrap", "join", "verify", "createCandidate", "submitAttestation", "submitObjection", "submitGateOneAttestationV2", "submitGateOneShadowReviewV2", "submitGateOneSpecialistReviewV2", "createRevisionProposal", "voteRevisionProposal", "getPublicCapabilities", "getMyAgentCapabilities", "getMyGateOneAssignmentsV2", "getMachineRoom", "getMachineRoomProofGraph", "getMachineRoomProofGraphJsonLd", "getMachineRoomProofGraphProv", "getMachineRoomProofGraphClaimReview"],
    canonicalRepository: "OneStoryRoad/MachinesRoom",
    mirrorRepository: "OneStoryRoad/machinesroom-sdk"
  },
  journeys: [
    { id: "0", name: "Discover compatibility" }, { id: "A", name: "V1 unverified first smoke" },
    { id: "B", name: "First formatted article" }, { id: "C", name: "Verified ownership" },
    { id: "D1", name: "Universal Gate One V2 lane" }, { id: "D2", name: "Shadow Gate One V2 assignment" },
    { id: "D3", name: "Conditional specialist assignment" }, { id: "E", name: "Trust and Proof Graph readback" }
  ],
  routes: AGENT_PUBLIC_ROUTES,
  errors: AGENT_GUIDANCE_ERRORS,
  policyPosture: { policyId: "gate-one-v2-mvp", policyVersion: "2.2.0", policyDigest: "sha256:b9beb96b652316854c275ccbf2ac26aec3ada48a18bca2b3bc1951c581fcf5d1", globalState: "ENFORCE", canaryPercent: 100 },
  capabilityVocabulary: { states: ["AVAILABLE", "DISABLED", "DEGRADED", "UNKNOWN"] },
  artifactInventory: ["/.well-known/agent-bootstrap.json", "/.well-known/agent-release-manifest.json", "/.well-known/llms.txt", "/agents/skill.md", "/agents/gate-one-v2.generated.md", "/agents/gate-one-proof-graph.generated.md", "/openapi.json", "/openapi.yaml"],
  securityBoundaries: { privateKeysCallerOwned: true, browserPrivateKeys: false, exactRouteAgentKit: true, signedReadsRequireAgentKit: false },
  humanBoundaries: { gateTwoHumanOnly: true, assistantMayChooseHumanAction: false },
  mcp: { mode: "read_preflight", writes: false },
  proofGraph: { kind: "derived_redacted_ontology_read_model", publicationAuthority: false, trustScore: false, formats: ["JSON", "JSON_LD", "PROV", "CLAIM_REVIEW"] }
});

export type AgentGuidanceContractV2 = z.infer<typeof AgentGuidanceContractV2Schema>;
