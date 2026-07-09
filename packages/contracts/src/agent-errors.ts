import { z } from "zod";

export const AgentGuidanceErrorClassSchema = z.enum(["server_error", "client_stop", "warning"]);
export type AgentGuidanceErrorClass = z.infer<typeof AgentGuidanceErrorClassSchema>;

export const AgentGuidanceErrorSchema = z
  .object({
    code: z.string().trim().min(1),
    class: AgentGuidanceErrorClassSchema,
    httpStatus: z.number().int().min(100).max(599).optional(),
    retryable: z.boolean(),
    freshNonceRequired: z.boolean(),
    newIdempotencyKeyAllowed: z.boolean(),
    refreshCurrentPacket: z.boolean(),
    safeNextAction: z.string().trim().min(1),
    forbiddenRecovery: z.string().trim().min(1),
    docsPath: z.string().startsWith("/")
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.class === "server_error" && value.httpStatus === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["httpStatus"], message: "server errors require httpStatus" });
    }
    if (value.class !== "server_error" && value.httpStatus !== undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["httpStatus"], message: "only server errors may declare httpStatus" });
    }
  });

export type AgentGuidanceError = z.infer<typeof AgentGuidanceErrorSchema>;

export const AGENT_ERROR_CODES = {
  signedHeadersMissing: "AGENT_SIGNED_HEADERS_MISSING",
  signedHeadersInvalid: "AGENT_SIGNED_HEADERS_INVALID",
  signatureInvalid: "AGENT_SIGNATURE_INVALID",
  timestampDrift: "AGENT_TIMESTAMP_DRIFT_EXCEEDED",
  nonceReplay: "AGENT_NONCE_REPLAY",
  botUnregistered: "AGENT_BOT_UNREGISTERED",
  actionNotAllowed: "AGENT_BOT_ACTION_NOT_ALLOWED",
  currentPacketMismatch: "CURRENT_PACKET_MISMATCH",
  structuredWritesDisabled: "GATE_ONE_V2_STRUCTURED_WRITES_DISABLED",
  laneUnauthorized: "GATE_ONE_V2_LANE_UNAUTHORIZED",
  shadowSubmissionsDisabled: "GATE_ONE_V2_SHADOW_REVIEW_SUBMISSIONS_DISABLED",
  assignmentInvalid: "GATE_ONE_V2_ASSIGNMENT_INVALID",
  agentKitFailed: "AGENTKIT_VERIFICATION_FAILED",
  idempotencyConflict: "IDEMPOTENCY_KEY_CONFLICT"
} as const;

export const AGENT_GUIDANCE_ERRORS = AgentGuidanceErrorSchema.array().parse([
  {
    code: AGENT_ERROR_CODES.signedHeadersMissing,
    class: "server_error",
    httpStatus: 401,
    retryable: true,
    freshNonceRequired: true,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: false,
    safeNextAction: "Add all required signed headers, create a fresh nonce, and sign the exact request.",
    forbiddenRecovery: "Do not send signing material through a browser, prompt, or MCP payload.",
    docsPath: "/docs/api/agent-sdk"
  },
  {
    code: AGENT_ERROR_CODES.signedHeadersInvalid,
    class: "server_error",
    httpStatus: 401,
    retryable: true,
    freshNonceRequired: true,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: false,
    safeNextAction: "Correct the header format, generate a fresh nonce, and re-sign the exact method and path.",
    forbiddenRecovery: "Do not reuse the rejected signature or nonce.",
    docsPath: "/docs/api/agent-sdk"
  },
  {
    code: AGENT_ERROR_CODES.signatureInvalid,
    class: "server_error",
    httpStatus: 401,
    retryable: true,
    freshNonceRequired: true,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: false,
    safeNextAction: "Rebuild canonical JSON and sign the exact method, path, timestamp, and fresh nonce.",
    forbiddenRecovery: "Do not retry a signature created for another route.",
    docsPath: "/docs/api/agent-sdk"
  },
  {
    code: AGENT_ERROR_CODES.timestampDrift,
    class: "server_error",
    httpStatus: 401,
    retryable: true,
    freshNonceRequired: true,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: false,
    safeNextAction: "Synchronize the caller clock and sign again with a fresh timestamp and nonce.",
    forbiddenRecovery: "Do not relax timestamp validation.",
    docsPath: "/docs/api/agent-sdk"
  },
  {
    code: AGENT_ERROR_CODES.nonceReplay,
    class: "server_error",
    httpStatus: 409,
    retryable: true,
    freshNonceRequired: true,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: false,
    safeNextAction: "Inspect the original result, then use a fresh nonce only if the operation did not complete.",
    forbiddenRecovery: "Do not rotate the idempotency key to duplicate a write.",
    docsPath: "/docs/api/agent-sdk"
  },
  {
    code: AGENT_ERROR_CODES.botUnregistered,
    class: "server_error",
    httpStatus: 401,
    retryable: false,
    freshNonceRequired: true,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: false,
    safeNextAction: "Join or ask an operator to register this exact Ed25519 bot identity.",
    forbiddenRecovery: "Do not substitute another bot identity.",
    docsPath: "/agents"
  },
  {
    code: AGENT_ERROR_CODES.actionNotAllowed,
    class: "server_error",
    httpStatus: 401,
    retryable: false,
    freshNonceRequired: true,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: false,
    safeNextAction: "Stop and request the exact action grant.",
    forbiddenRecovery: "Do not probe internal routes or switch actions to bypass provisioning.",
    docsPath: "/agents"
  },
  {
    code: AGENT_ERROR_CODES.currentPacketMismatch,
    class: "server_error",
    httpStatus: 409,
    retryable: true,
    freshNonceRequired: true,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: true,
    safeNextAction: "Read the current packet and rebuild the decision against its exact hash.",
    forbiddenRecovery: "Do not resubmit stale packet material.",
    docsPath: "/agents/gate-one-v2.generated.md"
  },
  {
    code: AGENT_ERROR_CODES.structuredWritesDisabled,
    class: "server_error",
    httpStatus: 503,
    retryable: false,
    freshNonceRequired: true,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: false,
    safeNextAction: "Stop and wait until public capabilities report the V2 branch as available.",
    forbiddenRecovery: "Do not probe internal or MCP write paths.",
    docsPath: "/agents/gate-one-v2.generated.md"
  },
  {
    code: AGENT_ERROR_CODES.laneUnauthorized,
    class: "server_error",
    httpStatus: 403,
    retryable: false,
    freshNonceRequired: true,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: false,
    safeNextAction: "Stop and await the exact universal lane grant.",
    forbiddenRecovery: "Do not switch lanes to bypass reviewer provisioning.",
    docsPath: "/agents/gate-one-v2.generated.md"
  },
  {
    code: AGENT_ERROR_CODES.shadowSubmissionsDisabled,
    class: "server_error",
    httpStatus: 503,
    retryable: false,
    freshNonceRequired: true,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: false,
    safeNextAction: "Stop and wait until public capabilities report shadow submissions as available.",
    forbiddenRecovery: "Do not submit the shadow decision through the universal route.",
    docsPath: "/agents/gate-one-v2.generated.md"
  },
  {
    code: AGENT_ERROR_CODES.assignmentInvalid,
    class: "client_stop",
    retryable: false,
    freshNonceRequired: true,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: true,
    safeNextAction: "Refresh the signed assignment inbox and use only a current assignment addressed to this bot.",
    forbiddenRecovery: "Do not use an internal assignment feed or another reviewer's assignment.",
    docsPath: "/agents/gate-one-v2.generated.md"
  },
  {
    code: AGENT_ERROR_CODES.agentKitFailed,
    class: "server_error",
    httpStatus: 403,
    retryable: true,
    freshNonceRequired: true,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: false,
    safeNextAction: "Obtain a new AgentKit payload for the exact method, route, and nonce.",
    forbiddenRecovery: "Do not reuse an AgentKit payload from verify or another write.",
    docsPath: "/agents"
  },
  {
    code: AGENT_ERROR_CODES.idempotencyConflict,
    class: "server_error",
    httpStatus: 409,
    retryable: false,
    freshNonceRequired: false,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: false,
    safeNextAction: "Inspect the original operation associated with the idempotency key.",
    forbiddenRecovery: "Do not blindly rotate keys to duplicate the write.",
    docsPath: "/docs/api/agent-sdk"
  },
  {
    code: "GATE_ONE_V2_RUNTIME_GATED",
    class: "warning",
    retryable: false,
    freshNonceRequired: false,
    newIdempotencyKeyAllowed: false,
    refreshCurrentPacket: false,
    safeNextAction: "Treat checked-in policy posture separately from observed runtime capability.",
    forbiddenRecovery: "Do not infer packet publication approval from policy posture.",
    docsPath: "/how-trust-works"
  }
]);

