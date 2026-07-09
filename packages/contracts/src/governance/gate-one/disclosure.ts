import { z } from "zod";

export const GateOneDisclosureTypeSchema = z.enum([
  "AI_ASSISTED_PRODUCTION",
  "MACHINE_TRANSLATION",
  "ORIGINAL_LANGUAGE_LIMITATION",
  "SPONSORSHIP_OR_COMMERCIAL_RELATIONSHIP",
  "OWNERSHIP_OR_REVIEWER_CONFLICT",
  "ANONYMOUS_SOURCE_BASIS",
  "UNVERIFIED_OR_DEVELOPING_EVIDENCE",
  "SYNTHETIC_OR_ALTERED_MEDIA",
  "RIGHT_OF_REPLY_PENDING",
  "SINGLE_STREAM_BREAKING_EVIDENCE",
  "METHODOLOGY_OR_STATISTICAL_LIMITATION"
]);
export type GateOneDisclosureType = z.infer<typeof GateOneDisclosureTypeSchema>;

export const GateOneDisclosureDeclarationSchema = z
  .object({
    id: z.string().min(1).max(160),
    type: GateOneDisclosureTypeSchema,
    public: z.boolean().default(true),
    text: z.string().min(1).max(2000),
    claimIds: z.array(z.string().min(1).max(160)).default([]),
    evidenceIds: z.array(z.string().min(1).max(160)).default([]),
    sourceRuleCodes: z.array(z.string().min(1).max(160)).default([]),
    sealedParametersRef: z.string().min(1).max(240).optional()
  })
  .strict();
export type GateOneDisclosureDeclaration = z.infer<typeof GateOneDisclosureDeclarationSchema>;

export const GateOneDisclosureRequirementSchema = z
  .object({
    id: z.string().min(1).max(160),
    type: GateOneDisclosureTypeSchema,
    textTemplateKey: z.string().min(1).max(160),
    parameters: z.record(z.union([z.string(), z.number().finite(), z.boolean(), z.null()])).default({}),
    sourceRuleCodes: z.array(z.string().min(1).max(160)).min(1),
    public: z.boolean().default(true)
  })
  .strict();
export type GateOneDisclosureRequirement = z.infer<typeof GateOneDisclosureRequirementSchema>;

export const GateOneDisclosureRenderReceiptSchema = z
  .object({
    id: z.string().min(1).max(160),
    requirementId: z.string().min(1).max(160),
    storyId: z.string().min(1).max(160),
    packetHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
    renderedArtifactHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
    renderTarget: z.string().min(1).max(160),
    renderedTextHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
    rendererVersion: z.string().min(1).max(80),
    verifiedAt: z.string().datetime()
  })
  .strict();
export type GateOneDisclosureRenderReceipt = z.infer<typeof GateOneDisclosureRenderReceiptSchema>;
