import { z } from "zod";
export * from "./agent-capabilities.js";
export * from "./agent-errors.js";
export * from "./agent-guidance.js";
export * from "./agent-release-manifest.js";
import {
  GATE_ONE_PREFLIGHT_CONTRACTS,
  GateOneDisclosureRequirementSchema,
  GateOnePreflightCheckResultSchema,
  GateOnePreflightContractSchema,
  GateOnePreflightVerdictSchema,
  GateOnePublicProofGraphSchema,
  GateOneSpecialistRequirementSchema
} from "./governance/gate-one/index.js";
export {
  buildRewardMerkleDistributorDeployPlan,
  RewardMerkleDeployModeSchema,
  RewardMerkleDistributorArtifactSchema,
  type RewardMerkleDeployEnv,
  type RewardMerkleDeployMode,
  type RewardMerkleDeployPlan,
  type RewardMerkleDistributorArtifact
} from "./reward-merkle-deploy.js";
export {
  buildRewardMerkleOperatorPlan,
  RewardMerkleOperatorActionSchema,
  type RewardMerkleOperatorAction,
  type RewardMerkleOperatorManifest,
  type RewardMerkleOperatorPlan,
  type RewardMerkleOperatorPlanInput
} from "./reward-merkle-ops.js";
export {
  buildRewardClaimMerkleRoot,
  buildRewardClaimProof,
  combineRewardMerkleNodes,
  hashRewardClaimLeaf,
  hashRewardPayoutIds,
  rewardClaimLeafDomainHash,
  REWARD_CLAIM_LEAF_DOMAIN,
  REWARD_MERKLE_DISTRIBUTOR_ABI,
  REWARD_MERKLE_DISTRIBUTOR_CONTRACT_NAME,
  REWARD_MERKLE_DISTRIBUTOR_SOURCE_PATH,
  verifyRewardClaimProof,
  type RewardClaimLeafInput,
  type RewardClaimProofNode
} from "./reward-merkle-distributor.js";
export * from "./governance/gate-one/index.js";

export const RequestIdSchema = z.string().trim().min(1).max(128);
export type RequestId = z.infer<typeof RequestIdSchema>;

export const SupportedLanguageSchema = z.enum(["en", "es", "fr", "de", "zh-Hans"]);
export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().optional(),
    requestId: RequestIdSchema
  })
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const V1ActionableErrorDocsSchema = z
  .object({
    bots: z.string().min(1).optional(),
    skill: z.string().min(1).optional(),
    openapi: z.string().min(1).optional()
  })
  .strict();

export const V1ActionableErrorSchema = z
  .object({
    error: z.string().min(1),
    code: z.string().min(1).optional(),
    message: z.string().min(1).optional(),
    details: z.unknown().optional(),
    nextAction: z.string().min(1).optional(),
    requestId: RequestIdSchema.optional(),
    retryAfterSeconds: z.number().int().nonnegative().optional(),
    docs: V1ActionableErrorDocsSchema.optional()
  })
  .passthrough();

export type V1ActionableError = z.infer<typeof V1ActionableErrorSchema>;

export interface ParsedMachineRoomApiError {
  shape: "v1-actionable" | "v2";
  code?: string;
  message: string;
  details?: unknown;
  requestId?: string;
  nextAction?: string;
  retryAfterSeconds?: number;
  docs?: z.infer<typeof V1ActionableErrorDocsSchema>;
}

export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    requestId: RequestIdSchema
  });

export type ApiSuccess<T> = {
  data: T;
  requestId: string;
};

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

const JSON_SERIALIZED_BYTE_LIMIT = 8192;
const jsonUtf8Encoder = new TextEncoder();

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(JsonValueSchema)
  ])
);

function isJsonDepthBounded(value: JsonValue, depth = 0): boolean {
  if (depth > 12) return false;
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return true;
  }
  if (Array.isArray(value)) return value.every((item) => isJsonDepthBounded(item, depth + 1));
  return Object.values(value).every((item) => isJsonDepthBounded(item, depth + 1));
}

function isSmallEnoughJsonObject(value: JsonObject): boolean {
  try {
    return jsonUtf8Encoder.encode(JSON.stringify(value)).byteLength <= JSON_SERIALIZED_BYTE_LIMIT;
  } catch {
    return false;
  }
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
  const parts: string[] = [];
  for (const key of keys) {
    const next = obj[key];
    if (next === undefined) continue;
    parts.push(`${JSON.stringify(key)}:${stableStringify(next)}`);
  }
  return `{${parts.join(",")}}`;
}

function isHttpOrHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isMachineRoomSafePublicLinkUrl(value: string): boolean {
  return isHttpOrHttpsUrl(value);
}

export const RequestContextSchema = z.object({
  requestId: RequestIdSchema,
  traceId: z.string().min(1).optional()
});

export type RequestContext = z.infer<typeof RequestContextSchema>;

export const RuntimeModeSchema = z.enum(["development", "test", "production"]);
export type RuntimeMode = z.infer<typeof RuntimeModeSchema>;

export const V2HealthDataSchema = z.object({
  ok: z.literal(true),
  service: z.literal("machines-room-api")
});

export const V2HealthResponseSchema = apiSuccessSchema(V2HealthDataSchema);

export const V2ReadyzDataSchema = z.object({
  ready: z.boolean(),
  mode: RuntimeModeSchema
});

export const V2ReadyzResponseSchema = apiSuccessSchema(V2ReadyzDataSchema);

export const V2SessionUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().optional(),
  displayName: z.string().min(1).optional()
});

export const V2HumanProofStatusSchema = z.object({
  verifiedHuman: z.boolean(),
  linkedHumanId: z.string().min(1).optional(),
  provider: z
    .enum(["WORLD_ID", "IDENA", "POH", "BRIGHT_ID", "PASSPORT_XYZ", "KYC_LITE", "DEVICE_INTEGRITY", "ECON_BOND"])
    .optional(),
  tier: z.enum(["L0", "L1", "L2", "L3"]).optional()
});

export const V2SessionMetadataSchema = z.object({
  expiresAt: z.string().datetime(),
  lastUsedAt: z.string().datetime().optional()
});

export const V2ActorSessionSchema = z.object({
  actorId: z.string().min(1),
  actorType: z.enum(["human", "bot"]),
  verified: z.boolean(),
  proofProvider: z.enum(["WORLD_ID", "IDENA", "POH"]).optional(),
  userId: z.string().min(1).optional(),
  linkedHumanId: z.string().min(1).optional()
});

export const V2AnonymousSessionDataSchema = z.object({
  authenticated: z.literal(false)
});

export const V2AuthenticatedSessionDataSchema = z.object({
  authenticated: z.literal(true),
  user: V2SessionUserSchema,
  proof: V2HumanProofStatusSchema,
  session: V2SessionMetadataSchema
});

export const V2ServiceAccountSessionDataSchema = z.object({
  authenticated: z.literal(true),
  serviceAccount: z.object({
    id: z.string().min(1),
    organizationId: z.string().min(1),
    workspaceId: z.string().min(1).optional(),
    name: z.string().min(1)
  }),
  credential: z.object({
    apiKeyId: z.string().min(1),
    expiresAt: z.string().datetime().optional(),
    lastUsedAt: z.string().datetime().optional()
  })
});

export const V2AuthSessionDataSchema = z.union([
  V2AnonymousSessionDataSchema,
  V2AuthenticatedSessionDataSchema,
  V2ServiceAccountSessionDataSchema
]);

export const V2AuthSessionResponseSchema = apiSuccessSchema(V2AuthSessionDataSchema);

export const V2MeDataSchema = z.object({
  user: V2SessionUserSchema,
  proof: V2HumanProofStatusSchema,
  session: V2SessionMetadataSchema
});

export const V2MeResponseSchema = apiSuccessSchema(V2MeDataSchema);

export const V2AuthorizationMembershipGrantSchema = z.object({
  membershipId: z.string().min(1),
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  roles: z.array(z.string().min(1)),
  permissions: z.array(z.string().min(1))
});

export const V2AuthorizationUnsupportedGrantKeysSchema = z.object({
  roles: z.array(z.string().min(1)),
  permissions: z.array(z.string().min(1))
});

export const V2AuthorizationSummarySchema = z.object({
  memberships: z.array(V2AuthorizationMembershipGrantSchema),
  unsupportedGrantKeys: V2AuthorizationUnsupportedGrantKeysSchema
});

function createEmptyV2AuthorizationSummary() {
  return {
    memberships: [],
    unsupportedGrantKeys: {
      roles: [],
      permissions: []
    }
  };
}

export const V2UsersMeDataSchema = z.object({
  user: V2SessionUserSchema,
  actor: V2ActorSessionSchema,
  authorization: V2AuthorizationSummarySchema.default(createEmptyV2AuthorizationSummary),
  proof: V2HumanProofStatusSchema,
  session: V2SessionMetadataSchema
});

export const V2UsersMeResponseSchema = apiSuccessSchema(V2UsersMeDataSchema);

export const V2OrganizationMembershipsMeDataSchema = z.object({
  organizationId: z.string().min(1),
  authorization: V2AuthorizationSummarySchema
});

export const V2OrganizationMembershipsMeResponseSchema = apiSuccessSchema(V2OrganizationMembershipsMeDataSchema);

export const V2WorkspaceMembershipsMeDataSchema = z.object({
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1),
  authorization: V2AuthorizationSummarySchema
});

export const V2WorkspaceMembershipsMeResponseSchema = apiSuccessSchema(V2WorkspaceMembershipsMeDataSchema);

export const V2OrganizationPlanSchema = z.enum(["FREE", "PRO", "ENTERPRISE"]);
export const V2OrganizationStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]);
export const V2WorkspaceStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]);
export const V2OrganizationOidcProviderStatusSchema = z.enum(["DISABLED", "ACTIVE"]);

function normalizeV2OidcIssuer(value: string): string {
  const url = new URL(value.trim());
  const pathname = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${pathname === "" ? "" : pathname}`;
}

function isV2HttpsUrlWithoutQueryOrHash(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.search === "" && url.hash === "";
  } catch {
    return false;
  }
}

function isV2OidcAllowedDomain(value: string): boolean {
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value);
}

export const V2OrganizationOidcIssuerSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isV2HttpsUrlWithoutQueryOrHash, "issuer must be an https URL without query or fragment")
  .transform(normalizeV2OidcIssuer);

export const V2OrganizationOidcAllowedDomainSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .refine(isV2OidcAllowedDomain, "allowed domain must be a DNS domain without wildcard");

export const V2OrganizationOidcClientSecretEnvVarNameSchema = z
  .string()
  .trim()
  .regex(/^[A-Z][A-Z0-9_]{2,127}$/, "client secret must be referenced by an environment variable name");

export const V2OrganizationOidcSettingsSchema = z.object({
  organizationId: z.string().min(1),
  status: V2OrganizationOidcProviderStatusSchema,
  providerName: z.string().min(1).optional(),
  issuer: V2OrganizationOidcIssuerSchema.optional(),
  clientId: z.string().min(1).optional(),
  clientSecretConfigured: z.boolean(),
  allowedDomains: z.array(V2OrganizationOidcAllowedDomainSchema),
  jitProvisioningEnabled: z.boolean(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export const V2OrganizationOidcSettingsDataSchema = z.object({
  organizationId: z.string().min(1),
  oidcSettings: V2OrganizationOidcSettingsSchema
});

export const V2OrganizationOidcSettingsResponseSchema = apiSuccessSchema(
  V2OrganizationOidcSettingsDataSchema
);

export const V2OrganizationOidcSettingsUpdateRequestSchema = z.object({
  status: V2OrganizationOidcProviderStatusSchema,
  providerName: z.string().trim().min(1).max(120).optional(),
  issuer: V2OrganizationOidcIssuerSchema.optional(),
  clientId: z.string().trim().min(1).max(256).optional(),
  clientSecretEnvVarName: V2OrganizationOidcClientSecretEnvVarNameSchema.optional(),
  allowedDomains: z.array(V2OrganizationOidcAllowedDomainSchema).max(20).optional(),
  jitProvisioningEnabled: z.boolean().optional()
}).strict();

export const V2OrganizationAdminSummarySchema = z.object({
  organizationId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  plan: V2OrganizationPlanSchema,
  status: V2OrganizationStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const V2OrganizationMetadataSchema: z.ZodType<JsonObject> = z
  .record(JsonValueSchema)
  .refine((value) => isJsonDepthBounded(value), "metadata must be 12 levels deep or fewer")
  .refine((value) => isSmallEnoughJsonObject(value), "metadata must serialize to 8192 bytes or fewer");

export const V2OrganizationAdminDetailSchema = V2OrganizationAdminSummarySchema.extend({
  metadata: V2OrganizationMetadataSchema
});

export const V2OrganizationsDataSchema = z.object({
  organizations: z.array(V2OrganizationAdminSummarySchema)
});

export const V2OrganizationsResponseSchema = apiSuccessSchema(V2OrganizationsDataSchema);

export const V2OrganizationDataSchema = z.object({
  organization: V2OrganizationAdminDetailSchema
});

export const V2OrganizationResponseSchema = apiSuccessSchema(V2OrganizationDataSchema);

export const V2WorkspaceAdminSummarySchema = z.object({
  workspaceId: z.string().min(1),
  organizationId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  status: V2WorkspaceStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const V2OrganizationWorkspacesDataSchema = z.object({
  organizationId: z.string().min(1),
  workspaces: z.array(V2WorkspaceAdminSummarySchema)
});

export const V2OrganizationWorkspacesResponseSchema = apiSuccessSchema(V2OrganizationWorkspacesDataSchema);

export const V2WorkspaceDataSchema = z.object({
  organizationId: z.string().min(1),
  workspace: V2WorkspaceAdminSummarySchema
});

export const V2WorkspaceResponseSchema = apiSuccessSchema(V2WorkspaceDataSchema);

export const V2MembershipStatusSchema = z.enum(["INVITED", "ACTIVE", "SUSPENDED", "REMOVED"]);

export const V2WorkspaceMembershipInventoryRoleSchema = z.object({
  membershipRoleId: z.string().min(1),
  roleId: z.string().min(1),
  roleKey: z.string().min(1),
  roleName: z.string().min(1)
});

export const V2WorkspaceMembershipInventoryItemSchema = z.object({
  membershipId: z.string().min(1),
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  status: V2MembershipStatusSchema,
  invitedEmail: z.string().min(1).optional(),
  invitedByUserId: z.string().min(1).optional(),
  roles: z.array(V2WorkspaceMembershipInventoryRoleSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const V2WorkspaceMembershipsDataSchema = z.object({
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1),
  memberships: z.array(V2WorkspaceMembershipInventoryItemSchema)
});

export const V2WorkspaceMembershipsResponseSchema = apiSuccessSchema(V2WorkspaceMembershipsDataSchema);

export const V2PendingWorkspaceMembershipInvitesDataSchema = z.object({
  invites: z.array(V2WorkspaceMembershipInventoryItemSchema)
});

export const V2PendingWorkspaceMembershipInvitesResponseSchema = apiSuccessSchema(
  V2PendingWorkspaceMembershipInvitesDataSchema
);

export const V2PendingWorkspaceMembershipInviteDataSchema = z.object({
  invite: V2WorkspaceMembershipInventoryItemSchema
});

export const V2PendingWorkspaceMembershipInviteResponseSchema = apiSuccessSchema(
  V2PendingWorkspaceMembershipInviteDataSchema
);

export const V2RbacRoleDefinitionSchema = z.object({
  roleId: z.string().min(1),
  organizationId: z.string().min(1).optional(),
  workspaceId: z.string().min(1).optional(),
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  system: z.boolean(),
  permissions: z.array(z.string().min(1))
});

export const V2OrganizationRolesDataSchema = z.object({
  organizationId: z.string().min(1),
  roles: z.array(V2RbacRoleDefinitionSchema)
});

export const V2OrganizationRolesResponseSchema = apiSuccessSchema(V2OrganizationRolesDataSchema);

export const V2WorkspaceRolesDataSchema = z.object({
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1),
  roles: z.array(V2RbacRoleDefinitionSchema)
});

export const V2WorkspaceRolesResponseSchema = apiSuccessSchema(V2WorkspaceRolesDataSchema);

export const V2AuditActorKindSchema = z.enum(["USER", "SERVICE_ACCOUNT", "AGENT", "SYSTEM"]);

export const V2AuditEventInventoryItemSchema = z.object({
  auditEventId: z.string().min(1),
  actorKind: V2AuditActorKindSchema,
  actorId: z.string().min(1).optional(),
  actorUserId: z.string().min(1).optional(),
  actorServiceAccountId: z.string().min(1).optional(),
  agentId: z.string().min(1).optional(),
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  action: z.string().min(1),
  resourceType: z.string().min(1),
  resourceId: z.string().min(1).optional(),
  requestId: z.string().min(1).optional(),
  traceId: z.string().min(1).optional(),
  createdAt: z.string().datetime()
});

export const V2AuditEventsPaginationSchema = z.object({
  nextCursor: z.string().min(1).optional()
});

export const V2OrganizationAuditEventsDataSchema = z.object({
  organizationId: z.string().min(1),
  auditEvents: z.array(V2AuditEventInventoryItemSchema),
  pagination: V2AuditEventsPaginationSchema
});

export const V2OrganizationAuditEventsResponseSchema = apiSuccessSchema(V2OrganizationAuditEventsDataSchema);

export const V2WorkspaceAuditEventsDataSchema = z.object({
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1),
  auditEvents: z.array(V2AuditEventInventoryItemSchema),
  pagination: V2AuditEventsPaginationSchema
});

export const V2WorkspaceAuditEventsResponseSchema = apiSuccessSchema(V2WorkspaceAuditEventsDataSchema);

export const V2ServiceAccountStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]);

export const V2ServiceAccountInventoryItemSchema = z.object({
  serviceAccountId: z.string().min(1),
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  name: z.string().min(1),
  status: V2ServiceAccountStatusSchema,
  createdByUserId: z.string().min(1).optional(),
  lastUsedAt: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const V2OrganizationServiceAccountsDataSchema = z.object({
  organizationId: z.string().min(1),
  serviceAccounts: z.array(V2ServiceAccountInventoryItemSchema)
});

export const V2OrganizationServiceAccountsResponseSchema = apiSuccessSchema(V2OrganizationServiceAccountsDataSchema);

export const V2WorkspaceServiceAccountsDataSchema = z.object({
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1),
  serviceAccounts: z.array(V2ServiceAccountInventoryItemSchema)
});

export const V2WorkspaceServiceAccountsResponseSchema = apiSuccessSchema(V2WorkspaceServiceAccountsDataSchema);

export const V2ServiceAccountCreateRequestSchema = z.object({
  name: z.string().trim().min(1).max(120)
}).strict();

export const V2ApiKeyStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "REVOKED", "EXPIRED"]);

export const V2ApiKeyInventoryItemSchema = z.object({
  apiKeyId: z.string().min(1),
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  serviceAccountId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  name: z.string().min(1),
  status: V2ApiKeyStatusSchema,
  expiresAt: z.string().datetime().optional(),
  lastUsedAt: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const V2OrganizationApiKeysDataSchema = z.object({
  organizationId: z.string().min(1),
  apiKeys: z.array(V2ApiKeyInventoryItemSchema)
});

export const V2OrganizationApiKeysResponseSchema = apiSuccessSchema(V2OrganizationApiKeysDataSchema);

export const V2WorkspaceApiKeysDataSchema = z.object({
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1),
  apiKeys: z.array(V2ApiKeyInventoryItemSchema)
});

export const V2WorkspaceApiKeysResponseSchema = apiSuccessSchema(V2WorkspaceApiKeysDataSchema);

export const V2ApiKeyCreateRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  serviceAccountId: z.string().trim().min(1),
  expiresAt: z.string().datetime().optional()
}).strict();

export type V2HealthData = z.infer<typeof V2HealthDataSchema>;
export type V2HealthResponse = z.infer<typeof V2HealthResponseSchema>;
export type V2ReadyzData = z.infer<typeof V2ReadyzDataSchema>;
export type V2ReadyzResponse = z.infer<typeof V2ReadyzResponseSchema>;
export type V2SessionUser = z.infer<typeof V2SessionUserSchema>;
export type V2HumanProofStatus = z.infer<typeof V2HumanProofStatusSchema>;
export type V2SessionMetadata = z.infer<typeof V2SessionMetadataSchema>;
export type V2ActorSession = z.infer<typeof V2ActorSessionSchema>;
export type V2AuthSessionData = z.infer<typeof V2AuthSessionDataSchema>;
export type V2AuthSessionResponse = z.infer<typeof V2AuthSessionResponseSchema>;
export type V2ServiceAccountSessionData = z.infer<typeof V2ServiceAccountSessionDataSchema>;
export type V2MeData = z.infer<typeof V2MeDataSchema>;
export type V2MeResponse = z.infer<typeof V2MeResponseSchema>;
export type V2AuthorizationMembershipGrant = z.infer<typeof V2AuthorizationMembershipGrantSchema>;
export type V2AuthorizationUnsupportedGrantKeys = z.infer<typeof V2AuthorizationUnsupportedGrantKeysSchema>;
export type V2AuthorizationSummary = z.infer<typeof V2AuthorizationSummarySchema>;
export type V2UsersMeData = z.infer<typeof V2UsersMeDataSchema>;
export type V2UsersMeResponse = z.infer<typeof V2UsersMeResponseSchema>;
export type V2OrganizationMembershipsMeData = z.infer<typeof V2OrganizationMembershipsMeDataSchema>;
export type V2OrganizationMembershipsMeResponse = z.infer<typeof V2OrganizationMembershipsMeResponseSchema>;
export type V2WorkspaceMembershipsMeData = z.infer<typeof V2WorkspaceMembershipsMeDataSchema>;
export type V2WorkspaceMembershipsMeResponse = z.infer<typeof V2WorkspaceMembershipsMeResponseSchema>;
export type V2OrganizationPlan = z.infer<typeof V2OrganizationPlanSchema>;
export type V2OrganizationStatus = z.infer<typeof V2OrganizationStatusSchema>;
export type V2WorkspaceStatus = z.infer<typeof V2WorkspaceStatusSchema>;
export type V2OrganizationAdminSummary = z.infer<typeof V2OrganizationAdminSummarySchema>;
export type V2OrganizationMetadata = z.infer<typeof V2OrganizationMetadataSchema>;
export type V2OrganizationAdminDetail = z.infer<typeof V2OrganizationAdminDetailSchema>;
export type V2OrganizationsData = z.infer<typeof V2OrganizationsDataSchema>;
export type V2OrganizationsResponse = z.infer<typeof V2OrganizationsResponseSchema>;
export type V2OrganizationData = z.infer<typeof V2OrganizationDataSchema>;
export type V2OrganizationResponse = z.infer<typeof V2OrganizationResponseSchema>;
export type V2WorkspaceAdminSummary = z.infer<typeof V2WorkspaceAdminSummarySchema>;
export type V2OrganizationWorkspacesData = z.infer<typeof V2OrganizationWorkspacesDataSchema>;
export type V2OrganizationWorkspacesResponse = z.infer<typeof V2OrganizationWorkspacesResponseSchema>;
export type V2WorkspaceData = z.infer<typeof V2WorkspaceDataSchema>;
export type V2WorkspaceResponse = z.infer<typeof V2WorkspaceResponseSchema>;
export type V2MembershipStatus = z.infer<typeof V2MembershipStatusSchema>;
export type V2WorkspaceMembershipInventoryRole = z.infer<typeof V2WorkspaceMembershipInventoryRoleSchema>;
export type V2WorkspaceMembershipInventoryItem = z.infer<typeof V2WorkspaceMembershipInventoryItemSchema>;
export type V2WorkspaceMembershipsData = z.infer<typeof V2WorkspaceMembershipsDataSchema>;
export type V2WorkspaceMembershipsResponse = z.infer<typeof V2WorkspaceMembershipsResponseSchema>;
export type V2PendingWorkspaceMembershipInvitesData = z.infer<
  typeof V2PendingWorkspaceMembershipInvitesDataSchema
>;
export type V2PendingWorkspaceMembershipInvitesResponse = z.infer<
  typeof V2PendingWorkspaceMembershipInvitesResponseSchema
>;
export type V2PendingWorkspaceMembershipInviteData = z.infer<
  typeof V2PendingWorkspaceMembershipInviteDataSchema
>;
export type V2PendingWorkspaceMembershipInviteResponse = z.infer<
  typeof V2PendingWorkspaceMembershipInviteResponseSchema
>;
export type V2RbacRoleDefinition = z.infer<typeof V2RbacRoleDefinitionSchema>;
export type V2OrganizationRolesData = z.infer<typeof V2OrganizationRolesDataSchema>;
export type V2OrganizationRolesResponse = z.infer<typeof V2OrganizationRolesResponseSchema>;
export type V2WorkspaceRolesData = z.infer<typeof V2WorkspaceRolesDataSchema>;
export type V2WorkspaceRolesResponse = z.infer<typeof V2WorkspaceRolesResponseSchema>;
export type V2AuditActorKind = z.infer<typeof V2AuditActorKindSchema>;
export type V2AuditEventInventoryItem = z.infer<typeof V2AuditEventInventoryItemSchema>;
export type V2AuditEventsPagination = z.infer<typeof V2AuditEventsPaginationSchema>;
export type V2OrganizationAuditEventsData = z.infer<typeof V2OrganizationAuditEventsDataSchema>;
export type V2OrganizationAuditEventsResponse = z.infer<typeof V2OrganizationAuditEventsResponseSchema>;
export type V2WorkspaceAuditEventsData = z.infer<typeof V2WorkspaceAuditEventsDataSchema>;
export type V2WorkspaceAuditEventsResponse = z.infer<typeof V2WorkspaceAuditEventsResponseSchema>;
export type V2ServiceAccountStatus = z.infer<typeof V2ServiceAccountStatusSchema>;
export type V2ServiceAccountInventoryItem = z.infer<typeof V2ServiceAccountInventoryItemSchema>;
export type V2OrganizationServiceAccountsData = z.infer<typeof V2OrganizationServiceAccountsDataSchema>;
export type V2OrganizationServiceAccountsResponse = z.infer<typeof V2OrganizationServiceAccountsResponseSchema>;
export type V2WorkspaceServiceAccountsData = z.infer<typeof V2WorkspaceServiceAccountsDataSchema>;
export type V2WorkspaceServiceAccountsResponse = z.infer<typeof V2WorkspaceServiceAccountsResponseSchema>;
export type V2ServiceAccountCreateRequest = z.infer<typeof V2ServiceAccountCreateRequestSchema>;
export type V2ApiKeyStatus = z.infer<typeof V2ApiKeyStatusSchema>;
export type V2ApiKeyInventoryItem = z.infer<typeof V2ApiKeyInventoryItemSchema>;
export type V2OrganizationApiKeysData = z.infer<typeof V2OrganizationApiKeysDataSchema>;
export type V2OrganizationApiKeysResponse = z.infer<typeof V2OrganizationApiKeysResponseSchema>;
export type V2WorkspaceApiKeysData = z.infer<typeof V2WorkspaceApiKeysDataSchema>;
export type V2WorkspaceApiKeysResponse = z.infer<typeof V2WorkspaceApiKeysResponseSchema>;
export type V2ApiKeyCreateRequest = z.infer<typeof V2ApiKeyCreateRequestSchema>;

export const ActorContextSchema = z.object({
  actorType: z.enum(["anonymous", "user", "service-account", "agent"]),
  userId: z.string().min(1).optional(),
  serviceAccountId: z.string().min(1).optional(),
  agentId: z.string().min(1).optional(),
  organizationId: z.string().min(1).optional(),
  workspaceId: z.string().min(1).optional(),
  verifiedHuman: z.boolean().default(false)
});

export type ActorContext = z.infer<typeof ActorContextSchema>;

export const IdempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/);

export const PayloadHashSchema = z.string().trim().regex(/^[a-f0-9]{64}$/);

export const IdempotencyRequestSchema = z.object({
  key: IdempotencyKeySchema,
  operation: z.string().trim().min(1),
  payloadHash: PayloadHashSchema
});

export const IdempotencyResultSchema = z.object({
  status: z.enum(["created", "replayed", "conflict"]),
  key: IdempotencyKeySchema,
  requestId: z.string().min(1)
});

export type IdempotencyRequest = z.infer<typeof IdempotencyRequestSchema>;
export type IdempotencyResult = z.infer<typeof IdempotencyResultSchema>;
export type PayloadHash = z.infer<typeof PayloadHashSchema>;

export const V2OrganizationMetadataUpdateRequestSchema = z.object({
  metadata: V2OrganizationMetadataSchema
}).strict();

export const V2OrganizationMetadataUpdateDataSchema = z.object({
  organization: V2OrganizationAdminDetailSchema,
  updated: z.literal(true),
  updatedFields: z.tuple([z.literal("metadata")])
});

export const V2OrganizationMetadataUpdateResponseSchema = apiSuccessSchema(
  V2OrganizationMetadataUpdateDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2OrganizationMetadataUpdateRequest = z.infer<
  typeof V2OrganizationMetadataUpdateRequestSchema
>;
export type V2OrganizationMetadataUpdateData = z.infer<typeof V2OrganizationMetadataUpdateDataSchema>;
export type V2OrganizationMetadataUpdateResponse = z.infer<
  typeof V2OrganizationMetadataUpdateResponseSchema
>;

export const V2OrganizationOidcSettingsUpdateDataSchema = z.object({
  organizationId: z.string().min(1),
  oidcSettings: V2OrganizationOidcSettingsSchema,
  updated: z.literal(true),
  updatedFields: z.array(
    z.enum([
      "status",
      "providerName",
      "issuer",
      "clientId",
      "clientSecretEnvVarName",
      "allowedDomains",
      "jitProvisioningEnabled"
    ])
  )
});

export const V2OrganizationOidcSettingsUpdateResponseSchema = apiSuccessSchema(
  V2OrganizationOidcSettingsUpdateDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2OrganizationOidcProviderStatus = z.infer<typeof V2OrganizationOidcProviderStatusSchema>;
export type V2OrganizationOidcSettings = z.infer<typeof V2OrganizationOidcSettingsSchema>;
export type V2OrganizationOidcSettingsData = z.infer<typeof V2OrganizationOidcSettingsDataSchema>;
export type V2OrganizationOidcSettingsResponse = z.infer<typeof V2OrganizationOidcSettingsResponseSchema>;
export type V2OrganizationOidcSettingsUpdateRequest = z.infer<
  typeof V2OrganizationOidcSettingsUpdateRequestSchema
>;
export type V2OrganizationOidcSettingsUpdateData = z.infer<
  typeof V2OrganizationOidcSettingsUpdateDataSchema
>;
export type V2OrganizationOidcSettingsUpdateResponse = z.infer<
  typeof V2OrganizationOidcSettingsUpdateResponseSchema
>;

export const V2WorkspaceMembershipRoleAssignmentRequestSchema = z.object({
  roleId: z.string().trim().min(1)
}).strict();

export const V2ServiceAccountCreateDataSchema = V2ServiceAccountInventoryItemSchema.extend({
  status: z.literal("ACTIVE"),
  createdByUserId: z.string().min(1),
  created: z.literal(true)
}).strict();

export const V2ServiceAccountCreateResponseSchema = apiSuccessSchema(
  V2ServiceAccountCreateDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2ServiceAccountCreateData = z.infer<typeof V2ServiceAccountCreateDataSchema>;
export type V2ServiceAccountCreateResponse = z.infer<typeof V2ServiceAccountCreateResponseSchema>;

export const V2ServiceAccountRevocationDataSchema = V2ServiceAccountInventoryItemSchema.extend({
  status: z.literal("REVOKED"),
  revokedAt: z.string().datetime(),
  previousStatus: z.enum(["ACTIVE", "SUSPENDED"]),
  revoked: z.literal(true),
  revokedApiKeyCount: z.number().int().min(0)
}).strict();

export const V2ServiceAccountRevocationResponseSchema = apiSuccessSchema(
  V2ServiceAccountRevocationDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2ServiceAccountRevocationData = z.infer<typeof V2ServiceAccountRevocationDataSchema>;
export type V2ServiceAccountRevocationResponse = z.infer<typeof V2ServiceAccountRevocationResponseSchema>;

const V2ApiKeyCreateBaseDataSchema = z.object({
  apiKeyId: z.string().min(1),
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  serviceAccountId: z.string().min(1),
  name: z.string().min(1),
  status: z.literal("ACTIVE"),
  keyPrefix: z.string().min(1).max(64),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  created: z.literal(true)
}).strict();

export const V2ApiKeyCreateInitialDataSchema = V2ApiKeyCreateBaseDataSchema.extend({
  secretAvailable: z.literal(true),
  apiKey: z.string().min(32).max(256)
}).strict();

export const V2ApiKeyCreateReplayDataSchema = V2ApiKeyCreateBaseDataSchema.extend({
  secretAvailable: z.literal(false)
}).strict();

export const V2ApiKeyCreateDataSchema = z.discriminatedUnion("secretAvailable", [
  V2ApiKeyCreateInitialDataSchema,
  V2ApiKeyCreateReplayDataSchema
]);

export const V2ApiKeyCreateInitialResponseSchema = apiSuccessSchema(V2ApiKeyCreateInitialDataSchema).extend({
  idempotency: IdempotencyResultSchema.extend({
    status: z.literal("created")
  })
});

export const V2ApiKeyCreateReplayResponseSchema = apiSuccessSchema(V2ApiKeyCreateReplayDataSchema).extend({
  idempotency: IdempotencyResultSchema.extend({
    status: z.literal("replayed")
  })
});

export const V2ApiKeyCreateResponseSchema = z.union([
  V2ApiKeyCreateInitialResponseSchema,
  V2ApiKeyCreateReplayResponseSchema
]);

export const V2ApiKeyRevocationDataSchema = V2ApiKeyInventoryItemSchema.extend({
  status: z.literal("REVOKED"),
  revokedAt: z.string().datetime(),
  previousStatus: z.literal("ACTIVE"),
  revoked: z.literal(true)
}).strict();

export const V2ApiKeyRevocationResponseSchema = apiSuccessSchema(V2ApiKeyRevocationDataSchema).extend({
  idempotency: IdempotencyResultSchema
});

export type V2ApiKeyCreateInitialData = z.infer<typeof V2ApiKeyCreateInitialDataSchema>;
export type V2ApiKeyCreateReplayData = z.infer<typeof V2ApiKeyCreateReplayDataSchema>;
export type V2ApiKeyCreateData = z.infer<typeof V2ApiKeyCreateDataSchema>;
export type V2ApiKeyCreateInitialResponse = z.infer<typeof V2ApiKeyCreateInitialResponseSchema>;
export type V2ApiKeyCreateReplayResponse = z.infer<typeof V2ApiKeyCreateReplayResponseSchema>;
export type V2ApiKeyCreateResponse = z.infer<typeof V2ApiKeyCreateResponseSchema>;
export type V2ApiKeyRevocationData = z.infer<typeof V2ApiKeyRevocationDataSchema>;
export type V2ApiKeyRevocationResponse = z.infer<typeof V2ApiKeyRevocationResponseSchema>;

export const V2WorkspaceMembershipInviteRequestSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(1).max(120).optional()
}).strict();

export const V2WorkspaceMembershipUpdatableStatusSchema = z.enum(["ACTIVE", "SUSPENDED"]);

export const V2WorkspaceMembershipUpdateRequestSchema = z.object({
  status: z.string().trim().pipe(V2WorkspaceMembershipUpdatableStatusSchema)
}).strict();

export const V2WorkspaceMembershipInviteEmailUpdateRequestSchema = z.object({
  invitedEmail: z.string().trim().email().max(320).transform((value) => value.toLowerCase())
}).strict();

export const V2WorkspaceMembershipInviteDataSchema = V2WorkspaceMembershipInventoryItemSchema.extend({
  created: z.boolean()
});

export const V2WorkspaceMembershipInviteResponseSchema = apiSuccessSchema(
  V2WorkspaceMembershipInviteDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2WorkspaceMembershipInviteRequest = z.infer<
  typeof V2WorkspaceMembershipInviteRequestSchema
>;
export type V2WorkspaceMembershipInviteData = z.infer<typeof V2WorkspaceMembershipInviteDataSchema>;
export type V2WorkspaceMembershipInviteResponse = z.infer<
  typeof V2WorkspaceMembershipInviteResponseSchema
>;
export type V2WorkspaceMembershipUpdatableStatus = z.infer<
  typeof V2WorkspaceMembershipUpdatableStatusSchema
>;
export type V2WorkspaceMembershipUpdateRequest = z.infer<
  typeof V2WorkspaceMembershipUpdateRequestSchema
>;
export type V2WorkspaceMembershipInviteEmailUpdateRequest = z.infer<
  typeof V2WorkspaceMembershipInviteEmailUpdateRequestSchema
>;

export const V2WorkspaceMembershipUpdateDataSchema = V2WorkspaceMembershipInventoryItemSchema.extend({
  status: V2WorkspaceMembershipUpdatableStatusSchema,
  updated: z.boolean(),
  updatedFields: z.array(z.literal("status")),
  previousStatus: V2WorkspaceMembershipUpdatableStatusSchema
});

export const V2WorkspaceMembershipInviteEmailUpdateDataSchema = V2WorkspaceMembershipInventoryItemSchema.extend({
  status: z.literal("INVITED"),
  invitedEmail: z.string().min(1),
  updated: z.boolean(),
  updatedFields: z.tuple([z.literal("invitedEmail"), z.literal("userId")]),
  previousUserId: z.string().min(1),
  previousInvitedEmail: z.string().min(1).optional()
});

export const V2WorkspaceMembershipUpdateResponseSchema = apiSuccessSchema(
  V2WorkspaceMembershipUpdateDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export const V2WorkspaceMembershipInviteEmailUpdateResponseSchema = apiSuccessSchema(
  V2WorkspaceMembershipInviteEmailUpdateDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2WorkspaceMembershipUpdateData = z.infer<
  typeof V2WorkspaceMembershipUpdateDataSchema
>;
export type V2WorkspaceMembershipUpdateResponse = z.infer<
  typeof V2WorkspaceMembershipUpdateResponseSchema
>;
export type V2WorkspaceMembershipInviteEmailUpdateData = z.infer<
  typeof V2WorkspaceMembershipInviteEmailUpdateDataSchema
>;
export type V2WorkspaceMembershipInviteEmailUpdateResponse = z.infer<
  typeof V2WorkspaceMembershipInviteEmailUpdateResponseSchema
>;

export const V2WorkspaceMembershipInviteCancellationDataSchema = V2WorkspaceMembershipInventoryItemSchema.extend({
  canceled: z.boolean()
});

export const V2WorkspaceMembershipInviteCancellationResponseSchema = apiSuccessSchema(
  V2WorkspaceMembershipInviteCancellationDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2WorkspaceMembershipInviteCancellationData = z.infer<
  typeof V2WorkspaceMembershipInviteCancellationDataSchema
>;
export type V2WorkspaceMembershipInviteCancellationResponse = z.infer<
  typeof V2WorkspaceMembershipInviteCancellationResponseSchema
>;

export const V2WorkspaceMembershipInviteResendDataSchema = V2WorkspaceMembershipInventoryItemSchema.extend({
  resent: z.boolean()
});

export const V2WorkspaceMembershipInviteResendResponseSchema = apiSuccessSchema(
  V2WorkspaceMembershipInviteResendDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2WorkspaceMembershipInviteResendData = z.infer<
  typeof V2WorkspaceMembershipInviteResendDataSchema
>;
export type V2WorkspaceMembershipInviteResendResponse = z.infer<
  typeof V2WorkspaceMembershipInviteResendResponseSchema
>;

export const V2WorkspaceMembershipInviteAcceptanceDataSchema = V2WorkspaceMembershipInventoryItemSchema.extend({
  accepted: z.boolean()
});

export const V2WorkspaceMembershipInviteAcceptanceResponseSchema = apiSuccessSchema(
  V2WorkspaceMembershipInviteAcceptanceDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2WorkspaceMembershipInviteAcceptanceData = z.infer<
  typeof V2WorkspaceMembershipInviteAcceptanceDataSchema
>;
export type V2WorkspaceMembershipInviteAcceptanceResponse = z.infer<
  typeof V2WorkspaceMembershipInviteAcceptanceResponseSchema
>;

export const V2WorkspaceMembershipInviteDeclineDataSchema = V2WorkspaceMembershipInventoryItemSchema.extend({
  declined: z.boolean()
});

export const V2WorkspaceMembershipInviteDeclineResponseSchema = apiSuccessSchema(
  V2WorkspaceMembershipInviteDeclineDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2WorkspaceMembershipInviteDeclineData = z.infer<
  typeof V2WorkspaceMembershipInviteDeclineDataSchema
>;
export type V2WorkspaceMembershipInviteDeclineResponse = z.infer<
  typeof V2WorkspaceMembershipInviteDeclineResponseSchema
>;

export const V2WorkspaceMembershipRemovalDataSchema = V2WorkspaceMembershipInventoryItemSchema.extend({
  removed: z.boolean()
});

export const V2WorkspaceMembershipRemovalResponseSchema = apiSuccessSchema(
  V2WorkspaceMembershipRemovalDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2WorkspaceMembershipRemovalData = z.infer<
  typeof V2WorkspaceMembershipRemovalDataSchema
>;
export type V2WorkspaceMembershipRemovalResponse = z.infer<
  typeof V2WorkspaceMembershipRemovalResponseSchema
>;

export const V2WorkspaceMembershipLeaveDataSchema = V2WorkspaceMembershipInventoryItemSchema.extend({
  left: z.boolean()
});

export const V2WorkspaceMembershipLeaveResponseSchema = apiSuccessSchema(
  V2WorkspaceMembershipLeaveDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2WorkspaceMembershipLeaveData = z.infer<typeof V2WorkspaceMembershipLeaveDataSchema>;
export type V2WorkspaceMembershipLeaveResponse = z.infer<typeof V2WorkspaceMembershipLeaveResponseSchema>;

export const V2WorkspaceMembershipSuspensionDataSchema = V2WorkspaceMembershipInventoryItemSchema.extend({
  suspended: z.boolean()
});

export const V2WorkspaceMembershipSuspensionResponseSchema = apiSuccessSchema(
  V2WorkspaceMembershipSuspensionDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2WorkspaceMembershipSuspensionData = z.infer<
  typeof V2WorkspaceMembershipSuspensionDataSchema
>;
export type V2WorkspaceMembershipSuspensionResponse = z.infer<
  typeof V2WorkspaceMembershipSuspensionResponseSchema
>;

export const V2WorkspaceMembershipReactivationDataSchema = V2WorkspaceMembershipInventoryItemSchema.extend({
  reactivated: z.boolean()
});

export const V2WorkspaceMembershipReactivationResponseSchema = apiSuccessSchema(
  V2WorkspaceMembershipReactivationDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2WorkspaceMembershipReactivationData = z.infer<
  typeof V2WorkspaceMembershipReactivationDataSchema
>;
export type V2WorkspaceMembershipReactivationResponse = z.infer<
  typeof V2WorkspaceMembershipReactivationResponseSchema
>;

export const V2WorkspaceMembershipRoleAssignmentDataSchema = z.object({
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1),
  membershipId: z.string().min(1),
  roleId: z.string().min(1),
  roleKey: z.string().min(1),
  membershipRoleId: z.string().min(1),
  created: z.boolean()
});

export const V2WorkspaceMembershipRoleAssignmentResponseSchema = apiSuccessSchema(
  V2WorkspaceMembershipRoleAssignmentDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2WorkspaceMembershipRoleAssignmentRequest = z.infer<
  typeof V2WorkspaceMembershipRoleAssignmentRequestSchema
>;
export type V2WorkspaceMembershipRoleAssignmentData = z.infer<
  typeof V2WorkspaceMembershipRoleAssignmentDataSchema
>;
export type V2WorkspaceMembershipRoleAssignmentResponse = z.infer<
  typeof V2WorkspaceMembershipRoleAssignmentResponseSchema
>;

export const V2WorkspaceMembershipRoleRemovalDataSchema = z.object({
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1),
  membershipId: z.string().min(1),
  roleId: z.string().min(1),
  roleKey: z.string().min(1),
  membershipRoleId: z.string().min(1).optional(),
  removed: z.boolean()
});

export const V2WorkspaceMembershipRoleRemovalResponseSchema = apiSuccessSchema(
  V2WorkspaceMembershipRoleRemovalDataSchema
).extend({
  idempotency: IdempotencyResultSchema
});

export type V2WorkspaceMembershipRoleRemovalData = z.infer<typeof V2WorkspaceMembershipRoleRemovalDataSchema>;
export type V2WorkspaceMembershipRoleRemovalResponse = z.infer<
  typeof V2WorkspaceMembershipRoleRemovalResponseSchema
>;

export const AccountIdentitySchema = z.object({
  id: z.string().min(1),
  provider: z.enum(["email", "passkey", "wallet", "oauth", "world-wallet"]),
  displayName: z.string().min(1).optional(),
  linkedAt: z.string().datetime().optional()
});

export const SessionUserSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1).optional(),
  identities: z.array(AccountIdentitySchema).default([])
});

export const OrganizationSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1)
});

export const WorkspaceSummarySchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  name: z.string().min(1)
});

export const MembershipSummarySchema = z.object({
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  roles: z.array(z.string().min(1))
});

export type AccountIdentity = z.infer<typeof AccountIdentitySchema>;
export type SessionUser = z.infer<typeof SessionUserSchema>;
export type OrganizationSummary = z.infer<typeof OrganizationSummarySchema>;
export type WorkspaceSummary = z.infer<typeof WorkspaceSummarySchema>;
export type MembershipSummary = z.infer<typeof MembershipSummarySchema>;

export const AuditEventEnvelopeSchema = z.object({
  id: z.string().min(1),
  action: z.string().min(1),
  actor: ActorContextSchema,
  resourceType: z.string().min(1),
  resourceId: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).default({}),
  requestId: z.string().min(1),
  traceId: z.string().min(1).optional(),
  createdAt: z.string().datetime()
});

export type AuditEventEnvelope = z.infer<typeof AuditEventEnvelopeSchema>;

export const PaginationCursorSchema = z.string().trim().min(1).max(512);

export const paginatedResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: PaginationCursorSchema.optional()
  });

export type PaginatedResult<T> = {
  items: T[];
  nextCursor?: string;
};

export const TranslationMetadataSchema = z
  .object({
    requestedLanguage: SupportedLanguageSchema,
    servedLanguage: SupportedLanguageSchema,
    status: z.enum(["translated", "source_fallback", "pending", "rejected", "blocked_by_rights"]),
    provider: z.string().min(1).optional(),
    providerModel: z.string().min(1).optional(),
    qualityStatus: z.string().min(1).optional(),
    qualityScore: z.number().optional(),
    sourceRevisionHash: z.string().min(1).optional(),
    glossaryVersion: z.string().min(1).optional(),
    instructionVersion: z.string().min(1).optional(),
    artifactId: z.string().min(1).optional(),
    updatedAt: z.string().min(1).optional()
  })
  .strict();

export type TranslationMetadata = z.infer<typeof TranslationMetadataSchema>;

export const RoomIdSchema = z.enum(["world", "markets", "tech", "science", "culture", "local", "your-room"]);
export type RoomId = z.infer<typeof RoomIdSchema>;

export const RoomDescriptorSchema = z.object({
  id: RoomIdSchema,
  label: z.string().min(1)
});

export type RoomDescriptor = z.infer<typeof RoomDescriptorSchema>;

export const StoryStateSchema = z.enum(["PROVISIONAL", "GRADUATED", "CONTESTED", "UNDER_REVIEW"]);
export const EditorialStateSchema = z.enum(["PROVISIONAL", "CONTESTED", "UNDER_REVIEW", "RETRACTED"]);
export const PromotionStateSchema = z.enum(["PROVISIONAL", "GRADUATED", "SUPPRESSED"]);
export const StoryPublicationStageSchema = z.enum(["CANDIDATE", "PROVISIONAL", "GRADUATED"]);
export const StoryReviewStatusSchema = z.enum(["EMERGING", "CLEAR", "CONTESTED", "UNDER_REVIEW", "RETRACTED"]);
export const MachineRoomArticleTypeSchema = z.enum([
  "brief",
  "news",
  "analysis",
  "explainer",
  "interview",
  "opinion",
  "live",
  "research"
]);

export type StoryState = z.infer<typeof StoryStateSchema>;
export type EditorialState = z.infer<typeof EditorialStateSchema>;
export type PromotionState = z.infer<typeof PromotionStateSchema>;
export type StoryPublicationStage = z.infer<typeof StoryPublicationStageSchema>;
export type StoryReviewStatus = z.infer<typeof StoryReviewStatusSchema>;
export type MachineRoomArticleType = z.infer<typeof MachineRoomArticleTypeSchema>;

const MACHINE_ROOM_ARTICLE_DOCUMENT_SERIALIZED_BYTE_LIMIT = 300_000;
export const MachineRoomArticleDocumentSchemaVersion = 1 as const;
export const MachineRoomPublicLinkUrlSchema = z.string().url().max(2048).refine(isMachineRoomSafePublicLinkUrl, {
  message: "URL must use http:// or https://"
});
const MachineRoomArticleSourceRefsSchema = z.array(z.string().trim().min(1).max(500)).min(1).max(20).optional();
const MachineRoomArticleFirstPartyImageAssetIdSchema = z
  .string()
  .min(1)
  .max(2048)
  .regex(/^\/(?!\/).{0,2046}$/, "Image assets must use a first-party root-relative path");

function isMachineRoomArticleImageAssetId(value: string): boolean {
  if (/^\/(?!\/).{0,2046}$/.test(value)) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const MachineRoomArticleImageAssetIdSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine(isMachineRoomArticleImageAssetId, {
    message: "Image assets must use a first-party root-relative path or HTTPS URL"
  });

export const MachineRoomArticleRichTextMarkSchema = z.discriminatedUnion("type", [
  z.object({ type: z.enum(["bold", "italic", "code"]) }).strict(),
  z.object({ type: z.literal("link"), href: MachineRoomPublicLinkUrlSchema }).strict(),
  z.object({ type: z.literal("claimRef"), claimId: z.string().trim().min(1).max(200) }).strict(),
  z.object({ type: z.literal("sourceRef"), sourceKey: z.string().trim().min(1).max(500) }).strict()
]);

export const MachineRoomArticleRichTextSpanSchema = z
  .object({
    text: z.string().max(10_000),
    marks: z.array(MachineRoomArticleRichTextMarkSchema).max(12).optional()
  })
  .strict()
  .refine((span) => span.text.trim().length > 0, { message: "text span must contain visible text" });

export const MachineRoomArticleRichTextSchema = z.array(MachineRoomArticleRichTextSpanSchema).min(1).max(200);

function buildMachineRoomArticleBlockSchema(imageAssetIdSchema: z.ZodType<string>) {
  return z.discriminatedUnion("type", [
    z
      .object({
        type: z.literal("heading"),
        level: z.union([z.literal(2), z.literal(3)]),
        text: MachineRoomArticleRichTextSchema
      })
      .strict(),
    z.object({ type: z.literal("paragraph"), text: MachineRoomArticleRichTextSchema }).strict(),
    z
      .object({
        type: z.literal("list"),
        style: z.enum(["bullet", "number"]),
        items: z.array(MachineRoomArticleRichTextSchema).min(1).max(100)
      })
      .strict(),
    z
      .object({
        type: z.literal("quote"),
        text: MachineRoomArticleRichTextSchema,
        attribution: z.string().max(500).optional(),
        sourceRefs: MachineRoomArticleSourceRefsSchema
      })
      .strict(),
    z
      .object({
        type: z.literal("image"),
        assetId: imageAssetIdSchema,
        alt: z.string().min(1).max(500),
        caption: MachineRoomArticleRichTextSchema.optional(),
        sourceRefs: MachineRoomArticleSourceRefsSchema
      })
      .strict(),
    z
      .object({
        type: z.literal("embed"),
        provider: z.enum(["youtube", "x", "world", "url"]),
        url: MachineRoomPublicLinkUrlSchema,
        caption: MachineRoomArticleRichTextSchema.optional()
      })
      .strict(),
    z
      .object({
        type: z.literal("table"),
        columns: z.array(z.string().min(1).max(200)).min(1).max(12),
        rows: z.array(z.array(z.string().max(2000)).min(1).max(12)).min(1).max(100),
        sourceRefs: MachineRoomArticleSourceRefsSchema
      })
      .strict(),
    z
      .object({
        type: z.literal("timeline"),
        events: z
          .array(
            z
              .object({
                date: z.string().min(1).max(100),
                text: MachineRoomArticleRichTextSchema,
                sourceRefs: MachineRoomArticleSourceRefsSchema
              })
              .strict()
          )
          .min(1)
          .max(100)
      })
      .strict(),
    z
      .object({
        type: z.literal("factBox"),
        title: z.string().min(1).max(300),
        items: z.array(MachineRoomArticleRichTextSchema).min(1).max(100),
        sourceRefs: MachineRoomArticleSourceRefsSchema
      })
      .strict(),
    z
      .object({
        type: z.literal("callout"),
        tone: z.enum(["context", "risk", "update", "correction"]),
        text: MachineRoomArticleRichTextSchema
      })
      .strict()
  ]);
}

export const MachineRoomArticleBlockSchema = buildMachineRoomArticleBlockSchema(MachineRoomArticleImageAssetIdSchema);
export const MachineRoomArticleWriteBlockSchema = buildMachineRoomArticleBlockSchema(MachineRoomArticleFirstPartyImageAssetIdSchema);

export const MachineRoomArticleDocumentV1Schema = z
  .object({
    schemaVersion: z.literal(MachineRoomArticleDocumentSchemaVersion),
    blocks: z.array(MachineRoomArticleBlockSchema).min(1).max(500)
  })
  .strict()
  .superRefine((document, context) => {
    const serializedBytes = jsonUtf8Encoder.encode(stableStringify(document)).byteLength;
    if (serializedBytes > MACHINE_ROOM_ARTICLE_DOCUMENT_SERIALIZED_BYTE_LIMIT) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "article document exceeds 300KB"
      });
    }
  });

export const MachineRoomArticleDocumentSchema = MachineRoomArticleDocumentV1Schema;

export const MachineRoomArticleWriteDocumentV1Schema = z
  .object({
    schemaVersion: z.literal(MachineRoomArticleDocumentSchemaVersion),
    blocks: z.array(MachineRoomArticleWriteBlockSchema).min(1).max(500)
  })
  .strict()
  .superRefine((document, context) => {
    const serializedBytes = jsonUtf8Encoder.encode(stableStringify(document)).byteLength;
    if (serializedBytes > MACHINE_ROOM_ARTICLE_DOCUMENT_SERIALIZED_BYTE_LIMIT) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "article document exceeds 300KB"
      });
    }
  });

export const MachineRoomArticleWriteDocumentSchema = MachineRoomArticleWriteDocumentV1Schema;

export const StoryArticleDocumentSchema = z
  .object({
    schemaVersion: z.literal(MachineRoomArticleDocumentSchemaVersion),
    articleType: MachineRoomArticleTypeSchema,
    dek: z.string().min(1).optional(),
    revisionHash: z.string().min(1),
    document: MachineRoomArticleDocumentV1Schema,
    updatedAt: z.string().min(1)
  })
  .strict();

export type MachineRoomArticleRichTextMark = z.infer<typeof MachineRoomArticleRichTextMarkSchema>;
export type MachineRoomArticleRichTextSpan = z.infer<typeof MachineRoomArticleRichTextSpanSchema>;
export type MachineRoomArticleRichText = z.infer<typeof MachineRoomArticleRichTextSchema>;
export type MachineRoomArticleBlock = z.infer<typeof MachineRoomArticleBlockSchema>;
export type MachineRoomArticleWriteBlock = z.infer<typeof MachineRoomArticleWriteBlockSchema>;
export type MachineRoomArticleDocumentV1 = z.infer<typeof MachineRoomArticleDocumentV1Schema>;
export type MachineRoomArticleWriteDocumentV1 = z.infer<typeof MachineRoomArticleWriteDocumentV1Schema>;
export type StoryArticleDocument = z.infer<typeof StoryArticleDocumentSchema>;

export function validateMachineRoomArticleDocumentReferences(input: {
  document: MachineRoomArticleDocumentV1;
  claimKeys: Iterable<string>;
  sourceKeys: Iterable<string>;
}): string[] {
  const claimKeys = new Set([...input.claimKeys].map((item) => item.trim()).filter(Boolean));
  const sourceKeys = new Set([...input.sourceKeys].map((item) => item.trim()).filter(Boolean));
  const errors: string[] = [];

  function checkRichText(text: MachineRoomArticleRichText, location: string) {
    for (const [spanIndex, span] of text.entries()) {
      for (const mark of span.marks ?? []) {
        if (mark.type === "claimRef" && !claimKeys.has(mark.claimId)) {
          errors.push(`${location}.text[${spanIndex}] references unknown claimId '${mark.claimId}'`);
        }
        if (mark.type === "sourceRef" && !sourceKeys.has(mark.sourceKey)) {
          errors.push(`${location}.text[${spanIndex}] references unknown sourceKey '${mark.sourceKey}'`);
        }
      }
    }
  }

  function checkSourceRefs(sourceRefs: string[] | undefined, location: string) {
    for (const sourceRef of sourceRefs ?? []) {
      if (!sourceKeys.has(sourceRef)) {
        errors.push(`${location} references unknown sourceKey '${sourceRef}'`);
      }
    }
  }

  for (const [blockIndex, block] of input.document.blocks.entries()) {
    const location = `blocks[${blockIndex}]`;
    switch (block.type) {
      case "heading":
      case "paragraph":
      case "callout":
        checkRichText(block.text, location);
        break;
      case "list":
        block.items.forEach((item, itemIndex) => checkRichText(item, `${location}.items[${itemIndex}]`));
        break;
      case "quote":
        checkRichText(block.text, location);
        checkSourceRefs(block.sourceRefs, `${location}.sourceRefs`);
        break;
      case "image":
        if (block.caption) checkRichText(block.caption, `${location}.caption`);
        checkSourceRefs(block.sourceRefs, `${location}.sourceRefs`);
        break;
      case "embed":
        if (block.caption) checkRichText(block.caption, `${location}.caption`);
        break;
      case "table":
        checkSourceRefs(block.sourceRefs, `${location}.sourceRefs`);
        break;
      case "timeline":
        block.events.forEach((event, eventIndex) => {
          checkRichText(event.text, `${location}.events[${eventIndex}]`);
          checkSourceRefs(event.sourceRefs, `${location}.events[${eventIndex}].sourceRefs`);
        });
        break;
      case "factBox":
        block.items.forEach((item, itemIndex) => checkRichText(item, `${location}.items[${itemIndex}]`));
        checkSourceRefs(block.sourceRefs, `${location}.sourceRefs`);
        break;
    }
  }

  return errors;
}

export const MachineRoomAgentCandidateClaimSchema = z.object({
  id: z.string().min(1).max(200).optional(),
  text: z.string().min(1).max(5000),
  citations: z.array(z.string().min(1).max(500)).min(1).max(20)
});

export const MachineRoomAgentCandidateSourceSchema = z.object({
  sourceKey: z.string().min(1).max(200).optional(),
  sourceName: z.string().min(1).max(200).optional(),
  url: z.string().url().max(2048).refine(isMachineRoomSafePublicLinkUrl, {
    message: "url must use http:// or https://"
  }),
  title: z.string().min(1).max(500).optional(),
  excerpt: z.string().max(5000).optional(),
  publishedAt: z.string().datetime().optional()
});

export const MachineRoomAgentCandidateExternalReferenceSchema = z
  .object({
    id: z.string().min(1).max(200).optional(),
    url: z
      .string()
      .url()
      .max(2048)
      .refine(isMachineRoomSafePublicLinkUrl, {
        message: "url must use http:// or https://"
      })
      .optional()
  })
  .strict();

export const MachineRoomAgentCandidateCreateRequestSchema = z
  .object({
    botId: z.string().min(1).max(2048),
    verified: z.boolean().optional(),
    linkedHumanId: z.string().min(1).max(200).optional(),
    room: z.string().min(1).max(120),
    language: SupportedLanguageSchema,
    articleType: MachineRoomArticleTypeSchema.optional(),
    title: z.string().min(1).max(500),
    dek: z.string().min(1).max(1000).optional(),
    summary: z.array(z.string().min(1).max(500)).min(1).max(10),
    article: MachineRoomArticleWriteDocumentSchema.optional(),
    claims: z.array(MachineRoomAgentCandidateClaimSchema).min(1).max(50),
    sources: z.array(MachineRoomAgentCandidateSourceSchema).min(1).max(50),
    lane: z.enum(["breaking", "standard", "deep"]).optional(),
    externalReference: MachineRoomAgentCandidateExternalReferenceSchema.optional()
  })
  .strict();

export type MachineRoomAgentCandidateClaim = z.infer<typeof MachineRoomAgentCandidateClaimSchema>;
export type MachineRoomAgentCandidateSource = z.infer<typeof MachineRoomAgentCandidateSourceSchema>;
export type MachineRoomAgentCandidateExternalReference = z.infer<
  typeof MachineRoomAgentCandidateExternalReferenceSchema
>;
export type MachineRoomAgentCandidateCreateRequest = z.infer<typeof MachineRoomAgentCandidateCreateRequestSchema>;

export const ModuleItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  href: z.string().min(1)
});

export const PublicReadStatusSchema = z.object({
  degraded: z.boolean(),
  reason: z.literal("api_unavailable"),
  upstreamPath: z.string().min(1),
  httpStatus: z.number().int().positive().optional()
});

export const HomeResponseSchema = z.object({
  language: SupportedLanguageSchema,
  labels: z.record(z.string()),
  topNav: z.array(z.string()),
  leftRooms: z.array(RoomDescriptorSchema),
  modules: z.object({
    developing: z.array(ModuleItemSchema),
    underReview: z.array(ModuleItemSchema),
    ledger: z.array(ModuleItemSchema),
    rewardWindow: z.array(ModuleItemSchema)
  }),
  publicReadStatus: PublicReadStatusSchema.optional()
});

export type ModuleItem = z.infer<typeof ModuleItemSchema>;
export type PublicReadStatus = z.infer<typeof PublicReadStatusSchema>;
export type HomeResponse = z.infer<typeof HomeResponseSchema>;

export const RewardsRibbonStateSchema = z.enum(["inactive", "active", "achieved"]);
export type RewardsRibbonState = z.infer<typeof RewardsRibbonStateSchema>;

export const FeedItemSchema = z.object({
  storyId: z.string().min(1),
  clusterId: z.string().min(1),
  title: z.string().min(1),
  room: RoomIdSchema,
  language: z.string().min(1),
  state: StoryStateSchema,
  editorialState: EditorialStateSchema,
  promotionState: PromotionStateSchema,
  publicationStage: StoryPublicationStageSchema,
  reviewStatus: StoryReviewStatusSchema,
  updatedAt: z.string().min(1),
  summary: z.array(z.string()),
  sourceCount: z.number().int().nonnegative(),
  rewardsRibbonState: RewardsRibbonStateSchema.optional(),
  translation: TranslationMetadataSchema.optional()
});

export const FeedResponseSchema = paginatedResultSchema(FeedItemSchema).extend({
  publicReadStatus: PublicReadStatusSchema.optional()
});

export type FeedItem = z.infer<typeof FeedItemSchema>;
export type FeedResponse = z.infer<typeof FeedResponseSchema>;

export const V2StoriesDataSchema = FeedResponseSchema.strict();
export const V2StoriesResponseSchema = apiSuccessSchema(V2StoriesDataSchema);

export type V2StoriesData = z.infer<typeof V2StoriesDataSchema>;
export type V2StoriesResponse = z.infer<typeof V2StoriesResponseSchema>;

export const StoryDetailSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  state: StoryStateSchema,
  editorialState: EditorialStateSchema,
  promotionState: PromotionStateSchema,
  publicationStage: StoryPublicationStageSchema,
  reviewStatus: StoryReviewStatusSchema,
  supersededByStoryId: z.string().min(1).nullable().optional(),
  room: RoomIdSchema,
  language: z.string().min(1),
  summary: z.array(z.string()),
  claimReferences: z.array(z.object({
    id: z.string().min(1),
    key: z.string().min(1).optional(),
    text: z.string().min(1)
  })).optional(),
  rewardsRibbonState: RewardsRibbonStateSchema.optional(),
  article: StoryArticleDocumentSchema.optional(),
  translation: TranslationMetadataSchema.optional()
});

export type StoryDetail = z.infer<typeof StoryDetailSchema>;

export const StoryVersionSchema = z.object({
  id: z.string().min(1),
  state: z.string().min(1),
  reason: z.string().min(1).optional(),
  changedAt: z.string().min(1),
  revisionHash: z.string().min(1).optional(),
  packetId: z.string().min(1).optional(),
  packetHash: z.string().min(1).optional(),
  gateOneV2PublicTrustReceiptEligible: z.boolean().optional(),
  revisionEpoch: z.number().int().nonnegative().optional(),
  materiality: z.string().min(1).optional(),
  applyMode: z.string().min(1).optional(),
  appliedByProposalId: z.string().min(1).optional(),
  correctionReason: z.string().min(1).optional(),
  createdByBotId: z.string().min(1).optional(),
  current: z.boolean().optional()
});

export const StoryVersionsResponseSchema = z.object({
  storyId: z.string().min(1),
  versions: z.array(StoryVersionSchema)
});

export type StoryVersion = z.infer<typeof StoryVersionSchema>;
export type StoryVersionsResponse = z.infer<typeof StoryVersionsResponseSchema>;

const GateOneV2ShadowAdvisoryLaneSchema = z
  .object({
    lane: z.enum(["FAIRNESS_REPLY", "PROVENANCE_AUTH", "EDITORIAL_INTEGRITY"]),
    runId: z.string().min(1),
    mode: z.literal("SHADOW"),
    policyVersion: z.string().min(1),
    policyDigest: z.string().min(1),
    rubricVersion: z.string().min(1),
    verdict: z.enum(["PASS", "PASS_WITH_DISCLOSURE", "REVISE", "QUARANTINE", "BLOCK", "UNAVAILABLE"]),
    deterministicInputHash: z.string().min(1),
    implementationVersion: z.string().min(1),
    publicRationale: z.string(),
    requiredDisclosureIds: z.array(z.string()),
    requiredSpecialistTypes: z.array(z.enum(["LEGAL_RIGHTS", "DOMAIN_EXPERT", "VISUAL_FORENSICS", "LOCAL_LANGUAGE_CONTEXT", "DATA_METHODOLOGY"])),
    checks: z.array(
      z
        .object({
          checkId: z.string().min(1),
          status: z.string().min(1),
          severity: z.string().min(1),
          claimIds: z.array(z.string()),
          evidenceIds: z.array(z.string()),
          objectRefs: z.array(z.string()),
          publicRationale: z.string(),
          requiredAction: z.string().min(1).optional(),
          requiredDisclosureIds: z.array(z.string()),
          requiredSpecialistTypes: z.array(z.string())
        })
        .strict()
    ),
    createdAt: z.string().min(1)
  })
  .strict();

export const GateOneV2ShadowAdvisoryReceiptSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    advisoryOnly: z.literal(true),
    redactionVersion: z.literal("gate-one-v2-shadow-advisory-public-v1"),
    storyId: z.string().min(1),
    packetId: z.string().min(1),
    packetHash: z.string().min(1),
    generatedAt: z.string().min(1),
    publicationEffect: z.literal("NONE"),
    lanes: z.array(GateOneV2ShadowAdvisoryLaneSchema),
    receiptHash: z.string().regex(/^sha256:[a-f0-9]{64}$/)
  })
  .strict();

export type GateOneV2ShadowAdvisoryReceipt = z.infer<typeof GateOneV2ShadowAdvisoryReceiptSchema>;

export const GateOneV2ConsensusReceiptSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    advisoryOnly: z.literal(true),
    redactionVersion: z.literal("gate-one-v2-consensus-public-v1"),
    storyId: z.string().min(1),
    packetId: z.string().min(1),
    packetHash: z.string().min(1),
    generatedAt: z.string().min(1),
    publicationEffect: z.literal("NONE"),
    consensus: z
      .object({
        evaluationId: z.string().min(1),
        mode: z.literal("SHADOW"),
        policyVersion: z.string().min(1),
        policyDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
        profile: z.string().min(1),
        terminalStatus: z.enum(["WOULD_ALLOW", "PENDING", "BLOCKED"]),
        terminalStep: z.enum([
          "PACKET_CURRENTNESS",
          "POLICY_VERSION",
          "PREFLIGHTS",
          "SPECIALIST_REQUIREMENTS",
          "REVIEW_ELIGIBILITY",
          "DISCLOSURE_RECEIPTS",
          "INDEPENDENCE",
          "HARD_VERDICTS",
          "ROLE_COUNTS",
          "OWNER_DIVERSITY",
          "TRUST_WEIGHTS",
          "HOLDS",
          "SAFETY_GATE",
          "PUBLIC_BLOCKED",
          "PUBLIC_PENDING",
          "WOULD_ALLOW"
        ]),
        wouldAllowPublication: z.boolean(),
        approved: z.boolean(),
        blocked: z.boolean(),
        targetState: z.string().min(1),
        reasonCodes: z.array(z.string().min(1)),
        selectedReviewCount: z.number().int().nonnegative(),
        safetyDecision: z.enum(["ALLOW", "BLOCK", "QUARANTINE", "UNAVAILABLE"]).optional(),
        activeLegalHold: z.boolean(),
        trustWeightPolicyApplied: z.boolean(),
        approvalWeight: z.number().nonnegative().optional(),
        requiredApprovalWeight: z.number().nonnegative().optional(),
        trustWeightSatisfied: z.boolean().optional(),
        deterministicTraceHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
        implementationVersion: z.string().min(1),
        evaluatedAt: z.string().min(1)
      })
      .strict(),
    receiptHash: z.string().regex(/^sha256:[a-f0-9]{64}$/)
  })
  .strict();

export type GateOneV2ConsensusReceipt = z.infer<typeof GateOneV2ConsensusReceiptSchema>;

const Sha256DigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const Sha256HexSchema = z.string().regex(/^[a-f0-9]{64}$/i);
const GateOneV2PolicyGlobalStateSchema = z.enum(["DISABLED", "OBSERVE", "SHADOW", "WARN", "ENFORCE"]);
const GateOneV2SafetyDecisionSchema = z.enum(["ALLOW", "BLOCK", "QUARANTINE", "UNAVAILABLE"]);
const GateOneV2PublicationEffectSchema = z.literal("NONE");
const GateOneV2PublishEnforcementEffectSchema = z.enum(["NONE", "V2_ENFORCED"]);

export const PublishComputeRequestSchema = z
  .object({
    forceRescan: z.boolean().optional(),
    lane: z.enum(["breaking", "standard", "deep"]).optional()
  })
  .strict();

export const GateOneV2SafetyGateHandoffSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    mode: z.literal("SHADOW"),
    publicationEffect: GateOneV2PublicationEffectSchema,
    status: z.enum(["DISABLED", "READY", "UNAVAILABLE"]),
    consensusEvaluationEnabled: z.boolean(),
    safetyGateEnforcedInV1: z.boolean(),
    v2SafetyGateRequired: z.literal(true),
    storyId: z.string().min(1),
    packetHash: Sha256DigestSchema,
    renderedSafetyDecision: GateOneV2SafetyDecisionSchema,
    consensusSafetyDecision: GateOneV2SafetyDecisionSchema,
    editorialPass: z.boolean(),
    safetyAllowsPublication: z.boolean(),
    v2EligibleAfterSafety: z.boolean(),
    consensusEvaluationRequest: z
      .object({
        path: z.string().min(1),
        body: z
          .object({
            packetHash: Sha256DigestSchema,
            safetyDecision: GateOneV2SafetyDecisionSchema
          })
          .strict()
      })
      .strict(),
    blockers: z.array(z.string().min(1))
  })
  .strict();

export const GateOneV2PublishReadinessSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    mode: z.literal("SHADOW"),
    publicationEffect: GateOneV2PublicationEffectSchema,
    advisoryOnly: z.literal(true),
    storyId: z.string().min(1),
    packetHash: Sha256DigestSchema,
    generatedAt: z.string().datetime(),
    policy: z
      .object({
        id: z.literal("gate-one-v2-mvp"),
        version: z.string().min(1),
        digest: Sha256DigestSchema,
        globalState: GateOneV2PolicyGlobalStateSchema,
        canaryPercent: z.number().min(0).max(100)
      })
      .strict(),
    enforcementRequested: z.boolean(),
    enforcementState: z.enum(["DISABLED", "REQUESTED_BUT_BLOCKED", "READY_FOR_ENFORCEMENT"]),
    enforcementActive: z.literal(false),
    controlState: z.enum(["READY", "NOT_READY"]),
    v1Publishable: z.boolean(),
    v1Blockers: z.array(z.string().min(1)),
    safetyGate: z
      .object({
        decision: GateOneV2SafetyDecisionSchema,
        allowsPublication: z.boolean()
      })
      .strict(),
    consensus: z
      .object({
        receiptHash: Sha256DigestSchema,
        evaluationId: z.string().min(1),
        policyVersion: z.string().min(1),
        policyDigest: Sha256DigestSchema,
        terminalStatus: z.enum(["WOULD_ALLOW", "PENDING", "BLOCKED"]),
        terminalStep: z.enum([
          "PACKET_CURRENTNESS",
          "POLICY_VERSION",
          "PREFLIGHTS",
          "SPECIALIST_REQUIREMENTS",
          "REVIEW_ELIGIBILITY",
          "DISCLOSURE_RECEIPTS",
          "INDEPENDENCE",
          "HARD_VERDICTS",
          "ROLE_COUNTS",
          "OWNER_DIVERSITY",
          "TRUST_WEIGHTS",
          "HOLDS",
          "SAFETY_GATE",
          "PUBLIC_BLOCKED",
          "PUBLIC_PENDING",
          "WOULD_ALLOW"
        ]),
        wouldAllowPublication: z.boolean(),
        approved: z.boolean(),
        blocked: z.boolean(),
        targetState: z.string().min(1),
        reasonCodes: z.array(z.string().min(1)),
        selectedReviewCount: z.number().int().nonnegative(),
        safetyDecision: GateOneV2SafetyDecisionSchema.optional(),
        activeLegalHold: z.boolean(),
        trustWeightPolicyApplied: z.boolean(),
        trustWeightSatisfied: z.boolean().optional(),
        evaluatedAt: z.string().datetime()
      })
      .strict()
      .nullable(),
    wouldAllowPublicationIfPolicyEnabled: z.boolean(),
    readyForPolicyPromotion: z.boolean(),
    blockers: z.array(z.string().min(1)),
    readinessHash: Sha256DigestSchema
  })
  .strict();

export const GateOneV2PublishEnforcementSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    policy: z
      .object({
        id: z.literal("gate-one-v2-mvp"),
        version: z.string().min(1),
        digest: Sha256DigestSchema,
        globalState: GateOneV2PolicyGlobalStateSchema,
        canaryPercent: z.number().min(0).max(100)
      })
      .strict(),
    enforcementRequested: z.boolean(),
    enforcementActive: z.boolean(),
    mode: z.enum(["DISABLED", "REQUESTED_BUT_BLOCKED", "ENFORCE"]),
    publicationEffect: GateOneV2PublishEnforcementEffectSchema,
    canary: z
      .object({
        configuredPercent: z.number().min(0).max(100),
        cohortPercent: z.number().min(0).max(100),
        included: z.boolean()
      })
      .strict(),
    legacyPublishable: z.boolean(),
    finalPublishable: z.boolean(),
    v2ControlsSatisfied: z.boolean(),
    safetyGateAllowsPublication: z.boolean(),
    consensusAllowsPublication: z.boolean(),
    consensusPolicyMatches: z.boolean(),
    readinessHash: Sha256DigestSchema,
    blockers: z.array(z.string().min(1))
  })
  .strict()
  .superRefine((value, ctx) => {
    const expectedV2ControlsSatisfied = value.safetyGateAllowsPublication && value.consensusAllowsPublication;
    if (value.v2ControlsSatisfied !== expectedV2ControlsSatisfied) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["v2ControlsSatisfied"],
        message: "Gate One V2 publish enforcement controls must equal SafetyGate plus consensus allow decisions"
      });
    }
    if (value.consensusAllowsPublication && !value.consensusPolicyMatches) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["consensusPolicyMatches"],
        message: "Gate One V2 consensus cannot allow publication under a mismatched policy"
      });
    }
    if (value.canary.configuredPercent !== value.policy.canaryPercent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["canary", "configuredPercent"],
        message: "Gate One V2 publish enforcement canary must match the policy canary"
      });
    }
    const expectedCanaryIncluded =
      value.canary.configuredPercent >= 100
        || (value.canary.configuredPercent > 0 && value.canary.cohortPercent < value.canary.configuredPercent);
    if (value.canary.included !== expectedCanaryIncluded) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["canary", "included"],
        message: "Gate One V2 publish enforcement canary inclusion must match the configured rollout"
      });
    }
    const stopPublishBlocked = value.blockers.includes("stop_publish_enabled");
    const expectedFinalPublishable = value.enforcementActive
      ? value.legacyPublishable && value.v2ControlsSatisfied && !stopPublishBlocked
      : value.legacyPublishable;
    if (value.finalPublishable !== expectedFinalPublishable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["finalPublishable"],
        message: "Gate One V2 publish enforcement finalPublishable must match the enforced decision model"
      });
    }
    if (value.enforcementActive) {
      if (!value.enforcementRequested) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["enforcementRequested"],
          message: "active Gate One V2 publish enforcement requires enforcementRequested=true"
        });
      }
      if (value.mode !== "ENFORCE") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["mode"],
          message: "active Gate One V2 publish enforcement requires mode=ENFORCE"
        });
      }
      if (value.publicationEffect !== "V2_ENFORCED") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["publicationEffect"],
          message: "active Gate One V2 publish enforcement requires publicationEffect=V2_ENFORCED"
        });
      }
      if (value.policy.globalState !== "ENFORCE") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["policy", "globalState"],
          message: "active Gate One V2 publish enforcement requires policy.globalState=ENFORCE"
        });
      }
      if (value.policy.canaryPercent <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["policy", "canaryPercent"],
          message: "active Gate One V2 publish enforcement requires a positive policy canary"
        });
      }
      if (!value.canary.included) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["canary", "included"],
          message: "active Gate One V2 publish enforcement requires canary inclusion"
        });
      }
      if (value.finalPublishable && value.blockers.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["blockers"],
          message: "active publishable Gate One V2 enforcement cannot carry blockers"
        });
      }
      if (!value.finalPublishable && value.blockers.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["blockers"],
          message: "active non-publishable Gate One V2 enforcement requires blockers"
        });
      }
      if (!value.legacyPublishable && !value.blockers.includes("v1_publish_not_ready")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["blockers"],
          message: "active Gate One V2 enforcement with a failed legacy gate requires v1_publish_not_ready"
        });
      }
      if (!value.safetyGateAllowsPublication && !value.blockers.includes("safety_gate_not_allow")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["blockers"],
          message: "active Gate One V2 enforcement with a failed SafetyGate requires safety_gate_not_allow"
        });
      }
      if (
        !value.consensusPolicyMatches
        && !value.blockers.includes("gate_one_v2_consensus_policy_mismatch")
        && !value.blockers.includes("gate_one_v2_consensus_evaluation_missing")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["blockers"],
          message: "active Gate One V2 enforcement with a missing or stale consensus evaluation requires a consensus policy blocker"
        });
      }
      if (
        !value.consensusAllowsPublication
        && !value.blockers.includes("gate_one_v2_consensus_not_allow")
        && !value.blockers.includes("gate_one_v2_consensus_evaluation_missing")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["blockers"],
          message: "active Gate One V2 enforcement with a failed consensus decision requires a consensus blocker"
        });
      }
      return;
    }
    if (value.mode === "ENFORCE") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mode"],
        message: "inactive Gate One V2 publish enforcement cannot report mode=ENFORCE"
      });
    }
    if (value.publicationEffect !== "NONE") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publicationEffect"],
        message: "inactive Gate One V2 publish enforcement must report publicationEffect=NONE"
      });
    }
  });

export const PublishComputeResponseSchema = z
  .object({
    candidateHash: Sha256HexSchema,
    storyId: z.string().min(1),
    editorialPass: z.boolean(),
    safetyDecision: z.enum(["ALLOW", "BLOCK", "QUARANTINE", "UNKNOWN"]),
    copyrightDecision: z.enum(["ALLOW", "QUARANTINE", "BLOCK"]),
    gateOneV2SafetyGateHandoff: GateOneV2SafetyGateHandoffSchema,
    gateOneV2PublishReadiness: GateOneV2PublishReadinessSchema,
    gateOneV2PublishEnforcement: GateOneV2PublishEnforcementSchema,
    publishable: z.boolean(),
    blockers: z.array(z.string().min(1)),
    scan: z
      .object({
        pass: z.literal("SCAN2_RENDERED"),
        hardBlock: z.boolean(),
        decisionHash: z.string().min(1),
        reasons: z.array(z.string()),
        rationale: z.string()
      })
      .strict(),
    copyrightScan: z
      .object({
        lane: z.enum(["breaking", "standard", "deep"]),
        decision: z.enum(["ALLOW", "QUARANTINE", "BLOCK"]),
        sourceCount: z.number().int().nonnegative(),
        missingSourceTextCount: z.number().int().nonnegative(),
        candidateSignatureCount: z.number().int().nonnegative(),
        maxOverlapSignatureCount: z.number().int().nonnegative(),
        maxSourceSignatureCount: z.number().int().nonnegative(),
        maxOverlapRatio: z.number().min(0),
        rationale: z.array(z.string())
      })
      .strict()
  })
  .strict()
  .superRefine((value, ctx) => {
    const enforcement = value.gateOneV2PublishEnforcement;
    if (!enforcement.enforcementActive) {
      return;
    }
    if (value.publishable !== enforcement.finalPublishable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publishable"],
        message: "active Gate One V2 enforcement requires top-level publishable to match finalPublishable"
      });
    }
    const missingBlockers = enforcement.blockers.filter((blocker) => !value.blockers.includes(blocker));
    if (missingBlockers.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["blockers"],
        message: `active Gate One V2 enforcement requires top-level blockers to include: ${missingBlockers.join(", ")}`
      });
    }
  });

export type PublishComputeRequest = z.infer<typeof PublishComputeRequestSchema>;
export type GateOneV2SafetyGateHandoff = z.infer<typeof GateOneV2SafetyGateHandoffSchema>;
export type GateOneV2PublishReadiness = z.infer<typeof GateOneV2PublishReadinessSchema>;
export type GateOneV2PublishEnforcement = z.infer<typeof GateOneV2PublishEnforcementSchema>;
export type PublishComputeResponse = z.infer<typeof PublishComputeResponseSchema>;

export const GateOneV2PreflightRunRequestSchema = z
  .object({
    packet: z.unknown(),
    promoteToCurrent: z.boolean().optional()
  })
  .strict();

export const GateOneV2PreflightRunPersistedResultSchema = z
  .object({
    id: z.string().min(1).max(160),
    storyId: z.string().min(1).max(160),
    packetHash: Sha256DigestSchema,
    contractId: GateOnePreflightContractSchema,
    contractVersion: z.string().min(1).max(80),
    policyVersion: z.string().min(1).max(80),
    verdict: GateOnePreflightVerdictSchema,
    checks: z.array(GateOnePreflightCheckResultSchema).min(1),
    requiredSpecialists: z.array(GateOneSpecialistRequirementSchema).default([]),
    requiredDisclosures: z.array(GateOneDisclosureRequirementSchema).default([]),
    deterministicInputHash: Sha256DigestSchema,
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime(),
    implementationVersion: z.string().min(1).max(120),
    externalDependencySnapshot: z.record(z.unknown()),
    persistence: z
      .object({
        packetId: z.string().min(1).max(160),
        runId: z.string().min(1).max(160)
      })
      .strict()
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
    if (
      result.verdict === "PASS_WITH_REQUIREMENTS" &&
      result.requiredDisclosures.length === 0 &&
      result.requiredSpecialists.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["verdict"],
        message: "PASS_WITH_REQUIREMENTS must include a disclosure or specialist requirement"
      });
    }
  });

export const GateOneV2PreflightRunResponseSchema = z
  .object({
    storyId: z.string().min(1).max(160),
    packetHash: Sha256DigestSchema,
    packetId: z.string().min(1).max(160),
    promotedToCurrent: z.boolean(),
    promotionBlockedReason: z.enum(["AUDIT_ONLY_DECISIONS_PRESENT"]).optional(),
    satisfiedForConsensus: z.boolean(),
    missingContractIds: z.array(GateOnePreflightContractSchema),
    failedContractIds: z.array(GateOnePreflightContractSchema),
    requiredSpecialists: z.array(GateOneSpecialistRequirementSchema),
    requiredDisclosures: z.array(GateOneDisclosureRequirementSchema),
    results: z.array(GateOneV2PreflightRunPersistedResultSchema).min(1).max(GATE_ONE_PREFLIGHT_CONTRACTS.length)
  })
  .strict()
  .superRefine((response, ctx) => {
    const seen = new Set(response.results.map((result) => result.contractId));
    const declaredMissing = new Set(response.missingContractIds);
    const declaredFailed = new Set(response.failedContractIds);
    const missingFromResults = GATE_ONE_PREFLIGHT_CONTRACTS.filter((contractId) => !seen.has(contractId));
    const failedFromResults = response.results
      .filter((result) => result.verdict === "FAIL")
      .map((result) => result.contractId);
    for (const contractId of GATE_ONE_PREFLIGHT_CONTRACTS) {
      if (!seen.has(contractId) && !declaredMissing.has(contractId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["missingContractIds"],
          message: `Missing preflight result for ${contractId} must be declared in missingContractIds`
        });
      }
      if (seen.has(contractId) && declaredMissing.has(contractId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["missingContractIds"],
          message: `Preflight result for ${contractId} cannot also be declared missing`
        });
      }
      if (failedFromResults.includes(contractId) && !declaredFailed.has(contractId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["failedContractIds"],
          message: `Failed preflight result for ${contractId} must be declared in failedContractIds`
        });
      }
      if (!failedFromResults.includes(contractId) && declaredFailed.has(contractId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["failedContractIds"],
          message: `failedContractIds cannot include ${contractId} without a failed result`
        });
      }
    }
    if (seen.size !== response.results.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["results"],
        message: "Preflight response must include one result per contract"
      });
    }
    if (response.satisfiedForConsensus && (missingFromResults.length > 0 || failedFromResults.length > 0 || response.failedContractIds.length > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["satisfiedForConsensus"],
        message: "Satisfied preflight responses cannot have missing or failed required contracts"
      });
    }
    response.results.forEach((result, index) => {
      if (result.storyId !== response.storyId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["results", index, "storyId"],
          message: "Preflight result storyId must match the response storyId"
        });
      }
      if (result.packetHash !== response.packetHash) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["results", index, "packetHash"],
          message: "Preflight result packetHash must match the response packetHash"
        });
      }
      if (result.persistence.packetId !== response.packetId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["results", index, "persistence", "packetId"],
          message: "Preflight result persistence packetId must match the response packetId"
        });
      }
    });
  });

export type GateOneV2PreflightRunRequest = z.infer<typeof GateOneV2PreflightRunRequestSchema>;
export type GateOneV2PreflightRunPersistedResult = z.infer<typeof GateOneV2PreflightRunPersistedResultSchema>;
export type GateOneV2PreflightRunResponse = z.infer<typeof GateOneV2PreflightRunResponseSchema>;

const GateOneV2PublicTrustPreflightContractSchema = z.enum([
  "PACKET_INTEGRITY_V1",
  "PUBLICATION_QA_V1",
  "RIGHTS_ROUTING_V1",
  "LIFECYCLE_READINESS_V1"
]);
const GateOneV2PublicTrustUniversalLaneSchema = z.enum([
  "WRITER",
  "FACT_CHECK",
  "RISK",
  "SOURCE_DIVERSITY",
  "FAIRNESS_REPLY",
  "PROVENANCE_AUTH"
]);
const GateOneV2PublicTrustVerdictSchema = z.enum(["PASS", "PASS_WITH_DISCLOSURE", "REVISE", "QUARANTINE", "BLOCK", "UNAVAILABLE"]);
const GateOneV2PublicTrustSpecialistTypeSchema = z.enum([
  "LEGAL_RIGHTS",
  "DOMAIN_EXPERT",
  "VISUAL_FORENSICS",
  "LOCAL_LANGUAGE_CONTEXT",
  "DATA_METHODOLOGY"
]);

export const GateOneV2TrustReceiptSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    advisoryOnly: z.literal(true),
    redactionVersion: z.literal("gate-one-v2-public-trust-receipt-v1"),
    storyId: z.string().min(1),
    packetId: z.string().min(1),
    packetHash: z.string().min(1),
    generatedAt: z.string().min(1),
    publicationEffect: z.literal("NONE"),
    mode: z.literal("PUBLIC_ADVISORY"),
    policy: z
      .object({
        version: z.string().min(1),
        profile: z.string().min(1),
        globalState: GateOneV2PolicyGlobalStateSchema,
        canaryPercent: z.number().int().min(0).max(100)
      })
      .strict(),
    packet: z
      .object({
        current: z.boolean(),
        createdAt: z.string().min(1),
        language: z.string().min(1),
        canonicalLanguage: z.string().min(1),
        articleType: z.string().min(1),
        reportingOrigin: z.string().min(1)
      })
      .strict(),
    preflights: z.array(
      z
        .object({
          contractId: GateOneV2PublicTrustPreflightContractSchema,
          status: z.enum(["NOT_RUN", "PASS", "PASS_WITH_REQUIREMENTS", "FAIL"]),
          contractVersion: z.string().min(1).optional(),
          checkCount: z.number().int().nonnegative(),
          requiredSpecialistCount: z.number().int().nonnegative(),
          requiredDisclosureCount: z.number().int().nonnegative(),
          completedAt: z.string().min(1).optional(),
          implementationVersion: z.string().min(1).optional()
        })
        .strict()
    ),
    universalLanes: z.array(
      z
        .object({
          lane: GateOneV2PublicTrustUniversalLaneSchema,
          policyState: GateOneV2PolicyGlobalStateSchema,
          status: z.enum(["MISSING", "ATTESTED", "ADVISORY_RUN_ONLY"]),
          attestationCount: z.number().int().nonnegative(),
          latestSignedAt: z.string().min(1).optional(),
          verdicts: z.record(z.number().int().nonnegative()),
          advisoryRunVerdict: GateOneV2PublicTrustVerdictSchema.optional()
        })
        .strict()
    ),
    shadowLanes: z.array(
      z
        .object({
          lane: z.literal("EDITORIAL_INTEGRITY"),
          policyState: z.literal("SHADOW"),
          status: z.enum(["NOT_RUN", "ADVISORY_RUN_ONLY"]),
          advisoryRunVerdict: GateOneV2PublicTrustVerdictSchema.optional()
        })
        .strict()
    ),
    specialistRequirements: z
      .object({
        conditionalOnly: z.literal(true),
        status: z.enum(["NONE", "REQUIRED_BY_PREFLIGHT_OR_ADVISORY"]),
        requiredTypes: z.array(GateOneV2PublicTrustSpecialistTypeSchema),
        requiredCount: z.number().int().nonnegative()
      })
      .strict(),
    disclosures: z
      .object({
        publicDisclosureIds: z.array(z.string()),
        publicDisclosureCount: z.number().int().nonnegative(),
        renderReceiptStatus: z.literal("NOT_PUBLIC_IN_THIS_RECEIPT")
      })
      .strict(),
    claims: z
      .object({
        publicClaimCount: z.number().int().nonnegative(),
        items: z.array(
          z
            .object({
              id: z.string().min(1),
              text: z.string().min(1),
              epistemicStatus: z.string().min(1),
              confidenceLanguage: z.string().min(1),
              evidenceCount: z.number().int().nonnegative(),
              counterevidenceCount: z.number().int().nonnegative()
            })
            .strict()
        )
      })
      .strict(),
    provenance: z
      .object({
        publicSourceCount: z.number().int().nonnegative(),
        publicEvidenceCount: z.number().int().nonnegative(),
        graphEntityCount: z.number().int().nonnegative(),
        graphActivityCount: z.number().int().nonnegative(),
        graphAgentCount: z.number().int().nonnegative(),
        graphAlternative: z
          .object({
            summary: z.string().min(1).max(500),
            publicEvidenceLimit: z.number().int().positive().max(50),
            publicEvidenceShown: z.number().int().nonnegative().max(50),
            publicEvidenceTruncated: z.boolean(),
            items: z.array(
              z
                .object({
                  evidenceId: z.string().min(1).max(200),
                  publicSourceLabel: z.string().min(1).max(80),
                  sourceClass: z.string().min(1).max(80),
                  directness: z.string().min(1).max(80),
                  authenticityStatus: z.string().min(1).max(80),
                  publicSummary: z.string().min(1).max(2000)
                })
                .strict()
            )
          })
          .strict()
      })
      .strict(),
    fairness: z
      .object({
        affectedStakeholderCount: z.number().int().nonnegative(),
        rightOfReplyCount: z.number().int().nonnegative(),
        materialCounterevidenceCount: z.number().int().nonnegative(),
        alternativeExplanationCount: z.number().int().nonnegative(),
        knownUnknownCount: z.number().int().nonnegative(),
        fairnessExceptionCount: z.number().int().nonnegative()
      })
      .strict(),
    consensus: z
      .object({
        terminalStatus: z.enum(["WOULD_ALLOW", "PENDING", "BLOCKED"]),
        terminalStep: z.enum([
          "PACKET_CURRENTNESS",
          "POLICY_VERSION",
          "PREFLIGHTS",
          "SPECIALIST_REQUIREMENTS",
          "REVIEW_ELIGIBILITY",
          "DISCLOSURE_RECEIPTS",
          "INDEPENDENCE",
          "HARD_VERDICTS",
          "ROLE_COUNTS",
          "OWNER_DIVERSITY",
          "TRUST_WEIGHTS",
          "HOLDS",
          "SAFETY_GATE",
          "PUBLIC_BLOCKED",
          "PUBLIC_PENDING",
          "WOULD_ALLOW"
        ]),
        reasonCodes: z.array(z.string().min(1)),
        selectedReviewCount: z.number().int().nonnegative(),
        safetyDecision: z.enum(["ALLOW", "BLOCK", "QUARANTINE", "UNAVAILABLE"]).optional(),
        activeLegalHold: z.boolean(),
        receiptHash: z.string().regex(/^sha256:[a-f0-9]{64}$/)
      })
      .strict()
      .optional(),
    safety: z
      .object({
        status: z.enum(["RECORDED_IN_CONSENSUS", "UNAVAILABLE"]),
        decision: z.enum(["ALLOW", "BLOCK", "QUARANTINE", "UNAVAILABLE"]).optional()
      })
      .strict(),
    lifecycle: z
      .object({
        currentVersion: z.number().int().positive(),
        challengeRoute: z.string().min(1),
        correctionTaxonomyVersion: z.string().min(1),
        expiryPolicy: z.string().min(1),
        correctionHooksVisible: z.literal(true),
        previousVersionsPath: z.string().min(1),
        previousVersionsAvailable: z.boolean(),
        translationDependencyCount: z.number().int().nonnegative(),
        cacheInvalidationDependencyCount: z.number().int().nonnegative(),
        staleReceipt: z.boolean()
      })
      .strict(),
    receiptHash: z.string().regex(/^sha256:[a-f0-9]{64}$/)
  })
  .strict();

export type GateOneV2TrustReceipt = z.infer<typeof GateOneV2TrustReceiptSchema>;

export const MachineRoomResponseSchema = z.object({
  storyId: z.string().min(1),
  packet: z.object({
    id: z.string().min(1),
    hash: z.string().min(1),
    schemaVersion: z.number().int().positive(),
    createdAt: z.string().min(1)
  }),
  translation: TranslationMetadataSchema.optional(),
  article: StoryArticleDocumentSchema.optional(),
  claims: z.array(
    z.object({
      id: z.string().min(1),
      key: z.string().min(1).optional(),
      text: z.string().min(1),
      citations: z.array(z.string())
    })
  ),
  attestations: z.array(
    z.object({
      id: z.string().min(1),
      botId: z.string().min(1),
      verified: z.boolean(),
      linkedHumanId: z.string().min(1).optional(),
      role: z.enum(["WRITER", "FACT_CHECK", "RISK", "SOURCE_DIVERSITY"]),
      signedAt: z.string().min(1)
    })
  ),
  objections: z.array(
    z.object({
      id: z.string().min(1),
      botId: z.string().min(1),
      verified: z.boolean(),
      linkedHumanId: z.string().min(1).optional(),
      role: z.enum(["WRITER", "FACT_CHECK", "RISK", "SOURCE_DIVERSITY"]),
      severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
      reason: z.string().min(1),
      signedAt: z.string().min(1)
    })
  ),
  gateOneV2ShadowAdvisoryReceipt: GateOneV2ShadowAdvisoryReceiptSchema.optional(),
  gateOneV2ConsensusReceipt: GateOneV2ConsensusReceiptSchema.optional(),
  gateOneV2TrustReceipt: GateOneV2TrustReceiptSchema.optional(),
  gateOneV2ProofGraph: GateOnePublicProofGraphSchema.optional()
});

export type MachineRoomResponse = z.infer<typeof MachineRoomResponseSchema>;

export const AssistantOrientationActionStateSchema = z.enum([
  "available",
  "requires_agent_signed_write",
  "requires_agent_capability_discovery",
  "requires_signed_in_human",
  "requires_l2_verified_human",
  "requires_l3_verified_human",
  "unavailable"
]);
export const AssistantOrientationActionIdSchema = z.enum([
  "view_story",
  "open_machine_room",
  "open_debate",
  "comment",
  "claim_flag",
  "high_severity_flag",
  "reward_vote",
  "create_candidate",
  "attest_or_object",
  "gate_one_v2_lane_attestation",
  "submit_revision_proposal"
]);
export const AssistantOrientationActionSchema = z
  .object({
    id: AssistantOrientationActionIdSchema,
    label: z.string().min(1),
    actor: z.enum(["reader", "human", "bot"]),
    state: AssistantOrientationActionStateSchema,
    href: z.string().min(1).optional(),
    endpoint: z.string().min(1).optional(),
    requirement: z.string().min(1).optional(),
    note: z.string().min(1)
  })
  .strict();

export const AssistantOrientationEvidenceLinkSchema = z
  .object({
    id: z.enum(["story", "machine_room", "trust_receipt", "proof_graph", "debate", "sources", "versions", "consensus", "ledger"]),
    label: z.string().min(1),
    href: z.string().min(1),
    endpoint: z.string().min(1).optional()
  })
  .strict();

const AssistantOrientationHumanRewardWindowSchema = z
  .object({
    status: z.enum(["open", "frozen", "closed"]),
    active: z.boolean(),
    note: z.string().min(1)
  })
  .strict();

const AssistantOrientationAiRewardWindowSchema = z
  .object({
    status: z.enum(["open", "closed"]),
    active: z.boolean(),
    note: z.string().min(1)
  })
  .strict();

export const AssistantOrientationStorySchema = z
  .object({
    storyId: z.string().min(1),
    title: z.string().min(1),
    href: z.string().min(1),
    room: RoomIdSchema,
    language: z.string().min(1),
    state: StoryStateSchema,
    editorialState: EditorialStateSchema,
    promotionState: PromotionStateSchema,
    publicationStage: StoryPublicationStageSchema,
    reviewStatus: StoryReviewStatusSchema,
    sourceCount: z.number().int().nonnegative(),
    claimCount: z.number().int().nonnegative(),
    objectionCount: z.number().int().nonnegative(),
    verifiedAttestationCount: z.number().int().nonnegative(),
    verifiedObjectionCount: z.number().int().nonnegative(),
    criticalRiskObjectionCount: z.number().int().nonnegative(),
    rewardWindow: AssistantOrientationHumanRewardWindowSchema,
    humanRewardWindow: AssistantOrientationHumanRewardWindowSchema,
    aiRewardWindow: AssistantOrientationAiRewardWindowSchema,
    actions: z.array(AssistantOrientationActionSchema),
    evidenceLinks: z.array(AssistantOrientationEvidenceLinkSchema),
    relayHints: z.array(z.string().min(1))
  })
  .strict();

export const AssistantOrientationModuleItemSchema = z
  .object({
    storyId: z.string().min(1).optional(),
    title: z.string().min(1),
    href: z.string().min(1),
    state: StoryStateSchema.optional(),
    editorialState: EditorialStateSchema.optional(),
    promotionState: PromotionStateSchema.optional(),
    sourceCount: z.number().int().nonnegative().optional(),
    rewardWindowActive: z.boolean().optional(),
    ledgerBucket: z.enum(["agent-review", "provisional", "graduated", "under-review"]).optional(),
    eventType: z.enum(["CORRECTION", "RETRACTION", "CHALLENGE", "UPDATE"]).optional(),
    createdAt: z.string().min(1).optional()
  })
  .strict();

export const AssistantOrientationModuleSchema = z
  .object({
    id: z.enum(["trending", "recent", "graduated", "developing", "under_review", "reward_window", "ledger_updates"]),
    label: z.string().min(1),
    items: z.array(AssistantOrientationModuleItemSchema)
  })
  .strict();

export const AssistantOrientationResponseSchema = z
  .object({
    version: z.literal(1),
    mode: z.literal("orientation_only"),
    generatedAt: z.string().min(1),
    advisoryOnly: z.literal(true),
    guardrails: z.array(z.string().min(1)),
    relayHints: z.array(z.string().min(1)),
    actionCatalog: z
      .object({
        reader: z.array(AssistantOrientationActionSchema),
        human: z.array(AssistantOrientationActionSchema),
        bot: z.array(AssistantOrientationActionSchema)
      })
      .strict(),
    modules: z.array(AssistantOrientationModuleSchema),
    stories: z.array(AssistantOrientationStorySchema)
  })
  .strict();

export const StoryAssistantOrientationResponseSchema = z
  .object({
    version: z.literal(1),
    mode: z.literal("orientation_only"),
    generatedAt: z.string().min(1),
    advisoryOnly: z.literal(true),
    guardrails: z.array(z.string().min(1)),
    story: AssistantOrientationStorySchema
  })
  .strict();

export type AssistantOrientationActionState = z.infer<typeof AssistantOrientationActionStateSchema>;
export type AssistantOrientationActionId = z.infer<typeof AssistantOrientationActionIdSchema>;
export type AssistantOrientationAction = z.infer<typeof AssistantOrientationActionSchema>;
export type AssistantOrientationEvidenceLink = z.infer<typeof AssistantOrientationEvidenceLinkSchema>;
export type AssistantOrientationStory = z.infer<typeof AssistantOrientationStorySchema>;
export type AssistantOrientationModuleItem = z.infer<typeof AssistantOrientationModuleItemSchema>;
export type AssistantOrientationModule = z.infer<typeof AssistantOrientationModuleSchema>;
export type AssistantOrientationResponse = z.infer<typeof AssistantOrientationResponseSchema>;
export type StoryAssistantOrientationResponse = z.infer<typeof StoryAssistantOrientationResponseSchema>;

export const V2StoryDetailDataSchema = StoryDetailSchema.strict();
export const V2StoryDetailResponseSchema = apiSuccessSchema(V2StoryDetailDataSchema);

const V2MachineRoomContributionRoleSchema = z.enum([
  "WRITER",
  "FACT_CHECK",
  "RISK",
  "SOURCE_DIVERSITY",
  "FAIRNESS_REPLY",
  "PROVENANCE_AUTH"
]);

export const V2MachineRoomDataSchema = z
  .object({
    storyId: z.string().min(1),
    packet: z
      .object({
        id: z.string().min(1),
        hash: z.string().min(1),
        schemaVersion: z.number().int().positive(),
        createdAt: z.string().min(1)
      })
      .strict(),
    claims: z.array(
      z
        .object({
          id: z.string().min(1),
          text: z.string().min(1),
          citations: z.array(z.string())
        })
        .strict()
    ),
    attestations: z.array(
      z
        .object({
          id: z.string().min(1),
          botId: z.string().min(1),
          verified: z.boolean(),
          role: V2MachineRoomContributionRoleSchema,
          signedAt: z.string().min(1)
        })
        .strict()
    ),
    objections: z.array(
      z
        .object({
          id: z.string().min(1),
          botId: z.string().min(1),
          verified: z.boolean(),
          role: V2MachineRoomContributionRoleSchema,
          severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
          reason: z.string().min(1),
          signedAt: z.string().min(1)
        })
        .strict()
    ),
    translation: TranslationMetadataSchema.optional()
  })
  .strict();

export const V2MachineRoomResponseSchema = apiSuccessSchema(V2MachineRoomDataSchema);

export const V2AgentSourceSchema = z.enum(["self-serve"]);
export const V2AgentTrustTierSchema = z.enum(["UNVERIFIED", "VERIFIED"]);
export const V2AgentStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]);

export const V2AgentInventoryItemSchema = z
  .object({
    botId: z.string().min(1),
    source: V2AgentSourceSchema,
    status: V2AgentStatusSchema,
    trustTier: V2AgentTrustTierSchema,
    verified: z.boolean(),
    allowedActions: z.array(z.string().min(1)),
    joinedAt: z.string().datetime(),
    verifiedAt: z.string().datetime().optional(),
    suspendedAt: z.string().datetime().optional(),
    revokedAt: z.string().datetime().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .strict();

export const V2AgentsDataSchema = z
  .object({
    agents: z.array(V2AgentInventoryItemSchema)
  })
  .strict();

export const V2AgentsResponseSchema = apiSuccessSchema(V2AgentsDataSchema);

export const V2AgentDataSchema = z
  .object({
    agent: V2AgentInventoryItemSchema
  })
  .strict();

export const V2AgentResponseSchema = apiSuccessSchema(V2AgentDataSchema);

export type V2StoryDetailData = z.infer<typeof V2StoryDetailDataSchema>;
export type V2StoryDetailResponse = z.infer<typeof V2StoryDetailResponseSchema>;
export type V2MachineRoomData = z.infer<typeof V2MachineRoomDataSchema>;
export type V2MachineRoomResponse = z.infer<typeof V2MachineRoomResponseSchema>;
export type V2AgentSource = z.infer<typeof V2AgentSourceSchema>;
export type V2AgentTrustTier = z.infer<typeof V2AgentTrustTierSchema>;
export type V2AgentStatus = z.infer<typeof V2AgentStatusSchema>;
export type V2AgentInventoryItem = z.infer<typeof V2AgentInventoryItemSchema>;
export type V2AgentsData = z.infer<typeof V2AgentsDataSchema>;
export type V2AgentsResponse = z.infer<typeof V2AgentsResponseSchema>;
export type V2AgentData = z.infer<typeof V2AgentDataSchema>;
export type V2AgentResponse = z.infer<typeof V2AgentResponseSchema>;

export function parseApiError(payload: unknown): ApiError | null {
  const parsed = ApiErrorSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

export function parseV1ActionableError(payload: unknown): V1ActionableError | null {
  const parsed = V1ActionableErrorSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

export function parseMachineRoomApiError(payload: unknown): ParsedMachineRoomApiError | null {
  const v2 = ApiErrorSchema.safeParse(payload);
  if (v2.success) {
    return {
      shape: "v2",
      code: v2.data.error.code,
      message: v2.data.error.message,
      ...(v2.data.error.details !== undefined ? { details: v2.data.error.details } : {}),
      requestId: v2.data.error.requestId
    };
  }

  const v1 = V1ActionableErrorSchema.safeParse(payload);
  if (v1.success) {
    return {
      shape: "v1-actionable",
      ...(v1.data.code ? { code: v1.data.code } : {}),
      message: v1.data.message ?? v1.data.error,
      ...(v1.data.details !== undefined ? { details: v1.data.details } : {}),
      ...(v1.data.requestId ? { requestId: v1.data.requestId } : {}),
      ...(v1.data.nextAction ? { nextAction: v1.data.nextAction } : {}),
      ...(typeof v1.data.retryAfterSeconds === "number" ? { retryAfterSeconds: v1.data.retryAfterSeconds } : {}),
      ...(v1.data.docs ? { docs: v1.data.docs } : {})
    };
  }

  return null;
}
