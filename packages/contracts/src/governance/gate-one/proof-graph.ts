import { z } from "zod";
import { stableGateOneDigest, stableGateOneStringify } from "./canonical-json.js";

export const GATE_ONE_PROOF_GRAPH_ONTOLOGY_VERSION = "gate-one-proof-graph-v1" as const;
export const GATE_ONE_PROOF_GRAPH_SCHEMA_VERSION = "1.0" as const;
export const GATE_ONE_PROOF_GRAPH_PUBLIC_REDACTION_VERSION = "gate-one-proof-graph-public-v1" as const;

export const GATE_ONE_PROOF_NODE_KINDS = [
  "STORY",
  "PACKET",
  "ARTICLE_BLOCK",
  "CLAIM",
  "SOURCE",
  "ORIGIN_CLUSTER",
  "EVIDENCE",
  "MEDIA",
  "PROVENANCE_ENTITY",
  "PROVENANCE_ACTIVITY",
  "PROVENANCE_AGENT",
  "STAKEHOLDER",
  "DISCLOSURE",
  "PREFLIGHT_RUN",
  "PREFLIGHT_CHECK",
  "LANE_ATTESTATION",
  "ATTESTATION_CHECK",
  "SHADOW_LANE_RUN",
  "SHADOW_REVIEW_ASSIGNMENT",
  "SHADOW_REVIEW_SUBMISSION",
  "SPECIALIST_REQUIREMENT",
  "SPECIALIST_REVIEW",
  "SPECIALIST_ASSIGNMENT",
  "SPECIALIST_ASSIGNMENT_EVENT",
  "SPECIALIST_PROVIDER_OUTAGE",
  "DISCLOSURE_RECEIPT",
  "CONSENSUS_EVALUATION",
  "PUBLIC_TRUST_RECEIPT",
  "SAFETY_GATE_HANDOFF",
  "PUBLISH_READINESS",
  "LEGAL_HOLD",
  "SEALED_EVIDENCE_REF",
  "SEALED_EVIDENCE_ACCESS_AUDIT",
  "SEALED_EVIDENCE_PAYLOAD_AUDIT",
  "OBJECTION",
  "COMMENT",
  "FLAG",
  "REVISION",
  "CORRECTION",
  "TRANSLATION",
  "STORY_DUPLICATE_ALIAS"
] as const;

export const GATE_ONE_PROOF_RELATION_KINDS = [
  "STORY_HAS_PACKET",
  "PACKET_SUPERSEDES_PACKET",
  "PACKET_CONTAINS_CLAIM",
  "PACKET_CONTAINS_SOURCE",
  "PACKET_CONTAINS_EVIDENCE",
  "PACKET_CONTAINS_MEDIA",
  "PACKET_HAS_DISCLOSURE",
  "ARTICLE_BLOCK_EXPRESSES_CLAIM",
  "ARTICLE_BLOCK_CITES_EVIDENCE",
  "ARTICLE_BLOCK_RENDERS_MEDIA",
  "CLAIM_SUPPORTED_BY_EVIDENCE",
  "CLAIM_COUNTERED_BY_EVIDENCE",
  "CLAIM_HAS_SUBJECT",
  "CLAIM_HAS_TEMPORAL_SCOPE",
  "CLAIM_ADDRESSED_BY_ARTICLE_BLOCK",
  "EVIDENCE_FROM_SOURCE",
  "EVIDENCE_IN_ORIGIN_CLUSTER",
  "SOURCE_IN_ORIGIN_CLUSTER",
  "SOURCE_INDEPENDENT_FROM_SOURCE",
  "MEDIA_DERIVED_FROM_EVIDENCE",
  "PROVENANCE_WAS_DERIVED_FROM",
  "PROVENANCE_WAS_GENERATED_BY",
  "PROVENANCE_USED",
  "PROVENANCE_WAS_ATTRIBUTED_TO",
  "PROVENANCE_WAS_ASSOCIATED_WITH",
  "PROVENANCE_WAS_REVISION_OF",
  "STAKEHOLDER_AFFECTED_BY_CLAIM",
  "STAKEHOLDER_REPRESENTED_BY_EVIDENCE",
  "RIGHT_OF_REPLY_TARGETS_STAKEHOLDER",
  "RIGHT_OF_REPLY_HAS_RESPONSE_EVIDENCE",
  "FAIRNESS_EXCEPTION_REQUIRES_DISCLOSURE",
  "PREFLIGHT_EVALUATES_PACKET",
  "PREFLIGHT_HAS_CHECK",
  "PREFLIGHT_CHECK_TARGETS_CLAIM",
  "PREFLIGHT_CHECK_TARGETS_EVIDENCE",
  "PREFLIGHT_CHECK_REQUIRES_DISCLOSURE",
  "PREFLIGHT_CHECK_REQUIRES_SPECIALIST",
  "ATTESTATION_EVALUATES_PACKET",
  "ATTESTATION_HAS_CHECK",
  "ATTESTATION_CHECK_TARGETS_CLAIM",
  "ATTESTATION_CHECK_TARGETS_EVIDENCE",
  "ATTESTATION_CHECK_REQUIRES_DISCLOSURE",
  "ATTESTATION_CHECK_REQUIRES_SPECIALIST",
  "SHADOW_RUN_EVALUATES_PACKET",
  "SHADOW_RUN_HAS_CHECK",
  "SHADOW_CHECK_TARGETS_CLAIM",
  "SHADOW_CHECK_TARGETS_EVIDENCE",
  "SHADOW_CHECK_TARGETS_OBJECT_REF",
  "SHADOW_CHECK_REQUIRES_DISCLOSURE",
  "SHADOW_CHECK_REQUIRES_SPECIALIST",
  "SHADOW_CHECK_FLAGS_ADVISORY_DEFECT",
  "SHADOW_ASSIGNMENT_TARGETS_PACKET",
  "SHADOW_ASSIGNMENT_TARGETS_LANE",
  "SHADOW_ASSIGNMENT_BOUND_TO_PACKET",
  "SHADOW_SUBMISSION_SATISFIES_ASSIGNMENT",
  "SHADOW_SUBMISSION_BOUND_TO_ASSIGNMENT",
  "SHADOW_SUBMISSION_EVALUATES_PACKET",
  "SHADOW_SUBMISSION_HAS_CHECK",
  "SPECIALIST_REQUIREMENT_TRIGGERED_BY_CLAIM",
  "SPECIALIST_REQUIREMENT_TRIGGERED_BY_EVIDENCE",
  "SPECIALIST_ASSIGNMENT_SATISFIES_REQUIREMENT",
  "SPECIALIST_REVIEW_SATISFIES_REQUIREMENT",
  "SPECIALIST_EVENT_UPDATES_ASSIGNMENT",
  "SPECIALIST_PROVIDER_OUTAGE_AFFECTS_ASSIGNMENT",
  "DISCLOSURE_RECEIPT_RENDERS_DISCLOSURE",
  "DISCLOSURE_RECEIPT_BOUND_TO_PACKET",
  "CONSENSUS_EVALUATES_PACKET",
  "CONSENSUS_DEPENDS_ON_PREFLIGHT",
  "CONSENSUS_DEPENDS_ON_ATTESTATION",
  "CONSENSUS_DEPENDS_ON_SPECIALIST_REVIEW",
  "CONSENSUS_DEPENDS_ON_DISCLOSURE_RECEIPT",
  "CONSENSUS_DEPENDS_ON_SAFETY_GATE",
  "CONSENSUS_BLOCKED_BY_REASON",
  "PUBLIC_TRUST_RECEIPT_SUMMARIZES_PACKET",
  "PUBLIC_TRUST_RECEIPT_SUMMARIZES_CLAIMS",
  "PUBLIC_TRUST_RECEIPT_SUMMARIZES_PROVENANCE",
  "PUBLIC_TRUST_RECEIPT_SUMMARIZES_FAIRNESS",
  "PUBLIC_TRUST_RECEIPT_SUMMARIZES_CONSENSUS",
  "PUBLIC_TRUST_RECEIPT_SUMMARIZES_LIFECYCLE",
  "PUBLISH_READINESS_HAS_BLOCKER",
  "PUBLISH_READINESS_REFERENCES_CONSENSUS",
  "SEALED_EVIDENCE_REF_BOUND_TO_PACKET",
  "SEALED_ACCESS_AUDIT_BOUND_TO_SEALED_REF",
  "SEALED_PAYLOAD_AUDIT_BOUND_TO_SEALED_REF",
  "OBJECTION_CHALLENGES_PACKET",
  "OBJECTION_CHALLENGES_CLAIM",
  "COMMENT_TARGETS_CLAIM",
  "FLAG_TARGETS_CLAIM",
  "REVISION_SUPERSEDES_REVISION",
  "CORRECTION_SUPERSEDES_CLAIM",
  "TRANSLATION_DERIVED_FROM_PACKET",
  "STORY_DUPLICATES_STORY",
  "CLAIM_SEMANTICALLY_DUPLICATES_CLAIM",
  "CLAIM_POTENTIALLY_CONTRADICTS_CLAIM",
  "STORY_OVERLAPS_STORY"
] as const;

export const GATE_ONE_PROOF_RELATION_SOURCES = [
  "PACKET",
  "PREFLIGHT_RUN",
  "LANE_ATTESTATION",
  "SHADOW_LANE_RUN",
  "SHADOW_REVIEW_ASSIGNMENT",
  "SHADOW_REVIEW_SUBMISSION",
  "SPECIALIST_REQUIREMENT",
  "SPECIALIST_REVIEW",
  "SPECIALIST_ASSIGNMENT",
  "SPECIALIST_ASSIGNMENT_EVENT",
  "SPECIALIST_PROVIDER_OUTAGE",
  "DISCLOSURE_REQUIREMENT",
  "DISCLOSURE_RECEIPT",
  "CONSENSUS_EVALUATION",
  "PUBLIC_TRUST_RECEIPT",
  "SAFETY_GATE_HANDOFF",
  "PUBLISH_READINESS",
  "LEGAL_HOLD",
  "SEALED_EVIDENCE_ACCESS_AUDIT",
  "SEALED_EVIDENCE_PAYLOAD_AUDIT",
  "LIFECYCLE",
  "REVISION",
  "CORRECTION",
  "OBJECTION",
  "COMMENT",
  "FLAG",
  "SEMANTIC_FRAME_SHADOW",
  "SEMANTIC_FRAME"
] as const;

export const GATE_ONE_PROOF_RELATION_VISIBILITY = ["PUBLIC", "PUBLIC_REDACTED", "INTERNAL", "SEALED"] as const;

export const GateOneProofNodeKindSchema = z.enum(GATE_ONE_PROOF_NODE_KINDS);
export const GateOneProofRelationKindSchema = z.enum(GATE_ONE_PROOF_RELATION_KINDS);
export const GateOneProofRelationSourceSchema = z.enum(GATE_ONE_PROOF_RELATION_SOURCES);
export const GateOneProofRelationVisibilitySchema = z.enum(GATE_ONE_PROOF_RELATION_VISIBILITY);
export const GateOneProofGraphModeSchema = z.string().min(1);
export const GateOneProofGraphPublicationEffectSchema = z.string().min(1);

export type GateOneProofNodeKind = z.infer<typeof GateOneProofNodeKindSchema>;
export type GateOneProofRelationKind = z.infer<typeof GateOneProofRelationKindSchema>;
export type GateOneProofRelationSource = z.infer<typeof GateOneProofRelationSourceSchema>;
export type GateOneProofRelationVisibility = z.infer<typeof GateOneProofRelationVisibilitySchema>;

export const GateOneProofAllowedPairSchema = z
  .object({
    fromKind: GateOneProofNodeKindSchema,
    relation: GateOneProofRelationKindSchema,
    toKind: GateOneProofNodeKindSchema,
    publicDefault: z.boolean().default(true),
    sealedDefault: z.boolean().default(false)
  })
  .strict();
export type GateOneProofAllowedPair = z.infer<typeof GateOneProofAllowedPairSchema>;

export const GateOneProofRelationInputSchema = z
  .object({
    ontologyVersion: z.literal(GATE_ONE_PROOF_GRAPH_ONTOLOGY_VERSION),
    storyId: z.string().min(1),
    packetId: z.string().min(1).optional(),
    packetHash: z.string().min(1).optional(),
    relationSource: GateOneProofRelationSourceSchema,
    sourceRecordId: z.string().min(1).optional(),
    sourceDigest: z.string().min(1).optional(),
    fromKind: GateOneProofNodeKindSchema,
    fromId: z.string().min(1),
    relation: GateOneProofRelationKindSchema,
    toKind: GateOneProofNodeKindSchema,
    toId: z.string().min(1),
    mode: GateOneProofGraphModeSchema.optional(),
    publicationEffect: GateOneProofGraphPublicationEffectSchema.optional(),
    policyVersion: z.string().min(1).optional(),
    policyDigest: z.string().min(1).optional(),
    rubricVersion: z.string().min(1).optional(),
    checkId: z.string().min(1).optional(),
    verdict: z.string().min(1).optional(),
    deterministicInputHash: z.string().min(1).optional(),
    visibility: GateOneProofRelationVisibilitySchema.default("PUBLIC"),
    sealedRefHash: z.string().min(1).optional(),
    confidence: z.number().min(0).max(1).optional(),
    strength: z.string().min(1).optional(),
    polarity: z.string().min(1).optional(),
    metadata: z.record(z.unknown()).optional()
  })
  .strict()
  .superRefine((relation, ctx) => {
    if (relation.visibility === "SEALED" && !relation.sealedRefHash) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sealedRefHash"],
        message: "sealed proof graph relations must carry a hashed sealed reference"
      });
    }
    if (relation.visibility === "PUBLIC" && relation.sealedRefHash) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sealedRefHash"],
        message: "public proof graph relations must not carry sealed reference hashes"
      });
    }
  });
export type GateOneProofRelationInput = z.infer<typeof GateOneProofRelationInputSchema>;

export const GateOnePublicProofNodeSchema = z
  .object({
    kind: GateOneProofNodeKindSchema,
    id: z.string().min(1),
    label: z.string().min(1).optional(),
    publicSummary: z.string().min(1).optional(),
    metadata: z.record(z.unknown()).optional()
  })
  .strict();
export type GateOnePublicProofNode = z.infer<typeof GateOnePublicProofNodeSchema>;

export const GateOnePublicProofRelationSchema = z
  .object({
    fromKind: GateOneProofNodeKindSchema,
    fromId: z.string().min(1),
    relation: GateOneProofRelationKindSchema,
    toKind: GateOneProofNodeKindSchema,
    toId: z.string().min(1),
    relationSource: GateOneProofRelationSourceSchema,
    mode: z.string().optional(),
    publicationEffect: z.string().optional(),
    checkId: z.string().optional(),
    verdict: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    publicRationale: z.string().optional(),
    metadata: z.record(z.unknown()).optional()
  })
  .strict();
export type GateOnePublicProofRelation = z.infer<typeof GateOnePublicProofRelationSchema>;

export const GateOnePublicProofGraphOmittedSchema = z
  .object({
    sealedRelationCount: z.number().int().nonnegative(),
    privateRelationCount: z.number().int().nonnegative(),
    rawTraceRelationCount: z.number().int().nonnegative(),
    reviewerSecretRelationCount: z.number().int().nonnegative(),
    truncatedPublicRelationCount: z.number().int().nonnegative().default(0)
  })
  .strict();
export type GateOnePublicProofGraphOmitted = z.infer<typeof GateOnePublicProofGraphOmittedSchema>;

export const GateOnePublicProofGraphSchema = z
  .object({
    schemaVersion: z.literal(GATE_ONE_PROOF_GRAPH_SCHEMA_VERSION),
    ontologyVersion: z.literal(GATE_ONE_PROOF_GRAPH_ONTOLOGY_VERSION),
    storyId: z.string().min(1),
    packetId: z.string().min(1).optional(),
    packetHash: z.string().min(1),
    generatedAt: z.string().datetime(),
    redactionVersion: z.literal(GATE_ONE_PROOF_GRAPH_PUBLIC_REDACTION_VERSION),
    graphHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
    publicRelationLimit: z.number().int().positive(),
    nextCursor: z.string().min(1).optional(),
    nodes: z.array(GateOnePublicProofNodeSchema),
    relations: z.array(GateOnePublicProofRelationSchema),
    omitted: GateOnePublicProofGraphOmittedSchema
  })
  .strict();
export type GateOnePublicProofGraph = z.infer<typeof GateOnePublicProofGraphSchema>;

export const GateOnePublicProofGraphReceiptSchema = GateOnePublicProofGraphSchema;
export type GateOnePublicProofGraphReceipt = GateOnePublicProofGraph;

export const GATE_ONE_CLAIM_SEMANTIC_FRAME_VERSION = "gate-one-claim-semantic-frame-v1" as const;
export const GATE_ONE_CLAIM_SEMANTIC_FRAME_EXTRACTION_METHOD = "candidate-packet-v2-claim-fields-v1" as const;

export const GateOneClaimSemanticFrameReviewStatusSchema = z.enum(["SHADOW", "REVIEWED", "INVALIDATED"]);
export type GateOneClaimSemanticFrameReviewStatus = z.infer<typeof GateOneClaimSemanticFrameReviewStatusSchema>;

export const GateOneClaimSemanticFrameSchema = z
  .object({
    frameVersion: z.literal(GATE_ONE_CLAIM_SEMANTIC_FRAME_VERSION),
    storyId: z.string().min(1),
    packetId: z.string().min(1).optional(),
    packetHash: z.string().min(1),
    claimId: z.string().min(1),
    subjectRef: z.string().min(1).optional(),
    subjectText: z.string().min(1).max(1000),
    predicate: z.string().min(1).max(160),
    objectText: z.string().min(1).max(4000).optional(),
    objectNumber: z.number().optional(),
    objectUnit: z.string().min(1).max(80).optional(),
    objectDate: z.string().datetime().optional(),
    temporalStart: z.string().datetime().optional(),
    temporalEnd: z.string().datetime().optional(),
    qualifier: z.record(z.unknown()).optional(),
    extractionMethod: z.literal(GATE_ONE_CLAIM_SEMANTIC_FRAME_EXTRACTION_METHOD),
    extractionConfidence: z.number().min(0).max(1).optional(),
    reviewStatus: GateOneClaimSemanticFrameReviewStatusSchema.default("SHADOW")
  })
  .strict();
export type GateOneClaimSemanticFrame = z.infer<typeof GateOneClaimSemanticFrameSchema>;

export const GateOneSemanticFrameCandidateRelationSchema = z
  .object({
    storyId: z.string().min(1),
    packetId: z.string().min(1).optional(),
    packetHash: z.string().min(1),
    fromClaimId: z.string().min(1),
    relation: z.enum([
      "CLAIM_SEMANTICALLY_DUPLICATES_CLAIM",
      "CLAIM_POTENTIALLY_CONTRADICTS_CLAIM",
      "STORY_OVERLAPS_STORY"
    ]),
    toClaimId: z.string().min(1).optional(),
    toStoryId: z.string().min(1).optional(),
    confidence: z.number().min(0).max(1),
    reasonCode: z.string().min(1).max(120),
    reviewStatus: z.literal("SHADOW")
  })
  .strict();
export type GateOneSemanticFrameCandidateRelation = z.infer<typeof GateOneSemanticFrameCandidateRelationSchema>;

export const GateOneProofGraphVocabularySchema = z
  .object({
    ontologyVersion: z.literal(GATE_ONE_PROOF_GRAPH_ONTOLOGY_VERSION),
    schemaVersion: z.literal(GATE_ONE_PROOF_GRAPH_SCHEMA_VERSION),
    nodeKinds: z.array(GateOneProofNodeKindSchema),
    relationKinds: z.array(GateOneProofRelationKindSchema),
    relationSources: z.array(GateOneProofRelationSourceSchema),
    visibility: z.array(GateOneProofRelationVisibilitySchema),
    allowedPairs: z.array(GateOneProofAllowedPairSchema),
    publicExposureRules: z.array(z.record(z.unknown())),
    sealedExposureRules: z.array(z.record(z.unknown())),
    publicCoverage: z.array(
      z
        .object({
          area: z.string().min(1),
          classification: z.enum([
            "projected_publicly",
            "projected_redacted_internal",
            "shadow_only",
            "rebuilt_through_parent_packet_job",
            "intentionally_outside_v1",
            "future_non_authoritative"
          ]),
          boundary: z.string().min(1)
        })
        .strict()
    ),
    versioningRules: z
      .object({
        breakingChangeRequiresVersionBump: z.literal(true),
        unknownRelationFailsValidation: z.literal(true),
        unknownNodeKindFailsValidation: z.literal(true)
      })
      .strict()
  })
  .strict();
export type GateOneProofGraphVocabulary = z.infer<typeof GateOneProofGraphVocabularySchema>;

export function gateOneProofRelationExposure(input: Pick<GateOneProofRelationInput, "visibility">): {
  public: boolean;
  sealed: boolean;
} {
  switch (input.visibility) {
    case "PUBLIC":
      return { public: true, sealed: false };
    case "PUBLIC_REDACTED":
      return { public: true, sealed: true };
    case "INTERNAL":
      return { public: false, sealed: false };
    case "SEALED":
      return { public: false, sealed: true };
    default: {
      const exhaustive: never = input.visibility;
      return exhaustive;
    }
  }
}

function relationSortKey(relation: GateOneProofRelationInput | GateOnePublicProofRelation): string {
  return stableGateOneStringify(removeUndefinedFields(relation));
}

export function sortGateOneProofRelations<T extends GateOneProofRelationInput | GateOnePublicProofRelation>(
  relations: readonly T[]
): T[] {
  return [...relations].sort((left, right) => relationSortKey(left).localeCompare(relationSortKey(right)));
}

export function canonicalizeGateOneProofRelations(relations: readonly GateOneProofRelationInput[]): string {
  return stableGateOneStringify(sortGateOneProofRelations(relations));
}

export function gateOneProofRelationInputDigest(relation: GateOneProofRelationInput): `sha256:${string}` {
  return stableGateOneDigest(removeUndefinedFields({
    ontologyVersion: relation.ontologyVersion,
    storyId: relation.storyId,
    packetId: relation.packetId,
    packetHash: relation.packetHash,
    relationSource: relation.relationSource,
    sourceRecordId: relation.sourceRecordId,
    sourceDigest: relation.sourceDigest,
    fromKind: relation.fromKind,
    fromId: relation.fromId,
    relation: relation.relation,
    toKind: relation.toKind,
    toId: relation.toId,
    mode: relation.mode,
    publicationEffect: relation.publicationEffect,
    policyVersion: relation.policyVersion,
    policyDigest: relation.policyDigest,
    rubricVersion: relation.rubricVersion,
    checkId: relation.checkId,
    verdict: relation.verdict,
    visibility: relation.visibility,
    sealedRefHash: relation.sealedRefHash,
    confidence: relation.confidence,
    strength: relation.strength,
    polarity: relation.polarity,
    metadata: relation.metadata
  }));
}

export function gateOneProofRelationIdentityDigest(relation: Pick<
  GateOneProofRelationInput,
  | "ontologyVersion"
  | "packetHash"
  | "relationSource"
  | "sourceRecordId"
  | "fromKind"
  | "fromId"
  | "relation"
  | "toKind"
  | "toId"
  | "deterministicInputHash"
>): `sha256:${string}` {
  return stableGateOneDigest({
    ontologyVersion: relation.ontologyVersion,
    packetHash: relation.packetHash ?? "",
    relationSource: relation.relationSource,
    sourceRecordId: relation.sourceRecordId ?? "",
    fromKind: relation.fromKind,
    fromId: relation.fromId,
    relation: relation.relation,
    toKind: relation.toKind,
    toId: relation.toId,
    deterministicInputHash: relation.deterministicInputHash ?? ""
  });
}

export function assertGateOneProofRelationAllowedPair(
  relation: Pick<GateOneProofRelationInput, "fromKind" | "relation" | "toKind">,
  allowedPairs: readonly GateOneProofAllowedPair[]
): void {
  const allowed = allowedPairs.some((pair) =>
    pair.fromKind === relation.fromKind &&
    pair.relation === relation.relation &&
    pair.toKind === relation.toKind
  );
  if (!allowed) {
    throw new Error(`Gate One Proof Graph relation ${relation.fromKind}:${relation.relation}:${relation.toKind} is not an allowed ontology pair`);
  }
}

function removeUndefinedFields<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, next]) => next !== undefined));
}

export function canonicalizeGateOnePublicProofGraph(
  graph: Omit<GateOnePublicProofGraph, "graphHash">
): string {
  const stableGraph: Omit<GateOnePublicProofGraph, "generatedAt" | "graphHash"> = {
    schemaVersion: graph.schemaVersion,
    ontologyVersion: graph.ontologyVersion,
    storyId: graph.storyId,
    ...(graph.packetId ? { packetId: graph.packetId } : {}),
    packetHash: graph.packetHash,
    redactionVersion: graph.redactionVersion,
    publicRelationLimit: graph.publicRelationLimit,
    ...(graph.nextCursor ? { nextCursor: graph.nextCursor } : {}),
    nodes: graph.nodes,
    relations: graph.relations,
    omitted: graph.omitted
  };
  return stableGateOneStringify({
    ...removeUndefinedFields(stableGraph),
    nodes: [...graph.nodes].sort((left, right) =>
      stableGateOneStringify({ kind: left.kind, id: left.id }).localeCompare(
        stableGateOneStringify({ kind: right.kind, id: right.id })
      )
    ),
    relations: sortGateOneProofRelations(graph.relations)
  });
}

export function computeGateOnePublicProofGraphHash(graph: Omit<GateOnePublicProofGraph, "graphHash">): `sha256:${string}` {
  return stableGateOneDigest(JSON.parse(canonicalizeGateOnePublicProofGraph(graph)));
}
