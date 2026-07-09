import { z } from "zod";
import { GateOneSpecialistTypeSchema } from "./policy.schema.js";

export const GateOneSpecialistRequirementSourceSchema = z.enum([
  "RIGHTS_ROUTING",
  "PROFILE_RULE",
  "LANE_FINDING",
  "MEDIA_TRIGGER",
  "DOMAIN_TRIGGER",
  "ADMIN_HOLD"
]);
export type GateOneSpecialistRequirementSource = z.infer<typeof GateOneSpecialistRequirementSourceSchema>;

export const GateOneSpecialistRequirementSchema = z
  .object({
    id: z.string().min(1).max(160),
    type: GateOneSpecialistTypeSchema,
    source: GateOneSpecialistRequirementSourceSchema,
    triggerRuleCodes: z.array(z.string().min(1).max(160)).min(1),
    claimIds: z.array(z.string().min(1).max(160)).default([]),
    evidenceIds: z.array(z.string().min(1).max(160)).default([]),
    required: z.literal(true),
    minimumSigners: z.number().int().positive(),
    independenceClass: z.string().min(1).max(160),
    expiresAt: z.string().datetime().optional(),
    publicReason: z.string().min(1).max(2000),
    sealedReasonRef: z.string().min(1).max(240).optional()
  })
  .strict();
export type GateOneSpecialistRequirement = z.infer<typeof GateOneSpecialistRequirementSchema>;
