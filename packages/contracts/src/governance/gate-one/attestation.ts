import { z } from "zod";
import { stableGateOneDigest, stableGateOneStringify } from "./canonical-json.js";
import { GateOneSeveritySchema, GateOneCheckStatusSchema } from "./preflight.js";
import { GateOneLaneSchema, GateOneSpecialistTypeSchema, GateOneVerdictSchema } from "./policy.schema.js";

const PacketHashSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const NonceSchema = z.string().min(16).max(256);
const StableIdSchema = z.string().min(1).max(160);

export const GateOneDeclaredConflictSchema = z
  .object({
    type: z.enum(["OWNER", "PROVIDER", "SOURCE", "COMMERCIAL", "OTHER"]),
    description: z.string().min(1).max(1000),
    recusalRequired: z.boolean()
  })
  .strict();
export type GateOneDeclaredConflict = z.infer<typeof GateOneDeclaredConflictSchema>;

export const GateOneReviewerMetadataSchema = z
  .object({
    botId: StableIdSchema,
    controllingOwnerId: StableIdSchema,
    verificationStatus: z.enum(["UNVERIFIED", "VERIFIED"]),
    provider: z.string().min(1).max(160),
    modelFamily: z.string().min(1).max(160),
    modelVersion: z.string().min(1).max(160),
    toolchainVersion: z.string().min(1).max(160),
    retrievalProviderIds: z.array(z.string().min(1).max(160)),
    retrievalIndexVersions: z.array(z.string().min(1).max(160)),
    promptOrRubricDigest: PacketHashSchema
  })
  .strict();
export type GateOneReviewerMetadata = z.infer<typeof GateOneReviewerMetadataSchema>;

export const GateOneAttestationCheckSchema = z
  .object({
    checkId: z.string().min(1).max(160),
    status: GateOneCheckStatusSchema,
    severity: GateOneSeveritySchema,
    claimIds: z.array(StableIdSchema),
    evidenceIds: z.array(StableIdSchema),
    objectRefs: z.array(z.string().min(1).max(240)),
    publicRationale: z.string().min(1).max(2000),
    sealedRationaleRef: z.string().min(1).max(240).optional(),
    requiredAction: z.string().min(1).max(2000).optional(),
    requiredDisclosureIds: z.array(StableIdSchema),
    requiredSpecialistTypes: z.array(GateOneSpecialistTypeSchema)
  })
  .strict();
export type GateOneAttestationCheck = z.infer<typeof GateOneAttestationCheckSchema>;

const GateOneLaneAttestationV2BaseSchema = z
  .object({
    schemaVersion: z.literal("2.0"),
    attestationId: StableIdSchema,
    storyId: StableIdSchema,
    packetHash: PacketHashSchema,
    lane: GateOneLaneSchema,
    policyVersion: z.string().min(1).max(80),
    rubricVersion: z.string().min(1).max(120),
    verdict: GateOneVerdictSchema,
    checks: z.array(GateOneAttestationCheckSchema).min(1),
    publicRationale: z.string().min(1).max(2000),
    requiredDisclosureIds: z.array(StableIdSchema),
    declaredConflicts: z.array(GateOneDeclaredConflictSchema),
    reviewer: GateOneReviewerMetadataSchema,
    signedAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional(),
    nonce: NonceSchema,
    keyVersion: z.string().min(1).max(120),
    signature: z.string().min(1).max(2000)
  })
  .strict();

export const GateOneLaneAttestationV2Schema = GateOneLaneAttestationV2BaseSchema
  .superRefine((attestation, ctx) => {
    validateStructuredDecision(attestation, ctx);
  });
export type GateOneLaneAttestationV2 = z.infer<typeof GateOneLaneAttestationV2Schema>;

export const GateOneUnsignedLaneAttestationV2Schema = GateOneLaneAttestationV2BaseSchema.omit({
  signature: true
}).superRefine((attestation, ctx) => {
  validateStructuredDecision(attestation, ctx);
});
export type GateOneUnsignedLaneAttestationV2 = z.infer<typeof GateOneUnsignedLaneAttestationV2Schema>;

export const GateOneUnsignedCreateLaneAttestationRequestV2Schema = GateOneLaneAttestationV2BaseSchema.omit({
  attestationId: true,
  signature: true
}).superRefine((attestation, ctx) => {
  validateStructuredDecision(attestation, ctx);
});
export type GateOneUnsignedCreateLaneAttestationRequestV2 = z.infer<typeof GateOneUnsignedCreateLaneAttestationRequestV2Schema>;

export const GateOneCreateLaneAttestationRequestV2Schema = GateOneLaneAttestationV2BaseSchema.omit({
  attestationId: true
}).superRefine((attestation, ctx) => {
  validateStructuredDecision(attestation, ctx);
});
export type GateOneCreateLaneAttestationRequestV2 = z.infer<typeof GateOneCreateLaneAttestationRequestV2Schema>;

const GateOneSpecialistReviewV2BaseSchema = z
  .object({
    schemaVersion: z.literal("2.0"),
    reviewId: StableIdSchema,
    storyId: StableIdSchema,
    packetHash: PacketHashSchema,
    requirementId: StableIdSchema,
    type: GateOneSpecialistTypeSchema,
    policyVersion: z.string().min(1).max(80),
    rubricVersion: z.string().min(1).max(120),
    verdict: GateOneVerdictSchema,
    checks: z.array(GateOneAttestationCheckSchema).min(1),
    publicRationale: z.string().min(1).max(2000),
    requiredDisclosureIds: z.array(StableIdSchema),
    declaredConflicts: z.array(GateOneDeclaredConflictSchema),
    reviewer: GateOneReviewerMetadataSchema,
    signedAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional(),
    nonce: NonceSchema,
    keyVersion: z.string().min(1).max(120),
    signature: z.string().min(1).max(2000)
  })
  .strict();

export const GateOneSpecialistReviewV2Schema = GateOneSpecialistReviewV2BaseSchema
  .superRefine((review, ctx) => {
    validateStructuredDecision(review, ctx);
  });
export type GateOneSpecialistReviewV2 = z.infer<typeof GateOneSpecialistReviewV2Schema>;

export const GateOneUnsignedSpecialistReviewV2Schema = GateOneSpecialistReviewV2BaseSchema.omit({
  signature: true
}).superRefine((review, ctx) => {
  validateStructuredDecision(review, ctx);
});
export type GateOneUnsignedSpecialistReviewV2 = z.infer<typeof GateOneUnsignedSpecialistReviewV2Schema>;

export const GateOneUnsignedCreateSpecialistReviewRequestV2Schema = GateOneSpecialistReviewV2BaseSchema.omit({
  reviewId: true,
  signature: true
}).superRefine((review, ctx) => {
  validateStructuredDecision(review, ctx);
});
export type GateOneUnsignedCreateSpecialistReviewRequestV2 = z.infer<typeof GateOneUnsignedCreateSpecialistReviewRequestV2Schema>;

export const GateOneCreateSpecialistReviewRequestV2Schema = GateOneSpecialistReviewV2BaseSchema.omit({
  reviewId: true
}).superRefine((review, ctx) => {
  validateStructuredDecision(review, ctx);
});
export type GateOneCreateSpecialistReviewRequestV2 = z.infer<typeof GateOneCreateSpecialistReviewRequestV2Schema>;

export const GateOneSignatureContextSchema = z
  .object({
    domain: z.literal("machinesroom.gate-one.v2"),
    apiVersion: z.literal("v2"),
    method: z.enum(["POST", "PUT", "PATCH"]),
    path: z.string().min(1).max(240)
  })
  .strict();
export type GateOneSignatureContext = z.infer<typeof GateOneSignatureContextSchema>;

export const GateOneStructuredDecisionSignaturePayloadSchema = z
  .object({
    domain: z.literal("machinesroom.gate-one.v2"),
    apiVersion: z.literal("v2"),
    method: z.enum(["POST", "PUT", "PATCH"]),
    path: z.string().min(1).max(240),
    body: z.record(z.unknown()),
    bodyDigest: PacketHashSchema,
    storyId: StableIdSchema,
    packetHash: PacketHashSchema,
    policyVersion: z.string().min(1).max(80),
    rubricVersion: z.string().min(1).max(120),
    decisionKind: z.enum(["LANE_ATTESTATION", "SPECIALIST_REVIEW"]),
    lane: GateOneLaneSchema.optional(),
    specialistType: GateOneSpecialistTypeSchema.optional(),
    verdict: GateOneVerdictSchema,
    reviewer: GateOneReviewerMetadataSchema,
    signedAt: z.string().datetime(),
    nonce: NonceSchema,
    keyVersion: z.string().min(1).max(120),
    expiresAt: z.string().datetime().optional()
  })
  .strict();
export type GateOneStructuredDecisionSignaturePayload = z.infer<typeof GateOneStructuredDecisionSignaturePayloadSchema>;

export const DEFAULT_GATE_ONE_ATTESTATION_SIGNATURE_CONTEXT: GateOneSignatureContext = {
  domain: "machinesroom.gate-one.v2",
  apiVersion: "v2",
  method: "POST",
  path: "/v2/agents/attestations"
};

export const DEFAULT_GATE_ONE_SPECIALIST_SIGNATURE_CONTEXT: GateOneSignatureContext = {
  domain: "machinesroom.gate-one.v2",
  apiVersion: "v2",
  method: "POST",
  path: "/v2/agents/specialist-reviews"
};

export type GateOneLaneAttestationSignatureInput =
  | GateOneLaneAttestationV2
  | GateOneUnsignedLaneAttestationV2
  | GateOneCreateLaneAttestationRequestV2
  | GateOneUnsignedCreateLaneAttestationRequestV2;
export type GateOneLaneAttestationSignatureBody = GateOneUnsignedLaneAttestationV2 | GateOneUnsignedCreateLaneAttestationRequestV2;
export type GateOneSpecialistReviewSignatureInput =
  | GateOneSpecialistReviewV2
  | GateOneUnsignedSpecialistReviewV2
  | GateOneCreateSpecialistReviewRequestV2
  | GateOneUnsignedCreateSpecialistReviewRequestV2;
export type GateOneSpecialistReviewSignatureBody = GateOneUnsignedSpecialistReviewV2 | GateOneUnsignedCreateSpecialistReviewRequestV2;

const GateOneLaneAttestationSignatureBodySchema = z.union([
  GateOneUnsignedLaneAttestationV2Schema,
  GateOneUnsignedCreateLaneAttestationRequestV2Schema
]);

const GateOneSpecialistReviewSignatureBodySchema = z.union([
  GateOneUnsignedSpecialistReviewV2Schema,
  GateOneUnsignedCreateSpecialistReviewRequestV2Schema
]);

export function laneAttestationUnsignedBody(
  attestation: GateOneLaneAttestationSignatureInput
): GateOneLaneAttestationSignatureBody {
  return GateOneLaneAttestationSignatureBodySchema.parse(stripSignature(attestation));
}

export function specialistReviewUnsignedBody(
  review: GateOneSpecialistReviewSignatureInput
): GateOneSpecialistReviewSignatureBody {
  return GateOneSpecialistReviewSignatureBodySchema.parse(stripSignature(review));
}

export function buildLaneAttestationSignaturePayload(
  attestation: GateOneLaneAttestationSignatureInput,
  context: GateOneSignatureContext = DEFAULT_GATE_ONE_ATTESTATION_SIGNATURE_CONTEXT
): GateOneStructuredDecisionSignaturePayload {
  const body = laneAttestationUnsignedBody(attestation);
  const parsedContext = GateOneSignatureContextSchema.parse(context);
  return GateOneStructuredDecisionSignaturePayloadSchema.parse(removeUndefinedFields({
    ...parsedContext,
    body,
    bodyDigest: stableGateOneDigest(body),
    storyId: body.storyId,
    packetHash: body.packetHash,
    policyVersion: body.policyVersion,
    rubricVersion: body.rubricVersion,
    decisionKind: "LANE_ATTESTATION",
    lane: body.lane,
    verdict: body.verdict,
    reviewer: body.reviewer,
    signedAt: body.signedAt,
    nonce: body.nonce,
    keyVersion: body.keyVersion,
    expiresAt: body.expiresAt
  }));
}

export function buildSpecialistReviewSignaturePayload(
  review: GateOneSpecialistReviewSignatureInput,
  context: GateOneSignatureContext = DEFAULT_GATE_ONE_SPECIALIST_SIGNATURE_CONTEXT
): GateOneStructuredDecisionSignaturePayload {
  const body = specialistReviewUnsignedBody(review);
  const parsedContext = GateOneSignatureContextSchema.parse(context);
  return GateOneStructuredDecisionSignaturePayloadSchema.parse(removeUndefinedFields({
    ...parsedContext,
    body,
    bodyDigest: stableGateOneDigest(body),
    storyId: body.storyId,
    packetHash: body.packetHash,
    policyVersion: body.policyVersion,
    rubricVersion: body.rubricVersion,
    decisionKind: "SPECIALIST_REVIEW",
    specialistType: body.type,
    verdict: body.verdict,
    reviewer: body.reviewer,
    signedAt: body.signedAt,
    nonce: body.nonce,
    keyVersion: body.keyVersion,
    expiresAt: body.expiresAt
  }));
}

export function canonicalizeStructuredDecisionSignaturePayload(payload: GateOneStructuredDecisionSignaturePayload): string {
  return stableGateOneStringify(GateOneStructuredDecisionSignaturePayloadSchema.parse(payload));
}

export function structuredDecisionSignaturePayloadDigest(payload: GateOneStructuredDecisionSignaturePayload): `sha256:${string}` {
  return stableGateOneDigest(GateOneStructuredDecisionSignaturePayloadSchema.parse(payload));
}

function validateStructuredDecision(
  decision: {
    verdict: z.infer<typeof GateOneVerdictSchema>;
    checks: Array<z.infer<typeof GateOneAttestationCheckSchema>>;
    requiredDisclosureIds: string[];
    declaredConflicts: Array<z.infer<typeof GateOneDeclaredConflictSchema>>;
  },
  ctx: z.RefinementCtx
) {
  const checkIds = new Set<string>();
  for (const [index, check] of decision.checks.entries()) {
    if (checkIds.has(check.checkId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["checks", index, "checkId"], message: `duplicate check ${check.checkId}` });
    }
    checkIds.add(check.checkId);
  }

  const checkDisclosureIds = new Set(decision.checks.flatMap((check) => check.requiredDisclosureIds));
  for (const disclosureId of decision.requiredDisclosureIds) {
    checkDisclosureIds.add(disclosureId);
  }

  if (decision.verdict === "PASS_WITH_DISCLOSURE" && checkDisclosureIds.size === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["requiredDisclosureIds"],
      message: "PASS_WITH_DISCLOSURE requires at least one disclosure id"
    });
  }

  if (decision.verdict === "PASS" || decision.verdict === "PASS_WITH_DISCLOSURE") {
    const failingCheck = decision.checks.find((check) => check.status === "FAIL");
    if (failingCheck) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["verdict"],
        message: `${decision.verdict} decision cannot include failing checks`
      });
    }
  }

  if (decision.declaredConflicts.some((conflict) => conflict.recusalRequired)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["declaredConflicts"],
      message: "decision with a required recusal is ineligible"
    });
  }
}

function removeUndefinedFields<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => typeof value !== "undefined"));
}

function stripSignature<T extends GateOneLaneAttestationSignatureInput | GateOneSpecialistReviewSignatureInput>(
  input: T
): Omit<T, "signature"> {
  const { signature: _signature, ...body } = input as T & { signature?: string };
  return body;
}
