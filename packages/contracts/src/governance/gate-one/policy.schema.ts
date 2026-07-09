import { z } from "zod";

export const GateOneEnforcementStateSchema = z.enum(["DISABLED", "OBSERVE", "SHADOW", "WARN", "ENFORCE"]);
export type GateOneEnforcementState = z.infer<typeof GateOneEnforcementStateSchema>;

export const GateOneUniversalLaneSchema = z.enum([
  "WRITER",
  "FACT_CHECK",
  "RISK",
  "SOURCE_DIVERSITY",
  "FAIRNESS_REPLY",
  "PROVENANCE_AUTH"
]);
export type GateOneUniversalLane = z.infer<typeof GateOneUniversalLaneSchema>;

export const GateOneShadowLaneSchema = z.enum(["EDITORIAL_INTEGRITY"]);
export type GateOneShadowLane = z.infer<typeof GateOneShadowLaneSchema>;

export const GateOneLaneSchema = z.union([GateOneUniversalLaneSchema, GateOneShadowLaneSchema]);
export type GateOneLane = z.infer<typeof GateOneLaneSchema>;

export const GateOnePreflightContractSchema = z.enum([
  "PACKET_INTEGRITY_V1",
  "PUBLICATION_QA_V1",
  "RIGHTS_ROUTING_V1",
  "LIFECYCLE_READINESS_V1"
]);
export type GateOnePreflightContract = z.infer<typeof GateOnePreflightContractSchema>;

export const GateOneSpecialistTypeSchema = z.enum([
  "LEGAL_RIGHTS",
  "DOMAIN_EXPERT",
  "VISUAL_FORENSICS",
  "LOCAL_LANGUAGE_CONTEXT",
  "DATA_METHODOLOGY"
]);
export type GateOneSpecialistType = z.infer<typeof GateOneSpecialistTypeSchema>;

export const GateOneVerdictSchema = z.enum([
  "PASS",
  "PASS_WITH_DISCLOSURE",
  "REVISE",
  "QUARANTINE",
  "BLOCK",
  "UNAVAILABLE"
]);
export type GateOneVerdict = z.infer<typeof GateOneVerdictSchema>;

export const GateOneStoryProfileSchema = z.enum(["BREAKING", "STANDARD", "DEEP"]);
export type GateOneStoryProfile = z.infer<typeof GateOneStoryProfileSchema>;

export const GateOneRequirementStatusSchema = z.enum(["IMPLEMENTED", "PARTIAL", "MISSING", "BLOCKED"]);
export type GateOneRequirementStatus = z.infer<typeof GateOneRequirementStatusSchema>;

export const GATE_ONE_UNIVERSAL_LANES = GateOneUniversalLaneSchema.options;
export const GATE_ONE_SHADOW_LANES = GateOneShadowLaneSchema.options;
export const GATE_ONE_PREFLIGHT_CONTRACTS = GateOnePreflightContractSchema.options;
export const GATE_ONE_SPECIALIST_TYPES = GateOneSpecialistTypeSchema.options;
export const GATE_ONE_VERDICTS = GateOneVerdictSchema.options;
export const GATE_ONE_STORY_PROFILES = GateOneStoryProfileSchema.options;

const BlueprintRefSchema = z
  .object({
    id: z.literal("machinesroom-gate-one-v2"),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    decisionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  })
  .strict();

const InvariantSchema = z
  .object({
    id: z.string().regex(/^INV-\d{3}$/),
    rule: z.string().min(1),
    expression: z.string().min(1).optional()
  })
  .strict();

const CheckDefinitionSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    severityFloor: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    public: z.boolean().default(true)
  })
  .strict();

const LanePolicySchema = z
  .object({
    id: GateOneLaneSchema,
    label: z.string().min(1),
    universal: z.boolean(),
    state: GateOneEnforcementStateSchema,
    rubricVersion: z.string().min(1),
    owner: z.string().min(1),
    summary: z.string().min(1),
    requiredCheckIds: z.array(z.string().min(1)).min(1),
    checks: z.array(CheckDefinitionSchema).min(1)
  })
  .strict()
  .superRefine((lane, ctx) => {
    const checkIds = new Set(lane.checks.map((check) => check.id));
    for (const checkId of lane.requiredCheckIds) {
      if (!checkIds.has(checkId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["requiredCheckIds"],
          message: `required check ${checkId} is not defined in ${lane.id}`
        });
      }
    }
  });

const PreflightPolicySchema = z
  .object({
    id: GateOnePreflightContractSchema,
    version: z.string().min(1),
    state: GateOneEnforcementStateSchema,
    owner: z.string().min(1),
    failureBehavior: z.literal("FAIL_CLOSED"),
    summary: z.string().min(1),
    checks: z.array(CheckDefinitionSchema).min(1)
  })
  .strict();

const SpecialistPolicySchema = z
  .object({
    id: GateOneSpecialistTypeSchema,
    label: z.string().min(1),
    state: GateOneEnforcementStateSchema,
    conditional: z.literal(true),
    minimumSigners: z.number().int().positive(),
    owner: z.string().min(1),
    triggerRuleCodes: z.array(z.string().min(1)).min(1)
  })
  .strict();

const VerdictPolicySchema = z
  .object({
    id: GateOneVerdictSchema,
    countsTowardPass: z.boolean(),
    requiresDisclosureReceipt: z.boolean().default(false),
    blocksPublication: z.boolean(),
    hardVeto: z.boolean().default(false),
    summary: z.string().min(1)
  })
  .strict();

const ProfilePolicySchema = z
  .object({
    universalLanes: z.array(GateOneUniversalLaneSchema),
    factCheckSigners: z.number().int().positive(),
    writerSigners: z.number().int().positive(),
    riskSigners: z.number().int().positive(),
    sourceDiversitySigners: z.number().int().positive(),
    fairnessSigners: z.number().int().positive(),
    provenanceSigners: z.number().int().positive(),
    editorialIntegrityShadowSigners: z.number().int().nonnegative(),
    defaultAttestationTtlMinutes: z.number().int().positive(),
    allowBreakingPendingReplyDisclosure: z.boolean()
  })
  .strict();

const HighRiskOverlayPolicySchema = z
  .object({
    factCheckSigners: z.number().int().positive(),
    riskSigners: z.number().int().positive(),
    fairnessSigners: z.number().int().positive(),
    provenanceSigners: z.number().int().positive(),
    modelFamilyMinimum: z.number().int().positive(),
    retrievalProviderMinimum: z.number().int().positive(),
    specialistRouting: z.literal("STRICT")
  })
  .strict();

const IndependencePolicySchema = z
  .object({
    writerMustNotReview: z.array(z.union([GateOneUniversalLaneSchema, GateOneShadowLaneSchema])).min(1),
    factCheckDistinctOwners: z.number().int().positive(),
    standardDistinctOwners: z.number().int().positive(),
    highRiskDistinctOwners: z.number().int().positive(),
    highRiskSeparatedLanes: z.array(GateOneUniversalLaneSchema).min(1),
    modelFamilyMinimum: z.number().int().positive(),
    retrievalProviderMinimumHighRisk: z.number().int().positive()
  })
  .strict();

const RiskSemanticsSchema = z
  .object({
    negativeRiskVerdictsStopPublication: z.literal(true),
    hardVetoVerdict: z.literal("BLOCK"),
    legacyObjectionMapping: z.record(z.enum(["REVISE", "QUARANTINE", "BLOCK"]))
  })
  .strict();

const DisclosurePolicySchema = z
  .object({
    passWithDisclosureRequiresReceipt: z.literal(true),
    receiptBoundToPacketHash: z.literal(true),
    receiptBoundToRenderedArtifactHash: z.literal(true),
    publicSealedSplitRequired: z.literal(true),
    publicReceiptMustNotExpose: z.array(z.string().min(1)).min(1)
  })
  .strict();

const ActivationPolicySchema = z
  .object({
    globalState: GateOneEnforcementStateSchema,
    canaryPercent: z.number().int().min(0).max(100),
    componentStates: z.record(GateOneEnforcementStateSchema)
  })
  .strict();

export const GateOnePolicySchema = z
  .object({
    policyId: z.literal("gate-one-v2-mvp"),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    blueprint: BlueprintRefSchema,
    constitutionDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
    invariants: z.array(InvariantSchema).min(1),
    activation: ActivationPolicySchema,
    universalLanes: z.array(LanePolicySchema),
    shadowLanes: z.array(LanePolicySchema),
    preflights: z.array(PreflightPolicySchema),
    specialists: z.array(SpecialistPolicySchema),
    verdicts: z.array(VerdictPolicySchema),
    profiles: z.record(GateOneStoryProfileSchema, ProfilePolicySchema),
    highRiskOverlay: HighRiskOverlayPolicySchema,
    independence: IndependencePolicySchema,
    riskSemantics: RiskSemanticsSchema,
    disclosures: DisclosurePolicySchema,
    generatedArtifactPaths: z.array(z.string().min(1)).min(1)
  })
  .strict()
  .superRefine((policy, ctx) => {
    assertExactSet(ctx, ["universalLanes"], policy.universalLanes.map((lane) => lane.id), GATE_ONE_UNIVERSAL_LANES);
    assertExactSet(ctx, ["shadowLanes"], policy.shadowLanes.map((lane) => lane.id), GATE_ONE_SHADOW_LANES);
    assertExactSet(ctx, ["preflights"], policy.preflights.map((preflight) => preflight.id), GATE_ONE_PREFLIGHT_CONTRACTS);
    assertExactSet(ctx, ["specialists"], policy.specialists.map((specialist) => specialist.id), GATE_ONE_SPECIALIST_TYPES);
    assertExactSet(ctx, ["verdicts"], policy.verdicts.map((verdict) => verdict.id), GATE_ONE_VERDICTS);
    assertExactSet(ctx, ["profiles"], Object.keys(policy.profiles), GATE_ONE_STORY_PROFILES);

    const legal = policy.specialists.find((specialist) => specialist.id === "LEGAL_RIGHTS");
    if (!legal?.conditional) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["specialists", "LEGAL_RIGHTS"],
        message: "LEGAL_RIGHTS must remain conditional, not universal"
      });
    }

    const editorial = policy.shadowLanes.find((lane) => lane.id === "EDITORIAL_INTEGRITY");
    if (editorial?.state !== "SHADOW") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shadowLanes", "EDITORIAL_INTEGRITY", "state"],
        message: "EDITORIAL_INTEGRITY must remain SHADOW in the MVP policy"
      });
    }

    for (const [profileId, profile] of Object.entries(policy.profiles)) {
      assertExactSet(ctx, ["profiles", profileId, "universalLanes"], profile.universalLanes, GATE_ONE_UNIVERSAL_LANES);
      if (profile.factCheckSigners < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["profiles", profileId, "factCheckSigners"],
          message: "Gate One V2 profiles require at least two Fact Check signers"
        });
      }
    }

    const passWithDisclosure = policy.verdicts.find((verdict) => verdict.id === "PASS_WITH_DISCLOSURE");
    if (!passWithDisclosure?.requiresDisclosureReceipt || passWithDisclosure.countsTowardPass !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["verdicts", "PASS_WITH_DISCLOSURE"],
        message: "PASS_WITH_DISCLOSURE must count only with a rendered disclosure receipt"
      });
    }

    const block = policy.verdicts.find((verdict) => verdict.id === "BLOCK");
    if (!block?.hardVeto || !block.blocksPublication) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["verdicts", "BLOCK"],
        message: "BLOCK must be the hard veto classification"
      });
    }
  });

export type GateOnePolicy = z.infer<typeof GateOnePolicySchema>;
export type GateOneLanePolicy = z.infer<typeof LanePolicySchema>;
export type GateOnePreflightPolicy = z.infer<typeof PreflightPolicySchema>;
export type GateOneSpecialistPolicy = z.infer<typeof SpecialistPolicySchema>;
export type GateOneVerdictPolicy = z.infer<typeof VerdictPolicySchema>;

export function parseGateOnePolicy(input: unknown): GateOnePolicy {
  return GateOnePolicySchema.parse(input);
}

function assertExactSet(
  ctx: z.RefinementCtx,
  path: Array<string | number>,
  actualValues: readonly string[],
  expectedValues: readonly string[]
) {
  const actual = new Set(actualValues);
  const expected = new Set(expectedValues);
  const missing = expectedValues.filter((value) => !actual.has(value));
  const extra = actualValues.filter((value) => !expected.has(value));
  if (missing.length > 0 || extra.length > 0 || actual.size !== actualValues.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message: `expected exactly [${expectedValues.join(", ")}], missing [${missing.join(", ")}], extra [${extra.join(", ")}]`
    });
  }
}
