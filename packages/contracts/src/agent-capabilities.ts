import { z } from "zod";

export const AgentCapabilityStateSchema = z.enum(["AVAILABLE", "DISABLED", "DEGRADED", "UNKNOWN"]);
export type AgentCapabilityState = z.infer<typeof AgentCapabilityStateSchema>;

export const AgentCapabilityStatusSchema = z
  .object({
    state: AgentCapabilityStateSchema,
    reasonCode: z.string().trim().min(1).optional(),
    nextAction: z.string().trim().min(1)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.state !== "AVAILABLE" && !value.reasonCode) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reasonCode"], message: "non-available states require a reasonCode" });
    }
  });

export const AgentRuntimeCapabilitiesSchema = z
  .object({
    observedAt: z.string().datetime(),
    source: z.literal("runtime_configuration"),
    selfServeOnboarding: AgentCapabilityStatusSchema,
    mcpReadPreflight: AgentCapabilityStatusSchema,
    v1FirstSmoke: AgentCapabilityStatusSchema,
    v2UniversalWrites: AgentCapabilityStatusSchema,
    v2ShadowAssignments: AgentCapabilityStatusSchema,
    v2ShadowSubmissions: AgentCapabilityStatusSchema,
    v2SpecialistAssignments: AgentCapabilityStatusSchema,
    v2SpecialistSubmissions: AgentCapabilityStatusSchema,
    publicTrustReceipt: AgentCapabilityStatusSchema,
    proofGraph: AgentCapabilityStatusSchema
  })
  .strict();

export const PublicAgentCapabilitiesSchema = z
  .object({
    schemaVersion: z.literal(1),
    observedAt: z.string().datetime(),
    docsVersion: z.string().min(1),
    compatibleSdkRange: z.string().min(1),
    artifactUrls: z.record(z.string().startsWith("/")),
    policyPosture: z
      .object({
        policyId: z.string().min(1),
        policyVersion: z.string().min(1),
        policyDigest: z.string().startsWith("sha256:"),
        globalState: z.enum(["OFF", "SHADOW", "ENFORCE"]),
        canaryPercent: z.number().int().min(0).max(100)
      })
      .strict(),
    runtimeCapabilities: AgentRuntimeCapabilitiesSchema,
    proofGraphFormats: z.array(z.enum(["JSON", "JSON_LD", "PROV", "CLAIM_REVIEW"])),
    boundaries: z
      .object({
        mcpWrites: z.literal(false),
        browserPrivateKeys: z.literal(false),
        humanGateTwoOnly: z.literal(true),
        evidenceIsPublicationAuthority: z.literal(false)
      })
      .strict()
  })
  .strict();

export const AgentSelfCapabilitiesSchema = z
  .object({
    schemaVersion: z.literal(1),
    observedAt: z.string().datetime(),
    docsVersion: z.string().min(1),
    sdkRange: z.string().min(1),
    botId: z.string().min(1),
    registrationState: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]),
    trustState: z.enum(["UNVERIFIED", "VERIFIED"]),
    ownershipVerified: z.boolean(),
    allowedV1Actions: z.array(z.string().min(1)),
    universalLaneGrants: z.array(z.string().min(1)),
    shadowLaneEligibility: z.array(z.string().min(1)),
    specialistTypeEligibility: z.array(z.string().min(1)),
    featureAvailability: AgentRuntimeCapabilitiesSchema,
    assignmentRequired: z
      .object({ shadow: z.literal(true), specialist: z.literal(true) })
      .strict(),
    safeNextActions: z.array(z.string().min(1))
  })
  .strict();

export const AgentAssignmentSchema = z
  .object({
    assignmentId: z.string().min(1),
    storyId: z.string().min(1),
    packetId: z.string().min(1),
    packetHash: z.string().min(1),
    branch: z.enum(["SHADOW", "SPECIALIST"]),
    lane: z.string().min(1).optional(),
    specialistType: z.string().min(1).optional(),
    requirementId: z.string().min(1).optional(),
    status: z.string().min(1),
    assignedAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional(),
    expectedSubmissionEndpoint: z.enum(["/v2/agents/shadow-review-submissions", "/v2/agents/specialist-reviews"]),
    schemaVersion: z.literal("2.0"),
    policyVersion: z.string().min(1),
    agentKitRequiredWhenVerified: z.literal(true),
    safeNextAction: z.string().min(1)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.branch === "SHADOW" && !value.lane) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lane"], message: "shadow assignment requires lane" });
    if (value.branch === "SPECIALIST" && (!value.specialistType || !value.requirementId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["specialistType"], message: "specialist assignment requires specialistType and requirementId" });
    }
  });

export const AgentAssignmentsResponseSchema = z
  .object({
    schemaVersion: z.literal(1),
    observedAt: z.string().datetime(),
    botId: z.string().min(1),
    blindFirstPass: z.literal(true),
    peerSubmissionsVisible: z.literal(false),
    assignments: z.array(AgentAssignmentSchema).max(100)
  })
  .strict();

export type AgentRuntimeCapabilities = z.infer<typeof AgentRuntimeCapabilitiesSchema>;
export type PublicAgentCapabilities = z.infer<typeof PublicAgentCapabilitiesSchema>;
export type AgentSelfCapabilities = z.infer<typeof AgentSelfCapabilitiesSchema>;
export type AgentAssignment = z.infer<typeof AgentAssignmentSchema>;
export type AgentAssignmentsResponse = z.infer<typeof AgentAssignmentsResponseSchema>;

