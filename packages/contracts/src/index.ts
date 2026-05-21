import { z } from "zod";
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

export const RequestIdSchema = z.string().trim().min(1).max(128);
export type RequestId = z.infer<typeof RequestIdSchema>;

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

export const SupportedLanguageSchema = z.enum(["en", "es", "fr", "de", "zh-Hans"]);
export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>;

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

export type StoryState = z.infer<typeof StoryStateSchema>;
export type EditorialState = z.infer<typeof EditorialStateSchema>;
export type PromotionState = z.infer<typeof PromotionStateSchema>;
export type StoryPublicationStage = z.infer<typeof StoryPublicationStageSchema>;
export type StoryReviewStatus = z.infer<typeof StoryReviewStatusSchema>;

export const ModuleItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  href: z.string().min(1)
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
  })
});

export type ModuleItem = z.infer<typeof ModuleItemSchema>;
export type HomeResponse = z.infer<typeof HomeResponseSchema>;

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
  translation: TranslationMetadataSchema.optional()
});

export const FeedResponseSchema = paginatedResultSchema(FeedItemSchema);

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

export const MachineRoomResponseSchema = z.object({
  storyId: z.string().min(1),
  packet: z.object({
    id: z.string().min(1),
    hash: z.string().min(1),
    schemaVersion: z.number().int().positive(),
    createdAt: z.string().min(1)
  }),
  claims: z.array(z.object({ id: z.string().min(1), text: z.string().min(1), citations: z.array(z.string()) })),
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
  )
});

export type MachineRoomResponse = z.infer<typeof MachineRoomResponseSchema>;

export const AssistantOrientationActionStateSchema = z.enum([
  "available",
  "requires_agent_signed_write",
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
    id: z.enum(["story", "machine_room", "debate", "sources", "versions", "consensus", "ledger"]),
    label: z.string().min(1),
    href: z.string().min(1),
    endpoint: z.string().min(1).optional()
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
    rewardWindow: z
      .object({
        status: z.enum(["open", "frozen", "closed"]),
        active: z.boolean(),
        note: z.string().min(1)
      })
      .strict(),
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

const V2MachineRoomContributionRoleSchema = z.enum(["WRITER", "FACT_CHECK", "RISK", "SOURCE_DIVERSITY"]);

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
