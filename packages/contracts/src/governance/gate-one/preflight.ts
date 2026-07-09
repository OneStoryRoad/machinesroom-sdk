import { z } from "zod";
import { GateOneDisclosureRequirementSchema } from "./disclosure.js";
import { GateOnePreflightContractSchema } from "./policy.schema.js";
import { GateOneSpecialistRequirementSchema } from "./specialist.js";

export const GateOneSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type GateOneSeverity = z.infer<typeof GateOneSeveritySchema>;

export const GateOneCheckStatusSchema = z.enum(["PASS", "WARNING", "FAIL"]);
export type GateOneCheckStatus = z.infer<typeof GateOneCheckStatusSchema>;

export const GateOnePreflightVerdictSchema = z.enum(["PASS", "PASS_WITH_REQUIREMENTS", "FAIL"]);
export type GateOnePreflightVerdict = z.infer<typeof GateOnePreflightVerdictSchema>;

export const GateOnePreflightCheckResultSchema = z
  .object({
    checkId: z.string().min(1).max(160),
    status: GateOneCheckStatusSchema,
    severity: GateOneSeveritySchema,
    objectRefs: z.array(z.string().min(1).max(240)).default([]),
    publicMessage: z.string().min(1).max(2000),
    internalMessage: z.string().min(1).max(4000).optional(),
    requiredAction: z.string().min(1).max(2000).optional()
  })
  .strict();
export type GateOnePreflightCheckResult = z.infer<typeof GateOnePreflightCheckResultSchema>;

export const GateOnePreflightResultSchema = z
  .object({
    id: z.string().min(1).max(160),
    storyId: z.string().min(1).max(160),
    packetHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
    contractId: GateOnePreflightContractSchema,
    contractVersion: z.string().min(1).max(80),
    policyVersion: z.string().min(1).max(80),
    verdict: GateOnePreflightVerdictSchema,
    checks: z.array(GateOnePreflightCheckResultSchema).min(1),
    requiredSpecialists: z.array(GateOneSpecialistRequirementSchema).default([]),
    requiredDisclosures: z.array(GateOneDisclosureRequirementSchema).default([]),
    deterministicInputHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime(),
    implementationVersion: z.string().min(1).max(120)
  })
  .strict()
  .superRefine((result, ctx) => {
    const hasFailingCheck = result.checks.some((check) => check.status === "FAIL");
    if ((result.verdict === "PASS" || result.verdict === "PASS_WITH_REQUIREMENTS") && hasFailingCheck) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["verdict"],
        message: `${result.verdict} preflight cannot include failing checks`
      });
    }
    if (result.verdict === "PASS_WITH_REQUIREMENTS" && result.requiredDisclosures.length === 0 && result.requiredSpecialists.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["verdict"],
        message: "PASS_WITH_REQUIREMENTS must include a disclosure or specialist requirement"
      });
    }
  });
export type GateOnePreflightResult = z.infer<typeof GateOnePreflightResultSchema>;
