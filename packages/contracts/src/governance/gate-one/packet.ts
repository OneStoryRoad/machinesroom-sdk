import { z } from "zod";
import { stableGateOneDigest, stableGateOneStringify } from "./canonical-json.js";
import { GateOneDisclosureDeclarationSchema } from "./disclosure.js";
import { GateOneStoryProfileSchema } from "./policy.schema.js";

const PacketHashSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const StableIdSchema = z.string().min(1).max(160).regex(/^[A-Za-z0-9:_-]+$/);
const IsoDateTimeSchema = z.string().datetime();

export const GateOneArticleTypeSchema = z.enum(["news", "analysis", "opinion", "explainer", "live", "sponsored", "developing"]);
export type GateOneArticleType = z.infer<typeof GateOneArticleTypeSchema>;

export const GateOneReportingOriginSchema = z.enum(["ORIGINAL_REPORTING", "WIRE_OR_SYNDICATED", "AGGREGATED", "PARTNER", "UNKNOWN"]);
export type GateOneReportingOrigin = z.infer<typeof GateOneReportingOriginSchema>;

export const GateOneClaimTypeSchema = z.enum([
  "FACTUAL",
  "QUANTITATIVE",
  "CAUSAL",
  "PREDICTIVE",
  "ATTRIBUTED",
  "INTERPRETIVE",
  "PROCEDURAL",
  "OPINION"
]);
export const GateOneClaimMaterialitySchema = z.enum(["NON_MATERIAL", "MATERIAL", "CRITICAL"]);
export const GateOneEpistemicStatusSchema = z.enum(["VERIFIED", "WELL_SUPPORTED", "PROVISIONAL", "DISPUTED", "UNKNOWN", "RETRACTED"]);

export const GateOneArticleBlockSchema = z
  .object({
    id: StableIdSchema,
    type: z.enum(["heading", "paragraph", "quote", "image", "video", "audio", "table", "list", "embed", "disclosure"]),
    text: z.string().max(20000).optional(),
    claimIds: z.array(StableIdSchema).default([]),
    evidenceIds: z.array(StableIdSchema).default([]),
    mediaIds: z.array(StableIdSchema).default([])
  })
  .strict();
export type GateOneArticleBlock = z.infer<typeof GateOneArticleBlockSchema>;

export const GateOneArticleDocumentSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    blocks: z.array(GateOneArticleBlockSchema).min(1)
  })
  .strict();
export type GateOneArticleDocument = z.infer<typeof GateOneArticleDocumentSchema>;

export const GateOneClaimV2Schema = z
  .object({
    id: StableIdSchema,
    version: z.number().int().positive().default(1),
    key: z.string().min(1).max(160).optional(),
    text: z.string().min(1).max(4000),
    type: GateOneClaimTypeSchema,
    materiality: GateOneClaimMaterialitySchema,
    epistemicStatus: GateOneEpistemicStatusSchema,
    confidenceLanguage: z.string().min(1).max(240),
    evidenceIds: z.array(StableIdSchema).default([]),
    counterevidenceIds: z.array(StableIdSchema).default([]),
    subjectIds: z.array(StableIdSchema).default([]),
    validFrom: IsoDateTimeSchema.optional(),
    validUntil: IsoDateTimeSchema.optional(),
    publicNotes: z.string().max(2000).optional(),
    sealedNotesRef: z.string().min(1).max(240).optional()
  })
  .strict();
export type GateOneClaimV2 = z.infer<typeof GateOneClaimV2Schema>;

export const GateOneSourceV2Schema = z
  .object({
    id: StableIdSchema,
    version: z.number().int().positive().default(1),
    sourceClass: z.enum([
      "PRIMARY",
      "FIRST_PARTY",
      "OFFICIAL",
      "LOCAL_REPORTING",
      "EYEWITNESS",
      "EXPERT",
      "DATASET",
      "WIRE",
      "SECONDARY_REPORTING",
      "ADVOCACY",
      "SOCIAL_MEDIA",
      "ANONYMOUS",
      "SYNTHETIC_AUTOMATED",
      "OTHER"
    ]),
    controller: z.string().min(1).max(240).optional(),
    originClusterId: StableIdSchema,
    locality: z.string().min(1).max(160).optional(),
    language: z.string().min(2).max(35),
    directness: z.enum(["DIRECT", "INDIRECT", "DERIVATIVE", "UNKNOWN"]),
    independentSourceIds: z.array(StableIdSchema).default([]),
    retrievedAt: IsoDateTimeSchema.optional(),
    publishedAt: IsoDateTimeSchema.optional(),
    archiveStatus: z.enum(["ARCHIVED", "NOT_ARCHIVED", "NOT_APPLICABLE", "UNKNOWN"]).default("UNKNOWN"),
    conflictSummary: z.string().max(1000).optional(),
    anonymousSourceBasis: z.string().max(1000).optional()
  })
  .strict();
export type GateOneSourceV2 = z.infer<typeof GateOneSourceV2Schema>;

export const GateOneEvidenceObjectSchema = z
  .object({
    id: StableIdSchema,
    version: z.number().int().positive(),
    kind: z.enum([
      "DOCUMENT",
      "DATASET",
      "QUOTE",
      "IMAGE",
      "VIDEO",
      "AUDIO",
      "OBSERVATION",
      "CALCULATION",
      "DATABASE_RECORD",
      "EXPERT_STATEMENT"
    ]),
    sourceId: StableIdSchema,
    originClusterId: StableIdSchema,
    uri: z.string().url().optional(),
    archiveUri: z.string().url().optional(),
    contentHash: PacketHashSchema.optional(),
    mimeType: z.string().min(1).max(160).optional(),
    obtainedAt: IsoDateTimeSchema.optional(),
    publishedAt: IsoDateTimeSchema.optional(),
    accessStatus: z.enum(["PUBLIC", "SEALED", "RESTRICTED"]),
    authenticityStatus: z.enum(["VERIFIED", "CREDENTIAL_PRESENT", "CONSISTENT", "UNVERIFIED", "DISPUTED", "ALTERED", "SYNTHETIC"]),
    transformationIds: z.array(StableIdSchema).default([]),
    publicSummary: z.string().min(1).max(2000),
    sealedMetadataRef: z.string().min(1).max(240).optional()
  })
  .strict();
export type GateOneEvidenceObject = z.infer<typeof GateOneEvidenceObjectSchema>;

export const GateOneMediaArtifactSchema = z
  .object({
    id: StableIdSchema,
    evidenceId: StableIdSchema.optional(),
    kind: z.enum(["IMAGE", "VIDEO", "AUDIO", "GRAPHIC", "EMBED"]),
    contentHash: PacketHashSchema.optional(),
    caption: z.string().max(1000).optional(),
    altText: z.string().max(1000).optional(),
    transcriptRef: z.string().min(1).max(240).optional(),
    credentialStatus: z.enum(["PRESENT_VALID", "PRESENT_INVALID", "ABSENT", "NOT_APPLICABLE", "UNKNOWN"]),
    syntheticOrAlteredStatus: z.enum(["NONE_KNOWN", "SYNTHETIC", "ALTERED", "DISPUTED", "UNKNOWN"])
  })
  .strict();
export type GateOneMediaArtifact = z.infer<typeof GateOneMediaArtifactSchema>;

export const GateOneProvenanceGraphSchema = z
  .object({
    version: z.literal("1.0"),
    entities: z.array(z.object({ id: StableIdSchema, type: z.string().min(1).max(120) }).strict()).default([]),
    activities: z.array(z.object({ id: StableIdSchema, type: z.string().min(1).max(120), atTime: IsoDateTimeSchema.optional() }).strict()).default([]),
    agents: z.array(z.object({ id: StableIdSchema, type: z.string().min(1).max(120), publicLabel: z.string().min(1).max(240) }).strict()).default([]),
    edges: z
      .array(
        z
          .object({
            type: z.enum([
              "WAS_DERIVED_FROM",
              "WAS_GENERATED_BY",
              "USED",
              "WAS_ATTRIBUTED_TO",
              "WAS_ASSOCIATED_WITH",
              "WAS_REVISION_OF"
            ]),
            fromId: StableIdSchema,
            toId: StableIdSchema,
            metadata: z.record(z.unknown()).optional()
          })
          .strict()
      )
      .default([])
  })
  .strict();
export type GateOneProvenanceGraph = z.infer<typeof GateOneProvenanceGraphSchema>;

export const GateOneFairnessReportSchema = z
  .object({
    version: z.literal("1.0"),
    affectedStakeholders: z
      .array(
        z
          .object({
            stakeholderId: StableIdSchema,
            role: z.string().min(1).max(160),
            materiality: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
            representedInStory: z.boolean(),
            representationEvidenceIds: z.array(StableIdSchema).default([])
          })
          .strict()
      )
      .default([]),
    rightOfReply: z
      .array(
        z
          .object({
            subjectId: StableIdSchema,
            required: z.boolean(),
            status: z.enum([
              "NOT_REQUIRED",
              "NOT_ATTEMPTED",
              "ATTEMPTED",
              "ACKNOWLEDGED",
              "RESPONDED",
              "DECLINED",
              "NO_RESPONSE",
              "IMPOSSIBLE",
              "PENDING_BREAKING_DISCLOSURE"
            ]),
            attemptedAt: IsoDateTimeSchema.optional(),
            deadlineAt: IsoDateTimeSchema.optional(),
            channelClass: z.string().min(1).max(160).optional(),
            responseEvidenceIds: z.array(StableIdSchema).default([]),
            publicExplanation: z.string().max(1000).optional(),
            sealedContactRef: z.string().min(1).max(240).optional()
          })
          .strict()
      )
      .default([]),
    materialCounterevidenceIds: z.array(StableIdSchema).default([]),
    alternativeExplanations: z
      .array(
        z
          .object({
            id: StableIdSchema,
            summary: z.string().min(1).max(1000),
            evidenceIds: z.array(StableIdSchema).default([]),
            treatment: z.enum(["INCLUDED", "EXCLUDED_WITH_REASON", "UNRESOLVED"]),
            reason: z.string().max(1000).optional()
          })
          .strict()
      )
      .default([]),
    knownUnknowns: z.array(z.string().min(1).max(1000)).default([]),
    uncertaintyTreatment: z.string().min(1).max(2000),
    fairnessExceptions: z
      .array(
        z
          .object({
            ruleCode: z.string().min(1).max(160),
            reason: z.string().min(1).max(1000),
            requiredDisclosure: StableIdSchema.optional()
          })
          .strict()
      )
      .default([])
  })
  .strict();
export type GateOneFairnessReport = z.infer<typeof GateOneFairnessReportSchema>;

export const GateOneLifecycleDeclarationSchema = z
  .object({
    version: z.literal("1.0"),
    currentVersion: z.number().int().positive(),
    parentPacketHash: PacketHashSchema.optional(),
    claimAddressabilityMap: z.record(StableIdSchema),
    correctionTaxonomyVersion: z.string().min(1).max(80),
    propagationTargets: z.array(z.string().min(1).max(160)).min(1),
    challengeRoute: z.string().min(1).max(240),
    expiryPolicy: z.string().min(1).max(240),
    translationDependencies: z.array(StableIdSchema).default([]),
    cacheInvalidationDependencies: z.array(z.string().min(1).max(160)).min(1)
  })
  .strict();
export type GateOneLifecycleDeclaration = z.infer<typeof GateOneLifecycleDeclarationSchema>;

export const GateOnePublicPacketEnvelopeSchema = z
  .object({
    claimIds: z.array(StableIdSchema).default([]),
    evidenceIds: z.array(StableIdSchema).default([]),
    disclosureIds: z.array(StableIdSchema).default([]),
    publicSummary: z.string().min(1).max(4000),
    redactionVersion: z.string().min(1).max(80)
  })
  .strict();
export type GateOnePublicPacketEnvelope = z.infer<typeof GateOnePublicPacketEnvelopeSchema>;

export const GateOneSealedEnvelopeRefSchema = z
  .object({
    ref: z.string().min(1).max(240),
    encryptionKeyRef: z.string().min(1).max(240),
    accessPolicyRef: z.string().min(1).max(240)
  })
  .strict();
export type GateOneSealedEnvelopeRef = z.infer<typeof GateOneSealedEnvelopeRefSchema>;

export const GateOneCandidatePacketV2Schema = z
  .object({
    schemaVersion: z.literal("2.0"),
    packetId: StableIdSchema,
    storyId: StableIdSchema,
    packetHash: PacketHashSchema,
    parentPacketHash: PacketHashSchema.optional(),
    createdAt: IsoDateTimeSchema,
    createdByBotId: StableIdSchema,
    policyProfile: GateOneStoryProfileSchema,
    policyVersion: z.string().min(1).max(80),
    highRiskFlags: z.array(z.string().min(1).max(160)).default([]),
    room: z.string().min(1).max(160),
    articleType: GateOneArticleTypeSchema,
    language: z.string().min(2).max(35),
    canonicalLanguage: z.string().min(2).max(35),
    reportingOrigin: GateOneReportingOriginSchema,
    title: z.string().min(1).max(500),
    dek: z.string().max(1000).optional(),
    summary: z.array(z.string().min(1).max(1000)).min(1),
    article: GateOneArticleDocumentSchema,
    claims: z.array(GateOneClaimV2Schema).min(1),
    sources: z.array(GateOneSourceV2Schema).min(1),
    evidence: z.array(GateOneEvidenceObjectSchema).min(1),
    media: z.array(GateOneMediaArtifactSchema).default([]),
    provenanceGraph: GateOneProvenanceGraphSchema,
    fairnessReport: GateOneFairnessReportSchema,
    disclosures: z.array(GateOneDisclosureDeclarationSchema).default([]),
    methods: z
      .object({
        version: z.literal("1.0"),
        byline: z.string().min(1).max(240),
        methodSummary: z.string().min(1).max(2000),
        aiAssistance: z.boolean(),
        reviewedLanguages: z.array(z.string().min(2).max(35)).min(1)
      })
      .strict(),
    translations: z
      .array(
        z
          .object({
            language: z.string().min(2).max(35),
            packetHash: PacketHashSchema.optional(),
            status: z.enum(["NOT_REQUESTED", "PENDING", "CURRENT", "STALE"])
          })
          .strict()
      )
      .default([]),
    lifecycle: GateOneLifecycleDeclarationSchema,
    publicEnvelope: GateOnePublicPacketEnvelopeSchema,
    sealedEnvelopeRef: GateOneSealedEnvelopeRefSchema.optional()
  })
  .strict()
  .superRefine((packet, ctx) => {
    assertUnique(ctx, ["claims"], packet.claims.map((claim) => claim.id));
    assertUnique(ctx, ["sources"], packet.sources.map((source) => source.id));
    assertUnique(ctx, ["evidence"], packet.evidence.map((evidence) => evidence.id));
    assertUnique(ctx, ["media"], packet.media.map((media) => media.id));
    assertUnique(ctx, ["disclosures"], packet.disclosures.map((disclosure) => disclosure.id));
    assertUnique(ctx, ["article", "blocks"], packet.article.blocks.map((block) => block.id));

    const sourceIds = new Set(packet.sources.map((source) => source.id));
    const evidenceIds = new Set(packet.evidence.map((evidence) => evidence.id));
    const evidenceById = new Map(packet.evidence.map((evidence) => [evidence.id, evidence]));
    const mediaIds = new Set(packet.media.map((media) => media.id));
    const claimIds = new Set(packet.claims.map((claim) => claim.id));
    const disclosureIds = new Set(packet.disclosures.map((disclosure) => disclosure.id));
    const disclosureById = new Map(packet.disclosures.map((disclosure) => [disclosure.id, disclosure]));
    const blockIds = new Set(packet.article.blocks.map((block) => block.id));
    const subjectIds = new Set(packet.claims.flatMap((claim) => claim.subjectIds));

    for (const [index, source] of packet.sources.entries()) {
      for (const sourceId of source.independentSourceIds) {
        if (!sourceIds.has(sourceId)) addIssue(ctx, ["sources", index, "independentSourceIds"], `source ${sourceId} is not defined`);
      }
    }

    for (const [index, evidence] of packet.evidence.entries()) {
      if (!sourceIds.has(evidence.sourceId)) {
        addIssue(ctx, ["evidence", index, "sourceId"], `source ${evidence.sourceId} is not defined`);
      }
      if (evidence.accessStatus === "PUBLIC") {
        if (evidence.sealedMetadataRef) {
          addIssue(ctx, ["evidence", index, "sealedMetadataRef"], `PUBLIC evidence ${evidence.id} must not include sealedMetadataRef`);
        }
      } else {
        if (!evidence.sealedMetadataRef) {
          addIssue(ctx, ["evidence", index, "sealedMetadataRef"], `non-public evidence ${evidence.id} must include sealedMetadataRef`);
        }
        if (evidence.uri) {
          addIssue(ctx, ["evidence", index, "uri"], `non-public evidence ${evidence.id} must not include uri`);
        }
        if (evidence.archiveUri) {
          addIssue(ctx, ["evidence", index, "archiveUri"], `non-public evidence ${evidence.id} must not include archiveUri`);
        }
      }
    }

    for (const [index, claim] of packet.claims.entries()) {
      if ((claim.type === "FACTUAL" || claim.type === "QUANTITATIVE" || claim.type === "CAUSAL") && claim.materiality !== "NON_MATERIAL") {
        if (claim.evidenceIds.length === 0) {
          addIssue(ctx, ["claims", index, "evidenceIds"], "material factual claims must reference evidence");
        }
      }
      for (const evidenceId of [...claim.evidenceIds, ...claim.counterevidenceIds]) {
        if (!evidenceIds.has(evidenceId)) addIssue(ctx, ["claims", index, "evidenceIds"], `evidence ${evidenceId} is not defined`);
      }
    }

    for (const [index, block] of packet.article.blocks.entries()) {
      for (const claimId of block.claimIds) {
        if (!claimIds.has(claimId)) addIssue(ctx, ["article", "blocks", index, "claimIds"], `claim ${claimId} is not defined`);
      }
      for (const evidenceId of block.evidenceIds) {
        if (!evidenceIds.has(evidenceId)) addIssue(ctx, ["article", "blocks", index, "evidenceIds"], `evidence ${evidenceId} is not defined`);
      }
      for (const mediaId of block.mediaIds) {
        if (!mediaIds.has(mediaId)) addIssue(ctx, ["article", "blocks", index, "mediaIds"], `media ${mediaId} is not defined`);
      }
    }

    for (const [index, media] of packet.media.entries()) {
      if (media.evidenceId && !evidenceIds.has(media.evidenceId)) {
        addIssue(ctx, ["media", index, "evidenceId"], `evidence ${media.evidenceId} is not defined`);
      }
    }

    const provenanceNodeIds = new Set([
      ...packet.provenanceGraph.entities.map((entity) => entity.id),
      ...packet.provenanceGraph.activities.map((activity) => activity.id),
      ...packet.provenanceGraph.agents.map((agent) => agent.id)
    ]);
    for (const [index, edge] of packet.provenanceGraph.edges.entries()) {
      if (!provenanceNodeIds.has(edge.fromId)) addIssue(ctx, ["provenanceGraph", "edges", index, "fromId"], `provenance node ${edge.fromId} is not defined`);
      if (!provenanceNodeIds.has(edge.toId)) addIssue(ctx, ["provenanceGraph", "edges", index, "toId"], `provenance node ${edge.toId} is not defined`);
    }

    for (const [index, stakeholder] of packet.fairnessReport.affectedStakeholders.entries()) {
      subjectIds.add(stakeholder.stakeholderId);
      for (const evidenceId of stakeholder.representationEvidenceIds) {
        if (!evidenceIds.has(evidenceId)) {
          addIssue(ctx, ["fairnessReport", "affectedStakeholders", index, "representationEvidenceIds"], `evidence ${evidenceId} is not defined`);
        }
      }
    }

    for (const [index, reply] of packet.fairnessReport.rightOfReply.entries()) {
      if (!subjectIds.has(reply.subjectId)) {
        addIssue(ctx, ["fairnessReport", "rightOfReply", index, "subjectId"], `subject ${reply.subjectId} is not defined`);
      }
      for (const evidenceId of reply.responseEvidenceIds) {
        if (!evidenceIds.has(evidenceId)) {
          addIssue(ctx, ["fairnessReport", "rightOfReply", index, "responseEvidenceIds"], `evidence ${evidenceId} is not defined`);
        }
      }
    }

    for (const evidenceId of packet.fairnessReport.materialCounterevidenceIds) {
      if (!evidenceIds.has(evidenceId)) addIssue(ctx, ["fairnessReport", "materialCounterevidenceIds"], `evidence ${evidenceId} is not defined`);
    }

    for (const [index, explanation] of packet.fairnessReport.alternativeExplanations.entries()) {
      for (const evidenceId of explanation.evidenceIds) {
        if (!evidenceIds.has(evidenceId)) {
          addIssue(ctx, ["fairnessReport", "alternativeExplanations", index, "evidenceIds"], `evidence ${evidenceId} is not defined`);
        }
      }
    }

    for (const [index, exception] of packet.fairnessReport.fairnessExceptions.entries()) {
      if (exception.requiredDisclosure && !disclosureIds.has(exception.requiredDisclosure)) {
        addIssue(ctx, ["fairnessReport", "fairnessExceptions", index, "requiredDisclosure"], `disclosure ${exception.requiredDisclosure} is not defined`);
      }
    }

    for (const [claimId, blockId] of Object.entries(packet.lifecycle.claimAddressabilityMap)) {
      if (!claimIds.has(claimId)) addIssue(ctx, ["lifecycle", "claimAddressabilityMap", claimId], `claim ${claimId} is not defined`);
      if (!blockIds.has(blockId)) addIssue(ctx, ["lifecycle", "claimAddressabilityMap", claimId], `block ${blockId} is not defined`);
    }

    for (const disclosureId of packet.publicEnvelope.disclosureIds) {
      if (!disclosureIds.has(disclosureId)) addIssue(ctx, ["publicEnvelope", "disclosureIds"], `disclosure ${disclosureId} is not defined`);
      if (disclosureById.get(disclosureId)?.public === false) {
        addIssue(ctx, ["publicEnvelope", "disclosureIds"], `disclosure ${disclosureId} is not public`);
      }
    }

    for (const claimId of packet.publicEnvelope.claimIds) {
      if (!claimIds.has(claimId)) addIssue(ctx, ["publicEnvelope", "claimIds"], `claim ${claimId} is not defined`);
    }

    for (const evidenceId of packet.publicEnvelope.evidenceIds) {
      const evidence = evidenceById.get(evidenceId);
      if (!evidence) {
        addIssue(ctx, ["publicEnvelope", "evidenceIds"], `evidence ${evidenceId} is not defined`);
        continue;
      }
      if (evidence.accessStatus !== "PUBLIC") {
        addIssue(ctx, ["publicEnvelope", "evidenceIds"], `evidence ${evidenceId} must be PUBLIC to appear in the public envelope`);
      }
    }
  });
export type GateOneCandidatePacketV2 = z.infer<typeof GateOneCandidatePacketV2Schema>;

export function candidatePacketV2HashInput(packet: GateOneCandidatePacketV2): Omit<GateOneCandidatePacketV2, "packetHash"> {
  const { packetHash: _packetHash, ...hashInput } = packet;
  return hashInput;
}

export function canonicalizeCandidatePacketV2(packet: GateOneCandidatePacketV2): string {
  return stableGateOneStringify(candidatePacketV2HashInput(packet));
}

export function computeCandidatePacketV2Hash(packet: GateOneCandidatePacketV2): `sha256:${string}` {
  return stableGateOneDigest(candidatePacketV2HashInput(packet));
}

export function parseCandidatePacketV2(input: unknown): GateOneCandidatePacketV2 {
  return GateOneCandidatePacketV2Schema.parse(input);
}

export function assertCandidatePacketV2Hash(packet: GateOneCandidatePacketV2): GateOneCandidatePacketV2 {
  const computed = computeCandidatePacketV2Hash(packet);
  if (packet.packetHash !== computed) {
    throw new Error(`Candidate Packet V2 hash mismatch: expected ${computed}, received ${packet.packetHash}`);
  }
  return packet;
}

function assertUnique(ctx: z.RefinementCtx, path: Array<string | number>, values: string[]) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      addIssue(ctx, path, `duplicate id ${value}`);
    }
    seen.add(value);
  }
}

function addIssue(ctx: z.RefinementCtx, path: Array<string | number>, message: string) {
  ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
}
