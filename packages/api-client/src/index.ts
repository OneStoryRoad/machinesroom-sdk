import {
  AssistantOrientationResponseSchema,
  FeedResponseSchema,
  HomeResponseSchema,
  MachineRoomResponseSchema,
  PublishComputeRequestSchema,
  PublishComputeResponseSchema,
  GateOneV2PreflightRunRequestSchema,
  GateOneV2PreflightRunResponseSchema,
  GateOnePublicProofGraphSchema,
  StoryAssistantOrientationResponseSchema,
  StoryDetailSchema,
  StoryVersionsResponseSchema,
  V2AgentResponseSchema,
  V2AgentsResponseSchema,
  V2AuthSessionResponseSchema,
  V2MachineRoomResponseSchema,
  V2MeResponseSchema,
  V2ApiKeyCreateResponseSchema,
  V2ApiKeyRevocationResponseSchema,
  V2OrganizationApiKeysResponseSchema,
  V2OrganizationAuditEventsResponseSchema,
  V2OrganizationMetadataUpdateResponseSchema,
  V2OrganizationOidcSettingsResponseSchema,
  V2OrganizationOidcSettingsUpdateResponseSchema,
  V2OrganizationResponseSchema,
  V2OrganizationMembershipsMeResponseSchema,
  V2OrganizationsResponseSchema,
  V2OrganizationWorkspacesResponseSchema,
  V2OrganizationRolesResponseSchema,
  V2ServiceAccountCreateResponseSchema,
  V2ServiceAccountRevocationResponseSchema,
  V2OrganizationServiceAccountsResponseSchema,
  V2PendingWorkspaceMembershipInviteResponseSchema,
  V2PendingWorkspaceMembershipInvitesResponseSchema,
  V2StoryDetailResponseSchema,
  V2StoriesResponseSchema,
  V2UsersMeResponseSchema,
  V2WorkspaceMembershipsResponseSchema,
  V2WorkspaceMembershipsMeResponseSchema,
  V2WorkspaceMembershipInviteAcceptanceResponseSchema,
  V2WorkspaceMembershipInviteCancellationResponseSchema,
  V2WorkspaceMembershipInviteDeclineResponseSchema,
  V2WorkspaceMembershipInviteEmailUpdateResponseSchema,
  V2WorkspaceMembershipInviteResponseSchema,
  V2WorkspaceMembershipInviteResendResponseSchema,
  V2WorkspaceMembershipLeaveResponseSchema,
  V2WorkspaceMembershipReactivationResponseSchema,
  V2WorkspaceMembershipRemovalResponseSchema,
  V2WorkspaceMembershipRoleAssignmentResponseSchema,
  V2WorkspaceMembershipRoleRemovalResponseSchema,
  V2WorkspaceMembershipSuspensionResponseSchema,
  V2WorkspaceMembershipUpdateResponseSchema,
  V2WorkspaceApiKeysResponseSchema,
  V2WorkspaceAuditEventsResponseSchema,
  V2WorkspaceResponseSchema,
  V2WorkspaceRolesResponseSchema,
  V2WorkspaceServiceAccountsResponseSchema,
  type AssistantOrientationResponse,
  type FeedResponse,
  type HomeResponse,
  type IdempotencyResult,
  type MachineRoomResponse,
  type MachineRoomArticleDocumentV1,
  type PublishComputeRequest,
  type PublishComputeResponse,
  type GateOneV2PreflightRunRequest,
  type GateOneV2PreflightRunResponse,
  type GateOnePublicProofGraph,
  type StoryAssistantOrientationResponse,
  type StoryDetail,
  type StoryVersionsResponse,
  type SupportedLanguage,
  type V2AgentResponse,
  type V2AgentsResponse,
  type V2AuthSessionResponse,
  type V2MachineRoomResponse,
  type V2MeResponse,
  type V2ApiKeyCreateRequest,
  type V2ApiKeyCreateResponse,
  type V2ApiKeyRevocationResponse,
  type V2AuditActorKind,
  type V2OrganizationApiKeysResponse,
  type V2OrganizationAuditEventsResponse,
  type V2OrganizationMetadata,
  type V2OrganizationMetadataUpdateRequest,
  type V2OrganizationMetadataUpdateResponse,
  type V2OrganizationOidcProviderStatus,
  type V2OrganizationOidcSettingsUpdateRequest,
  type V2OrganizationOidcSettingsResponse,
  type V2OrganizationOidcSettingsUpdateResponse,
  type V2OrganizationResponse,
  type V2OrganizationMembershipsMeResponse,
  type V2OrganizationsResponse,
  type V2OrganizationWorkspacesResponse,
  type V2OrganizationRolesResponse,
  type V2ServiceAccountCreateRequest,
  type V2ServiceAccountCreateResponse,
  type V2ServiceAccountRevocationResponse,
  type V2OrganizationServiceAccountsResponse,
  type V2PendingWorkspaceMembershipInviteResponse,
  type V2PendingWorkspaceMembershipInvitesResponse,
  type V2StoryDetailResponse,
  type V2StoriesResponse,
  type V2UsersMeResponse,
  type V2WorkspaceMembershipsResponse,
  type V2WorkspaceMembershipsMeResponse,
  type V2WorkspaceMembershipInviteAcceptanceResponse,
  type V2WorkspaceMembershipInviteCancellationResponse,
  type V2WorkspaceMembershipInviteDeclineResponse,
  type V2WorkspaceMembershipInviteEmailUpdateRequest,
  type V2WorkspaceMembershipInviteEmailUpdateResponse,
  type V2WorkspaceMembershipInviteRequest,
  type V2WorkspaceMembershipInviteResponse,
  type V2WorkspaceMembershipInviteResendResponse,
  type V2WorkspaceMembershipLeaveResponse,
  type V2WorkspaceMembershipReactivationResponse,
  type V2WorkspaceMembershipRemovalResponse,
  type V2WorkspaceMembershipRoleAssignmentRequest,
  type V2WorkspaceMembershipRoleAssignmentResponse,
  type V2WorkspaceMembershipRoleRemovalResponse,
  type V2WorkspaceMembershipSuspensionResponse,
  type V2WorkspaceMembershipUpdateRequest,
  type V2WorkspaceMembershipUpdateResponse,
  type V2WorkspaceMembershipUpdatableStatus,
  type V2WorkspaceApiKeysResponse,
  type V2WorkspaceAuditEventsResponse,
  type V2WorkspaceResponse,
  type V2WorkspaceRolesResponse,
  type V2WorkspaceServiceAccountsResponse,
  parseMachineRoomApiError
} from "@machinesroom/contracts";
import { createRequestSignal } from "./request-signal.js";

export type {
  AssistantOrientationAction,
  AssistantOrientationEvidenceLink,
  AssistantOrientationModule,
  AssistantOrientationModuleItem,
  AssistantOrientationResponse,
  AssistantOrientationStory,
  MachineRoomArticleBlock,
  MachineRoomArticleDocumentV1,
  MachineRoomArticleRichText,
  MachineRoomArticleRichTextMark,
  MachineRoomArticleRichTextSpan,
  MachineRoomArticleType,
  PublishComputeRequest,
  PublishComputeResponse,
  GateOneV2PreflightRunRequest,
  GateOneV2PreflightRunResponse,
  GateOnePublicProofGraph,
  StoryAssistantOrientationResponse,
  StoryArticleDocument,
  V2ActorSession,
  V2AgentData,
  V2AgentInventoryItem,
  V2AgentResponse,
  V2AgentSource,
  V2AgentsData,
  V2AgentsResponse,
  V2AgentStatus,
  V2AgentTrustTier,
  V2AuthorizationMembershipGrant,
  V2AuthorizationSummary,
  V2AuthorizationUnsupportedGrantKeys,
  V2AuthSessionData,
  V2AuthSessionResponse,
  V2ServiceAccountSessionData,
  V2MeData,
  V2MeResponse,
  V2ApiKeyCreateData,
  V2ApiKeyCreateInitialData,
  V2ApiKeyCreateReplayData,
  V2ApiKeyCreateRequest,
  V2ApiKeyCreateResponse,
  V2ApiKeyRevocationData,
  V2ApiKeyRevocationResponse,
  V2ApiKeyInventoryItem,
  V2ApiKeyStatus,
  V2AuditActorKind,
  V2AuditEventInventoryItem,
  V2AuditEventsPagination,
  V2OrganizationApiKeysData,
  V2OrganizationApiKeysResponse,
  V2OrganizationAdminSummary,
  V2OrganizationAdminDetail,
  V2OrganizationAuditEventsData,
  V2OrganizationAuditEventsResponse,
  V2OrganizationData,
  V2OrganizationMembershipsMeData,
  V2OrganizationMembershipsMeResponse,
  V2OrganizationMetadata,
  V2OrganizationMetadataUpdateData,
  V2OrganizationMetadataUpdateRequest,
  V2OrganizationMetadataUpdateResponse,
  V2OrganizationOidcProviderStatus,
  V2OrganizationOidcSettings,
  V2OrganizationOidcSettingsData,
  V2OrganizationOidcSettingsResponse,
  V2OrganizationOidcSettingsUpdateData,
  V2OrganizationOidcSettingsUpdateRequest,
  V2OrganizationOidcSettingsUpdateResponse,
  V2OrganizationPlan,
  V2OrganizationResponse,
  V2OrganizationRolesData,
  V2OrganizationRolesResponse,
  V2OrganizationsData,
  V2OrganizationsResponse,
  V2OrganizationStatus,
  V2OrganizationWorkspacesData,
  V2OrganizationWorkspacesResponse,
  V2ServiceAccountCreateData,
  V2ServiceAccountCreateRequest,
  V2ServiceAccountCreateResponse,
  V2ServiceAccountRevocationData,
  V2ServiceAccountRevocationResponse,
  V2OrganizationServiceAccountsData,
  V2OrganizationServiceAccountsResponse,
  V2PendingWorkspaceMembershipInviteData,
  V2PendingWorkspaceMembershipInviteResponse,
  V2PendingWorkspaceMembershipInvitesData,
  V2PendingWorkspaceMembershipInvitesResponse,
  V2RbacRoleDefinition,
  V2StoryDetailData,
  V2StoryDetailResponse,
  V2UsersMeData,
  V2UsersMeResponse,
  V2MembershipStatus,
  V2WorkspaceMembershipInventoryItem,
  V2WorkspaceMembershipInventoryRole,
  V2WorkspaceMembershipInviteAcceptanceData,
  V2WorkspaceMembershipInviteAcceptanceResponse,
  V2WorkspaceMembershipInviteCancellationData,
  V2WorkspaceMembershipInviteCancellationResponse,
  V2WorkspaceMembershipInviteDeclineData,
  V2WorkspaceMembershipInviteDeclineResponse,
  V2WorkspaceMembershipInviteEmailUpdateData,
  V2WorkspaceMembershipInviteEmailUpdateRequest,
  V2WorkspaceMembershipInviteEmailUpdateResponse,
  V2WorkspaceMembershipInviteData,
  V2WorkspaceMembershipInviteRequest,
  V2WorkspaceMembershipInviteResponse,
  V2WorkspaceMembershipInviteResendData,
  V2WorkspaceMembershipInviteResendResponse,
  V2WorkspaceMembershipLeaveData,
  V2WorkspaceMembershipLeaveResponse,
  V2WorkspaceMembershipReactivationData,
  V2WorkspaceMembershipReactivationResponse,
  V2WorkspaceMembershipRemovalData,
  V2WorkspaceMembershipRemovalResponse,
  V2WorkspaceMembershipsData,
  V2WorkspaceMembershipsResponse,
  V2WorkspaceMembershipsMeData,
  V2WorkspaceMembershipsMeResponse,
  V2WorkspaceMembershipRoleAssignmentData,
  V2WorkspaceMembershipRoleAssignmentRequest,
  V2WorkspaceMembershipRoleAssignmentResponse,
  V2WorkspaceMembershipRoleRemovalData,
  V2WorkspaceMembershipRoleRemovalResponse,
  V2WorkspaceMembershipSuspensionData,
  V2WorkspaceMembershipSuspensionResponse,
  V2WorkspaceMembershipUpdatableStatus,
  V2WorkspaceMembershipUpdateData,
  V2WorkspaceMembershipUpdateRequest,
  V2WorkspaceMembershipUpdateResponse,
  V2MachineRoomData,
  V2MachineRoomResponse,
  V2WorkspaceApiKeysData,
  V2WorkspaceApiKeysResponse,
  V2WorkspaceAdminSummary,
  V2WorkspaceAuditEventsData,
  V2WorkspaceAuditEventsResponse,
  V2WorkspaceData,
  V2WorkspaceResponse,
  V2WorkspaceRolesData,
  V2WorkspaceRolesResponse,
  V2ServiceAccountInventoryItem,
  V2ServiceAccountStatus,
  V2WorkspaceStatus,
  V2WorkspaceServiceAccountsData,
  V2WorkspaceServiceAccountsResponse
} from "@machinesroom/contracts";

export interface MachineRoomApiClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
  requestIdFactory?: () => string;
  timeoutMs?: number;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  requestId?: string;
  cache?: RequestInit["cache"];
  signal?: AbortSignal;
  timeoutMs?: number;
}

export type AgentArticleType = "brief" | "news" | "analysis" | "explainer" | "interview" | "opinion" | "live" | "research";

export type AgentStoryRevisionProposalMateriality =
  | "TYPO"
  | "COPYEDIT"
  | "FACTUAL"
  | "SOURCE"
  | "LEGAL"
  | "BREAKING_UPDATE"
  | "FORMAT_ONLY"
  | "STRUCTURAL";

export type AgentConsensusRewardRole = "WRITER" | "FACT_CHECK" | "RISK" | "SOURCE_DIVERSITY";

export interface AgentSignedWriteRequestOptions {
  headers: Record<string, string>;
  idempotencyKey: string;
  requestId?: string;
}

export interface AgentStoryRevisionPatchOperation {
  op: "add" | "replace" | "remove";
  path: string;
  value?: unknown;
}

export interface AgentStoryRevisionProposalRequest {
  botId: string;
  verified?: boolean;
  linkedHumanId?: string;
  basePacketHash: string;
  proposedArticle?: MachineRoomArticleDocumentV1;
  article?: MachineRoomArticleDocumentV1;
  patch?: AgentStoryRevisionPatchOperation[];
  title?: string;
  dek?: string | null;
  summary?: string[];
  articleType?: AgentArticleType;
  materiality?: AgentStoryRevisionProposalMateriality;
  role?: AgentConsensusRewardRole;
  reason?: string;
  sourceEvidence?: Record<string, unknown>;
}

export interface AgentStoryRevisionProposalResponse {
  accepted: true;
  storyId: string;
  proposalId?: string;
  status: "OPEN" | "REJECTED" | "STALE" | "NEEDS_REBASE";
  basePacketHash: string;
  proposedPacketHash?: string;
  proposedRevisionHash?: string;
  currentPacketHash: string;
  currentRevisionHash?: string;
  noOp: boolean;
  recommendedNextAction: "none" | "vote";
  idempotency?: IdempotencyResult;
}

export interface AgentStoryRevisionProposalVoteRequest {
  botId: string;
  verified?: boolean;
  linkedHumanId?: string;
  role: "WRITER" | "FACT_CHECK" | "RISK" | "SOURCE_DIVERSITY" | "EDITOR" | "LEGAL" | "ADMIN";
  vote: "YES" | "NO" | "ABSTAIN";
  reason?: string;
  autoAccept?: boolean;
}

export interface AgentStoryRevisionProposalVoteResponse {
  accepted: true;
  storyId: string;
  proposalId: string;
  voteId?: string;
  proposalStatus: "OPEN" | "ACCEPTED" | "REJECTED" | "STALE" | "NEEDS_REBASE" | "WITHDRAWN" | "EXPIRED" | "SUPERSEDED";
  quorumPassed: boolean;
  revisionAccepted: boolean;
  currentPacketHash?: string;
  proposedPacketHash: string;
  proposedRevisionHash: string;
  revisionId?: string;
  packetId?: string;
  idempotency?: IdempotencyResult;
}

export interface V2AuthSessionRequestOptions {
  sessionToken?: string;
  apiKey?: string;
  requestId?: string;
}

export interface V2ProtectedReadRequestOptions {
  sessionToken: string;
  requestId?: string;
}

export interface V2ProtectedActorReadRequestOptions {
  sessionToken?: string;
  apiKey?: string;
  requestId?: string;
}

export interface V2AuditEventsFilterRequestOptions {
  actorKind?: V2AuditActorKind;
  actorId?: string;
  actorUserId?: string;
  actorServiceAccountId?: string;
  agentId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  /** Filters audit rows by the request id stored on the audit event. */
  auditRequestId?: string;
  traceId?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export interface V2StoryReadRequestOptions extends V2ProtectedReadRequestOptions {
  storyId: string;
}

export interface V2StoriesRequestOptions extends V2ProtectedReadRequestOptions {
  room?: string;
  language?: SupportedLanguage;
  cursor?: string;
  mode?: "trending" | "graduated" | "developing" | "recent";
}

export interface V2AgentListRequestOptions extends V2ProtectedReadRequestOptions {
  limit?: number;
}

export interface V2AgentRequestOptions extends V2ProtectedReadRequestOptions {
  botId: string;
}

export interface V2OperationsRequestOptions {
  operationsToken: string;
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface PublishComputeRequestOptions extends V2OperationsRequestOptions {
  candidateHash: string;
  forceRescan?: PublishComputeRequest["forceRescan"];
  lane?: PublishComputeRequest["lane"];
}

export interface GateOneV2PreflightRunOptions extends V2OperationsRequestOptions {
  storyId: string;
  packet: GateOneV2PreflightRunRequest["packet"];
  promoteToCurrent?: GateOneV2PreflightRunRequest["promoteToCurrent"];
}

export type GateOneV2ConsensusSafetyDecision = "ALLOW" | "BLOCK" | "QUARANTINE" | "UNAVAILABLE";
export type GateOneV2ConsensusMode = "SHADOW";
export type GateOneV2ConsensusPublicationEffect = "NONE";
export type GateOneV2ConsensusTerminalStatus = "WOULD_ALLOW" | "PENDING" | "BLOCKED";
export type GateOneV2ConsensusTerminalStep =
  | "PACKET_CURRENTNESS"
  | "POLICY_VERSION"
  | "PREFLIGHTS"
  | "SPECIALIST_REQUIREMENTS"
  | "REVIEW_ELIGIBILITY"
  | "DISCLOSURE_RECEIPTS"
  | "INDEPENDENCE"
  | "HARD_VERDICTS"
  | "ROLE_COUNTS"
  | "OWNER_DIVERSITY"
  | "TRUST_WEIGHTS"
  | "HOLDS"
  | "SAFETY_GATE"
  | "WOULD_ALLOW";

export interface GateOneV2DisclosureReceiptVerifyRequestOptions extends V2OperationsRequestOptions {
  storyId: string;
  packetHash?: string;
  requirementId: string;
  renderedArtifactHash: string;
  renderTarget: string;
  renderedTextHash: string;
  rendererVersion: string;
  verifiedAt?: string;
}

export interface GateOneV2DisclosureRenderReceipt {
  id: string;
  storyId: string;
  packetId: string;
  packetHash: string;
  requirementId: string;
  renderedArtifactHash: string;
  renderTarget: string;
  renderedTextHash: string;
  rendererVersion: string;
  verifiedAt: string;
  invalidatedAt?: string | null;
  invalidationReason?: string | null;
}

export interface GateOneV2DisclosureReceiptVerifyResponse {
  storyId: string;
  packetId: string;
  packetHash: string;
  publicationEffect: GateOneV2ConsensusPublicationEffect;
  receipt: GateOneV2DisclosureRenderReceipt;
}

export interface GateOneV2ConsensusEvaluateRequestOptions extends V2OperationsRequestOptions {
  storyId: string;
  packetHash?: string;
  safetyDecision?: GateOneV2ConsensusSafetyDecision;
  activeLegalHold?: boolean;
  killSwitchActive?: boolean;
  evaluatedAt?: string;
}

export interface GateOneProofGraphPublicRequestOptions extends ApiRequestOptions {
  storyId: string;
  packetHash?: string;
  limit?: number;
  cursor?: string;
}

export type GateOneProofGraphPublicExport = Record<string, unknown>;

export interface GateOneProofGraphRebuildRequestOptions extends V2OperationsRequestOptions {
  storyId: string;
  packetHash?: string;
}

export interface GateOneProofGraphInternalReadOptions extends V2OperationsRequestOptions {
  storyId?: string;
  id?: string;
  packetHash?: string;
  fromPacketHash?: string;
  toPacketHash?: string;
  cursor?: string;
  includePrivate?: boolean;
  includeSealed?: boolean;
  includeInvalidated?: boolean;
  limit?: number;
}

export interface GateOneV2ConsensusEvaluation {
  id: string;
  storyId: string;
  packetId: string;
  packetHash: string;
  policyVersion: string;
  profile: string;
  approved: boolean;
  blocked: boolean;
  targetState: string;
  reasonCodes: string[];
  selectedReviewIds: string[];
  tracePublic: Record<string, unknown>;
  traceSealedRef?: string | null;
  safetyDecision?: GateOneV2ConsensusSafetyDecision;
  activeLegalHold: boolean;
  evaluatedAt: string;
  invalidatedAt?: string | null;
  invalidationReason?: string | null;
}

export interface GateOneV2ConsensusTrace extends Record<string, unknown> {
  trustWeightPolicyApplied: boolean;
}

export interface GateOneV2ConsensusOutcome {
  schemaVersion: "2.0";
  mode: GateOneV2ConsensusMode;
  publicationEffect: GateOneV2ConsensusPublicationEffect;
  terminalStatus: GateOneV2ConsensusTerminalStatus;
  terminalStep: GateOneV2ConsensusTerminalStep;
  wouldAllowPublication: boolean;
  reasons: Array<Record<string, unknown>>;
  trace: GateOneV2ConsensusTrace;
  deterministicTraceHash: string;
  implementationVersion: string;
}

export interface GateOneV2ConsensusEvaluateResponse {
  storyId: string;
  packetId: string;
  packetHash: string;
  mode: GateOneV2ConsensusMode;
  publicationEffect: GateOneV2ConsensusPublicationEffect;
  evaluation: GateOneV2ConsensusEvaluation;
  outcome: GateOneV2ConsensusOutcome;
}

export interface V2PendingWorkspaceMembershipInviteRequestOptions extends V2ProtectedReadRequestOptions {
  membershipId: string;
}

export interface V2OrganizationMembershipsMeRequestOptions extends V2ProtectedReadRequestOptions {
  organizationId: string;
}

export type V2OrganizationsRequestOptions = V2ProtectedReadRequestOptions;

export interface V2OrganizationRequestOptions extends V2ProtectedReadRequestOptions {
  organizationId: string;
}

export interface V2UpdateOrganizationMetadataRequestOptions extends V2OrganizationRequestOptions {
  metadata: V2OrganizationMetadata;
  idempotencyKey: string;
}

export interface V2UpdateOrganizationOidcSettingsRequestOptions extends V2OrganizationRequestOptions {
  status: V2OrganizationOidcProviderStatus;
  providerName?: string;
  issuer?: string;
  clientId?: string;
  clientSecretEnvVarName?: string;
  allowedDomains?: string[];
  jitProvisioningEnabled?: boolean;
  idempotencyKey: string;
}

export interface V2OrganizationWorkspacesRequestOptions extends V2ProtectedReadRequestOptions {
  organizationId: string;
}

export interface V2WorkspaceRequestOptions extends V2ProtectedReadRequestOptions {
  organizationId: string;
  workspaceId: string;
}

export interface V2OrganizationAuditEventsRequestOptions
  extends V2ProtectedActorReadRequestOptions,
    V2AuditEventsFilterRequestOptions {
  organizationId: string;
  cursor?: string;
  limit?: number;
}

export interface V2CreateOrganizationServiceAccountRequestOptions
  extends V2OrganizationMembershipsMeRequestOptions {
  name: string;
  idempotencyKey: string;
}

export interface V2RevokeOrganizationServiceAccountRequestOptions
  extends V2OrganizationMembershipsMeRequestOptions {
  serviceAccountId: string;
  idempotencyKey: string;
}

export interface V2CreateOrganizationApiKeyRequestOptions extends V2OrganizationMembershipsMeRequestOptions {
  name: string;
  serviceAccountId: string;
  expiresAt?: string;
  idempotencyKey: string;
}

export interface V2RevokeOrganizationApiKeyRequestOptions extends V2OrganizationMembershipsMeRequestOptions {
  apiKeyId: string;
  idempotencyKey: string;
}

export interface V2WorkspaceMembershipsMeRequestOptions extends V2OrganizationMembershipsMeRequestOptions {
  workspaceId: string;
}

export interface V2WorkspaceAuditEventsRequestOptions
  extends V2ProtectedActorReadRequestOptions,
    V2AuditEventsFilterRequestOptions {
  organizationId: string;
  workspaceId: string;
  cursor?: string;
  limit?: number;
}

export interface V2CreateWorkspaceServiceAccountRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  name: string;
  idempotencyKey: string;
}

export interface V2RevokeWorkspaceServiceAccountRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  serviceAccountId: string;
  idempotencyKey: string;
}

export interface V2CreateWorkspaceApiKeyRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  name: string;
  serviceAccountId: string;
  expiresAt?: string;
  idempotencyKey: string;
}

export interface V2RevokeWorkspaceApiKeyRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  apiKeyId: string;
  idempotencyKey: string;
}

export interface V2InviteWorkspaceMembershipRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  email: string;
  displayName?: string;
  idempotencyKey: string;
}

export interface V2CancelWorkspaceMembershipInviteRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  membershipId: string;
  idempotencyKey: string;
}

export interface V2ResendWorkspaceMembershipInviteRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  membershipId: string;
  idempotencyKey: string;
}

export interface V2UpdateWorkspaceMembershipInviteEmailRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  membershipId: string;
  invitedEmail: string;
  idempotencyKey: string;
}

export interface V2AcceptWorkspaceMembershipInviteRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  membershipId: string;
  idempotencyKey: string;
}

export interface V2DeclineWorkspaceMembershipInviteRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  membershipId: string;
  idempotencyKey: string;
}

export interface V2AssignWorkspaceMembershipRoleRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  membershipId: string;
  roleId: string;
  idempotencyKey: string;
}

export interface V2RemoveWorkspaceMembershipRoleRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  membershipId: string;
  roleId: string;
  idempotencyKey: string;
}

export interface V2RemoveWorkspaceMembershipRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  membershipId: string;
  idempotencyKey: string;
}

export interface V2UpdateWorkspaceMembershipRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  membershipId: string;
  status: V2WorkspaceMembershipUpdatableStatus;
  idempotencyKey: string;
}

export interface V2LeaveWorkspaceMembershipRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  idempotencyKey: string;
}

export interface V2SuspendWorkspaceMembershipRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  membershipId: string;
  idempotencyKey: string;
}

export interface V2ReactivateWorkspaceMembershipRequestOptions extends V2WorkspaceMembershipsMeRequestOptions {
  membershipId: string;
  idempotencyKey: string;
}

export interface MachineRoomApiErrorDocs {
  bots?: string | undefined;
  skill?: string | undefined;
  openapi?: string | undefined;
}

export class MachineRoomApiClientError extends Error {
  status: number;
  code?: string;
  requestId?: string;
  details?: unknown;
  nextAction?: string;
  retryAfterSeconds?: number;
  docs?: MachineRoomApiErrorDocs;
  responseBody: unknown;

  constructor(args: {
    message: string;
    status: number;
    code?: string;
    requestId?: string;
    details?: unknown;
    nextAction?: string;
    retryAfterSeconds?: number;
    docs?: MachineRoomApiErrorDocs;
    responseBody: unknown;
  }) {
    super(args.message);
    this.name = "MachineRoomApiClientError";
    this.status = args.status;
    if (args.code) {
      this.code = args.code;
    }
    if (args.requestId) {
      this.requestId = args.requestId;
    }
    if (args.details !== undefined) {
      this.details = args.details;
    }
    if (args.nextAction) {
      this.nextAction = args.nextAction;
    }
    if (typeof args.retryAfterSeconds === "number") {
      this.retryAfterSeconds = args.retryAfterSeconds;
    }
    if (args.docs) {
      this.docs = args.docs;
    }
    this.responseBody = args.responseBody;
  }
}

function joinUrl(baseUrl: string, path: string): string {
  return new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
}

function buildQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params)
    .map(([key, value]) => [key, value?.trim()] as const)
    .filter((entry): entry is readonly [string, string] => typeof entry[1] === "string" && entry[1].length > 0);
  if (entries.length === 0) return "";
  return `?${entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")}`;
}

function buildV2AuditEventsQuery(
  options: V2AuditEventsFilterRequestOptions & { cursor?: string; limit?: number }
): string {
  return buildQuery({
    ...(options.limit !== undefined ? { limit: String(options.limit) } : {}),
    cursor: options.cursor,
    actorKind: options.actorKind,
    actorId: options.actorId,
    actorUserId: options.actorUserId,
    actorServiceAccountId: options.actorServiceAccountId,
    agentId: options.agentId,
    action: options.action,
    resourceType: options.resourceType,
    resourceId: options.resourceId,
    requestId: options.auditRequestId,
    traceId: options.traceId,
    createdAtFrom: options.createdAtFrom,
    createdAtTo: options.createdAtTo
  });
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  const mediaType = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  const text = await response.text();
  if (mediaType === "application/json" || mediaType.endsWith("+json")) {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  return text;
}

function resolveRequestId(input: {
  explicit: string | undefined;
  factory: (() => string) | undefined;
}): string | undefined {
  const explicit = input.explicit?.trim();
  if (explicit) return explicit;
  return input.factory?.();
}

function buildV2SessionHeaders(sessionToken: string | undefined): Record<string, string> {
  const token = sessionToken?.trim();
  return token ? { "x-user-session-token": token } : {};
}

function buildV2AuthHeaders(options: { sessionToken?: string; apiKey?: string }): Record<string, string> {
  const sessionToken = options.sessionToken?.trim();
  const apiKey = options.apiKey?.trim();
  if (sessionToken && apiKey) {
    throw new Error("Provide either a V2 sessionToken or apiKey, not both");
  }
  if (apiKey) return { "x-api-key": apiKey };
  return buildV2SessionHeaders(sessionToken);
}

function buildV2OperationsHeaders(options: { operationsToken: string }): Record<string, string> {
  const operationsToken = options.operationsToken.trim();
  if (!operationsToken) {
    throw new Error("operationsToken is required");
  }
  return { "x-operations-token": operationsToken };
}

const V2_AUTH_HEADER_NAMES = new Set(["authorization", "x-api-key", "x-user-session-token", "x-operations-token"]);

function hasExplicitV2AuthHeader(headers: Record<string, string> | undefined): boolean {
  return Object.keys(headers ?? {}).some((name) => V2_AUTH_HEADER_NAMES.has(name.toLowerCase()));
}

function stripV2AuthHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).filter(([name]) => !V2_AUTH_HEADER_NAMES.has(name.toLowerCase()))
  );
}

export class MachineRoomApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly headers: Record<string, string>;
  private readonly requestIdFactory: (() => string) | undefined;
  private readonly timeoutMs: number | undefined;

  constructor(options: MachineRoomApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.fetchImpl = options.fetch ?? fetch;
    this.headers = {
      accept: "application/json",
      ...(options.headers ?? {})
    };
    this.requestIdFactory = options.requestIdFactory;
    this.timeoutMs = options.timeoutMs;
  }

  async requestJson<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const method = options.method ?? "GET";
    const defaultHeaders =
      options.headers && (path.startsWith("/v2/") || hasExplicitV2AuthHeader(options.headers))
        ? stripV2AuthHeaders(this.headers)
        : this.headers;
    const headers: Record<string, string> = {
      ...defaultHeaders,
      ...(options.headers ?? {})
    };
    const requestId = resolveRequestId({ explicit: options.requestId, factory: this.requestIdFactory });
    if (requestId) {
      headers["x-request-id"] = requestId;
    }
    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }

    const init: RequestInit = {
      method,
      headers,
      ...(options.cache ? { cache: options.cache } : {})
    };
    if (options.body !== undefined) {
      headers["content-type"] = headers["content-type"] ?? "application/json";
      init.body = JSON.stringify(options.body);
    }

    const requestTimeoutMs = options.timeoutMs ?? this.timeoutMs;
    const requestSignal = createRequestSignal({
      ...(options.signal ? { signal: options.signal } : {}),
      ...(typeof requestTimeoutMs === "number" ? { timeoutMs: requestTimeoutMs } : {})
    });
    if (requestSignal.signal) {
      init.signal = requestSignal.signal;
    }

    try {
      const response = await this.fetchImpl(joinUrl(this.baseUrl, path), init);
      const payload = await readResponsePayload(response);
      if (!response.ok) {
        const apiError = parseMachineRoomApiError(payload);
        const retryAfterHeader = response.headers.get("retry-after");
        const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : undefined;
        const responseRequestId = response.headers.get("x-request-id") ?? apiError?.requestId ?? requestId;
        throw new MachineRoomApiClientError({
          message: apiError?.message ?? `MachineRoom API request failed with status ${response.status}`,
          status: response.status,
          ...(apiError?.code ? { code: apiError.code } : {}),
          ...(responseRequestId ? { requestId: responseRequestId } : {}),
          ...(apiError?.details !== undefined ? { details: apiError.details } : {}),
          ...(apiError?.nextAction ? { nextAction: apiError.nextAction } : {}),
          ...(typeof apiError?.retryAfterSeconds === "number" ? { retryAfterSeconds: apiError.retryAfterSeconds } : {}),
          ...(Number.isFinite(retryAfterSeconds) && typeof retryAfterSeconds === "number" ? { retryAfterSeconds } : {}),
          ...(apiError?.docs ? { docs: apiError.docs } : {}),
          responseBody: payload
        });
      }
      return payload as T;
    } finally {
      requestSignal.cleanup();
    }
  }

  async getHome(language?: SupportedLanguage): Promise<HomeResponse> {
    const query = buildQuery({ ...(language ? { lang: language } : {}) });
    return HomeResponseSchema.parse(await this.requestJson(`/v1/home${query}`));
  }

  async getFeed(input?: { room?: string; language?: SupportedLanguage; cursor?: string }): Promise<FeedResponse> {
    const query = buildQuery({
      ...(input?.room ? { room: input.room } : {}),
      ...(input?.language ? { lang: input.language } : {}),
      ...(input?.cursor ? { cursor: input.cursor } : {})
    });
    return FeedResponseSchema.parse(await this.requestJson(`/v1/feed${query}`));
  }

  async getStory(storyId: string): Promise<StoryDetail> {
    return StoryDetailSchema.parse(await this.requestJson(`/v1/stories/${encodeURIComponent(storyId)}`));
  }

  async getAssistantOrientation(language?: SupportedLanguage): Promise<AssistantOrientationResponse> {
    const query = buildQuery({ ...(language ? { lang: language } : {}) });
    return AssistantOrientationResponseSchema.parse(await this.requestJson(`/v1/assistant/orientation${query}`));
  }

  async getStoryAssistantOrientation(
    storyId: string,
    language?: SupportedLanguage
  ): Promise<StoryAssistantOrientationResponse> {
    const query = buildQuery({ ...(language ? { lang: language } : {}) });
    return StoryAssistantOrientationResponseSchema.parse(
      await this.requestJson(`/v1/stories/${encodeURIComponent(storyId)}/assistant-orientation${query}`)
    );
  }

  async getStoryVersions(storyId: string): Promise<StoryVersionsResponse> {
    return StoryVersionsResponseSchema.parse(
      await this.requestJson(`/v1/stories/${encodeURIComponent(storyId)}/versions`)
    );
  }

  async getMachineRoom(storyId: string, language?: SupportedLanguage, options?: { packetHash?: string }): Promise<MachineRoomResponse> {
    const query = buildQuery({ ...(language ? { lang: language } : {}), ...(options?.packetHash ? { packetHash: options.packetHash } : {}) });
    return MachineRoomResponseSchema.parse(
      await this.requestJson(`/v1/stories/${encodeURIComponent(storyId)}/machine-room${query}`)
    );
  }

  async getMachineRoomProofGraph(options: GateOneProofGraphPublicRequestOptions): Promise<GateOnePublicProofGraph> {
    const storyId = options.storyId.trim();
    const packetHash = options.packetHash?.trim();
    if (!storyId) {
      throw new Error("storyId is required");
    }
    const query = buildQuery({
      ...(packetHash ? { packetHash } : {}),
      ...(options.limit !== undefined ? { limit: String(options.limit) } : {}),
      cursor: options.cursor
    });
    return GateOnePublicProofGraphSchema.parse(
      await this.requestJson(`/v1/stories/${encodeURIComponent(storyId)}/machine-room/proof-graph${query}`, {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        ...(options.signal ? { signal: options.signal } : {}),
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {})
      })
    );
  }

  async getMachineRoomProofGraphJsonLd(
    options: GateOneProofGraphPublicRequestOptions
  ): Promise<GateOneProofGraphPublicExport> {
    const storyId = options.storyId.trim();
    const packetHash = options.packetHash?.trim();
    if (!storyId) {
      throw new Error("storyId is required");
    }
    const query = buildQuery({
      ...(packetHash ? { packetHash } : {}),
      ...(options.limit !== undefined ? { limit: String(options.limit) } : {}),
      cursor: options.cursor
    });
    return this.requestJson<GateOneProofGraphPublicExport>(
      `/v1/stories/${encodeURIComponent(storyId)}/machine-room/proof-graph.jsonld${query}`,
      {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        ...(options.signal ? { signal: options.signal } : {}),
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {})
      }
    );
  }

  async getMachineRoomProofGraphProv(
    options: GateOneProofGraphPublicRequestOptions
  ): Promise<GateOneProofGraphPublicExport> {
    const storyId = options.storyId.trim();
    const packetHash = options.packetHash?.trim();
    if (!storyId) {
      throw new Error("storyId is required");
    }
    const query = buildQuery({
      ...(packetHash ? { packetHash } : {}),
      ...(options.limit !== undefined ? { limit: String(options.limit) } : {}),
      cursor: options.cursor
    });
    return this.requestJson<GateOneProofGraphPublicExport>(
      `/v1/stories/${encodeURIComponent(storyId)}/machine-room/prov.json${query}`,
      {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        ...(options.signal ? { signal: options.signal } : {}),
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {})
      }
    );
  }

  async getMachineRoomProofGraphClaimReview(
    options: GateOneProofGraphPublicRequestOptions
  ): Promise<GateOneProofGraphPublicExport> {
    const storyId = options.storyId.trim();
    const packetHash = options.packetHash?.trim();
    if (!storyId) {
      throw new Error("storyId is required");
    }
    const query = buildQuery({
      ...(packetHash ? { packetHash } : {}),
      ...(options.limit !== undefined ? { limit: String(options.limit) } : {}),
      cursor: options.cursor
    });
    return this.requestJson<GateOneProofGraphPublicExport>(
      `/v1/stories/${encodeURIComponent(storyId)}/machine-room/claim-review.jsonld${query}`,
      {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        ...(options.signal ? { signal: options.signal } : {}),
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {})
      }
    );
  }

  async computePublishReadiness(options: PublishComputeRequestOptions): Promise<PublishComputeResponse> {
    const candidateHash = options.candidateHash.trim();
    if (!/^[a-f0-9]{64}$/i.test(candidateHash)) {
      throw new Error("candidateHash must be a sha256 hex digest");
    }
    const body = PublishComputeRequestSchema.parse({
      ...(options.forceRescan !== undefined ? { forceRescan: options.forceRescan } : {}),
      ...(options.lane !== undefined ? { lane: options.lane } : {})
    });
    return PublishComputeResponseSchema.parse(
      await this.requestJson(`/v1/publish/${encodeURIComponent(candidateHash)}/compute`, {
        method: "POST",
        cache: "no-store",
        body,
        ...(options.requestId ? { requestId: options.requestId } : {}),
        ...(options.signal ? { signal: options.signal } : {}),
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
        headers: buildV2OperationsHeaders(options)
      })
    );
  }

  async runGateOneV2Preflights(options: GateOneV2PreflightRunOptions): Promise<GateOneV2PreflightRunResponse> {
    const storyId = options.storyId.trim();
    if (!storyId) {
      throw new Error("storyId is required");
    }
    const body = GateOneV2PreflightRunRequestSchema.parse({
      packet: options.packet,
      ...(options.promoteToCurrent !== undefined ? { promoteToCurrent: options.promoteToCurrent } : {})
    });
    return GateOneV2PreflightRunResponseSchema.parse(
      await this.requestJson(`/v2/internal/stories/${encodeURIComponent(storyId)}/preflights/run`, {
        method: "POST",
        cache: "no-store",
        body,
        ...(options.requestId ? { requestId: options.requestId } : {}),
        ...(options.signal ? { signal: options.signal } : {}),
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
        headers: buildV2OperationsHeaders(options)
      })
    );
  }

  async submitAgentStoryRevisionProposal(
    storyId: string,
    body: AgentStoryRevisionProposalRequest,
    options: AgentSignedWriteRequestOptions
  ): Promise<AgentStoryRevisionProposalResponse> {
    const normalizedStoryId = storyId.trim();
    if (!normalizedStoryId) {
      throw new Error("storyId is required");
    }
    return this.requestJson(`/v1/stories/${encodeURIComponent(normalizedStoryId)}/revision-proposals`, {
      method: "POST",
      body,
      headers: options.headers,
      idempotencyKey: options.idempotencyKey,
      ...(options.requestId ? { requestId: options.requestId } : {})
    });
  }

  async submitAgentStoryRevisionProposalVote(
    storyId: string,
    proposalId: string,
    body: AgentStoryRevisionProposalVoteRequest,
    options: AgentSignedWriteRequestOptions
  ): Promise<AgentStoryRevisionProposalVoteResponse> {
    const normalizedStoryId = storyId.trim();
    const normalizedProposalId = proposalId.trim();
    if (!normalizedStoryId || !normalizedProposalId) {
      throw new Error("storyId and proposalId are required");
    }
    return this.requestJson(
      `/v1/stories/${encodeURIComponent(normalizedStoryId)}/revision-proposals/${encodeURIComponent(normalizedProposalId)}/votes`,
      {
        method: "POST",
        body,
        headers: options.headers,
        idempotencyKey: options.idempotencyKey,
        ...(options.requestId ? { requestId: options.requestId } : {})
      }
    );
  }

  async getV2Stories(options: V2StoriesRequestOptions): Promise<V2StoriesResponse> {
    const query = buildQuery({
      ...(options.room ? { room: options.room } : {}),
      ...(options.language ? { lang: options.language } : {}),
      ...(options.cursor ? { cursor: options.cursor } : {}),
      ...(options.mode ? { mode: options.mode } : {})
    });
    return V2StoriesResponseSchema.parse(
      await this.requestJson(`/v2/stories${query}`, {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async getV2Story(options: V2StoryReadRequestOptions): Promise<V2StoryDetailResponse> {
    return V2StoryDetailResponseSchema.parse(
      await this.requestJson(`/v2/stories/${encodeURIComponent(options.storyId)}`, {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async getV2MachineRoom(options: V2StoryReadRequestOptions): Promise<V2MachineRoomResponse> {
    return V2MachineRoomResponseSchema.parse(
      await this.requestJson(`/v2/stories/${encodeURIComponent(options.storyId)}/machine-room`, {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async getV2Agents(options: V2AgentListRequestOptions): Promise<V2AgentsResponse> {
    const query = buildQuery({
      ...(options.limit !== undefined ? { limit: String(options.limit) } : {})
    });
    return V2AgentsResponseSchema.parse(
      await this.requestJson(`/v2/agents${query}`, {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async getV2Agent(options: V2AgentRequestOptions): Promise<V2AgentResponse> {
    return V2AgentResponseSchema.parse(
      await this.requestJson(`/v2/agents/${encodeURIComponent(options.botId)}`, {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async verifyGateOneV2DisclosureReceipt(
    options: GateOneV2DisclosureReceiptVerifyRequestOptions
  ): Promise<GateOneV2DisclosureReceiptVerifyResponse> {
    const storyId = options.storyId.trim();
    if (!storyId) {
      throw new Error("storyId is required");
    }
    return this.requestJson<GateOneV2DisclosureReceiptVerifyResponse>(
      `/v2/internal/stories/${encodeURIComponent(storyId)}/disclosures/verify`,
      {
        method: "POST",
        cache: "no-store",
        body: {
          ...(options.packetHash !== undefined ? { packetHash: options.packetHash } : {}),
          requirementId: options.requirementId,
          renderedArtifactHash: options.renderedArtifactHash,
          renderTarget: options.renderTarget,
          renderedTextHash: options.renderedTextHash,
          rendererVersion: options.rendererVersion,
          ...(options.verifiedAt !== undefined ? { verifiedAt: options.verifiedAt } : {})
        },
        ...(options.requestId ? { requestId: options.requestId } : {}),
        ...(options.signal ? { signal: options.signal } : {}),
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
        headers: buildV2OperationsHeaders(options)
      }
    );
  }

  async evaluateGateOneV2Consensus(
    options: GateOneV2ConsensusEvaluateRequestOptions
  ): Promise<GateOneV2ConsensusEvaluateResponse> {
    const storyId = options.storyId.trim();
    if (!storyId) {
      throw new Error("storyId is required");
    }
    return this.requestJson<GateOneV2ConsensusEvaluateResponse>(
      `/v2/internal/stories/${encodeURIComponent(storyId)}/consensus/evaluate`,
      {
        method: "POST",
        cache: "no-store",
        body: {
          ...(options.packetHash !== undefined ? { packetHash: options.packetHash } : {}),
          ...(options.safetyDecision !== undefined ? { safetyDecision: options.safetyDecision } : {}),
          ...(options.activeLegalHold !== undefined ? { activeLegalHold: options.activeLegalHold } : {}),
          ...(options.killSwitchActive !== undefined ? { killSwitchActive: options.killSwitchActive } : {}),
          ...(options.evaluatedAt !== undefined ? { evaluatedAt: options.evaluatedAt } : {})
        },
        ...(options.requestId ? { requestId: options.requestId } : {}),
        ...(options.signal ? { signal: options.signal } : {}),
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
        headers: buildV2OperationsHeaders(options)
      }
    );
  }

  async rebuildGateOneProofGraph(options: GateOneProofGraphRebuildRequestOptions): Promise<{
    storyId: string;
    packetId: string;
    packetHash: string;
    status: string;
    attempted: number;
    inserted: number;
  }> {
    const storyId = options.storyId.trim();
    if (!storyId) throw new Error("storyId is required");
    return this.requestJson(`/v2/internal/stories/${encodeURIComponent(storyId)}/proof-graph/rebuild`, {
      method: "POST",
      cache: "no-store",
      body: {
        ...(options.packetHash !== undefined ? { packetHash: options.packetHash } : {})
      },
      ...(options.requestId ? { requestId: options.requestId } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
      headers: buildV2OperationsHeaders(options)
    });
  }

  async getInternalGateOneProofGraph(options: GateOneProofGraphInternalReadOptions & { storyId: string }): Promise<unknown> {
    const storyId = options.storyId.trim();
    if (!storyId) throw new Error("storyId is required");
    const query = buildQuery({
      ...(options.packetHash !== undefined ? { packetHash: options.packetHash } : {}),
      ...(options.includePrivate !== undefined ? { includePrivate: String(options.includePrivate) } : {}),
      ...(options.includeSealed !== undefined ? { includeSealed: String(options.includeSealed) } : {}),
      ...(options.includeInvalidated !== undefined ? { includeInvalidated: String(options.includeInvalidated) } : {}),
      ...(options.limit !== undefined ? { limit: String(options.limit) } : {}),
      cursor: options.cursor
    });
    return this.requestJson(`/v2/internal/stories/${encodeURIComponent(storyId)}/proof-graph${query}`, {
      cache: "no-store",
      ...(options.requestId ? { requestId: options.requestId } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
      headers: buildV2OperationsHeaders(options)
    });
  }

  async getGateOneProofGraph(options: GateOneProofGraphInternalReadOptions & { storyId: string }): Promise<unknown> {
    return this.getInternalGateOneProofGraph(options);
  }

  async getGateOneProofGraphDiff(options: GateOneProofGraphInternalReadOptions & { storyId: string; fromPacketHash: string; toPacketHash: string }): Promise<unknown> {
    const storyId = options.storyId.trim();
    if (!storyId) throw new Error("storyId is required");
    const fromPacketHash = options.fromPacketHash.trim();
    const toPacketHash = options.toPacketHash.trim();
    if (!fromPacketHash || !toPacketHash) throw new Error("fromPacketHash and toPacketHash are required");
    const query = buildQuery({
      fromPacketHash,
      toPacketHash,
      ...(options.includePrivate !== undefined ? { includePrivate: String(options.includePrivate) } : {}),
      ...(options.includeSealed !== undefined ? { includeSealed: String(options.includeSealed) } : {})
    });
    return this.requestJson(`/v2/internal/stories/${encodeURIComponent(storyId)}/proof-graph/diff${query}`, {
      cache: "no-store",
      ...(options.requestId ? { requestId: options.requestId } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
      headers: buildV2OperationsHeaders(options)
    });
  }

  async getClaimProofNeighborhood(options: GateOneProofGraphInternalReadOptions & { id: string; storyId: string; packetHash: string }): Promise<unknown> {
    const id = options.id.trim();
    if (!id) throw new Error("id is required");
    const storyId = options.storyId.trim();
    if (!storyId) throw new Error("storyId is required");
    const packetHash = options.packetHash.trim();
    if (!packetHash) throw new Error("packetHash is required");
    const query = buildQuery({
      storyId,
      packetHash,
      ...(options.includePrivate !== undefined ? { includePrivate: String(options.includePrivate) } : {}),
      ...(options.includeSealed !== undefined ? { includeSealed: String(options.includeSealed) } : {})
    });
    return this.requestJson(`/v2/internal/claims/${encodeURIComponent(id)}/proof-neighborhood${query}`, {
      cache: "no-store",
      ...(options.requestId ? { requestId: options.requestId } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
      headers: buildV2OperationsHeaders(options)
    });
  }

  async getEvidenceUsage(options: GateOneProofGraphInternalReadOptions & { id: string; storyId: string; packetHash: string }): Promise<unknown> {
    const id = options.id.trim();
    if (!id) throw new Error("id is required");
    const storyId = options.storyId.trim();
    if (!storyId) throw new Error("storyId is required");
    const packetHash = options.packetHash.trim();
    if (!packetHash) throw new Error("packetHash is required");
    const query = buildQuery({
      storyId,
      packetHash,
      ...(options.includePrivate !== undefined ? { includePrivate: String(options.includePrivate) } : {}),
      ...(options.includeSealed !== undefined ? { includeSealed: String(options.includeSealed) } : {})
    });
    return this.requestJson(`/v2/internal/evidence/${encodeURIComponent(id)}/usage${query}`, {
      cache: "no-store",
      ...(options.requestId ? { requestId: options.requestId } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
      headers: buildV2OperationsHeaders(options)
    });
  }

  async getSourceOriginCluster(options: GateOneProofGraphInternalReadOptions & { id: string; storyId: string; packetHash: string }): Promise<unknown> {
    const id = options.id.trim();
    if (!id) throw new Error("id is required");
    const storyId = options.storyId.trim();
    if (!storyId) throw new Error("storyId is required");
    const packetHash = options.packetHash.trim();
    if (!packetHash) throw new Error("packetHash is required");
    const query = buildQuery({
      storyId,
      packetHash,
      ...(options.includePrivate !== undefined ? { includePrivate: String(options.includePrivate) } : {}),
      ...(options.includeSealed !== undefined ? { includeSealed: String(options.includeSealed) } : {})
    });
    return this.requestJson(`/v2/internal/sources/${encodeURIComponent(id)}/origin-cluster${query}`, {
      cache: "no-store",
      ...(options.requestId ? { requestId: options.requestId } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
      headers: buildV2OperationsHeaders(options)
    });
  }

  async getV2AuthSession(options: V2AuthSessionRequestOptions = {}): Promise<V2AuthSessionResponse> {
    return V2AuthSessionResponseSchema.parse(
      await this.requestJson("/v2/auth/session", {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2AuthHeaders(options)
      })
    );
  }

  async getV2Me(options: V2ProtectedReadRequestOptions): Promise<V2MeResponse> {
    return V2MeResponseSchema.parse(
      await this.requestJson("/v2/me", {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async getV2UsersMe(options: V2ProtectedReadRequestOptions): Promise<V2UsersMeResponse> {
    return V2UsersMeResponseSchema.parse(
      await this.requestJson("/v2/users/me", {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async getV2PendingWorkspaceMembershipInvites(
    options: V2ProtectedReadRequestOptions
  ): Promise<V2PendingWorkspaceMembershipInvitesResponse> {
    return V2PendingWorkspaceMembershipInvitesResponseSchema.parse(
      await this.requestJson("/v2/users/me/workspace-membership-invites", {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async getV2PendingWorkspaceMembershipInvite(
    options: V2PendingWorkspaceMembershipInviteRequestOptions
  ): Promise<V2PendingWorkspaceMembershipInviteResponse> {
    return V2PendingWorkspaceMembershipInviteResponseSchema.parse(
      await this.requestJson(
        `/v2/users/me/workspace-membership-invites/${encodeURIComponent(options.membershipId)}`,
        {
          cache: "no-store",
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async getV2OrganizationMembershipsMe(
    options: V2OrganizationMembershipsMeRequestOptions
  ): Promise<V2OrganizationMembershipsMeResponse> {
    return V2OrganizationMembershipsMeResponseSchema.parse(
      await this.requestJson(`/v2/organizations/${encodeURIComponent(options.organizationId)}/memberships/me`, {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async getV2Organizations(options: V2OrganizationsRequestOptions): Promise<V2OrganizationsResponse> {
    return V2OrganizationsResponseSchema.parse(
      await this.requestJson("/v2/organizations", {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async getV2Organization(options: V2OrganizationRequestOptions): Promise<V2OrganizationResponse> {
    return V2OrganizationResponseSchema.parse(
      await this.requestJson(`/v2/organizations/${encodeURIComponent(options.organizationId)}`, {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async updateV2OrganizationMetadata(
    options: V2UpdateOrganizationMetadataRequestOptions
  ): Promise<V2OrganizationMetadataUpdateResponse> {
    return V2OrganizationMetadataUpdateResponseSchema.parse(
      await this.requestJson(`/v2/organizations/${encodeURIComponent(options.organizationId)}`, {
        method: "PATCH",
        cache: "no-store",
        body: { metadata: options.metadata } satisfies V2OrganizationMetadataUpdateRequest,
        idempotencyKey: options.idempotencyKey,
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async getV2OrganizationOidcSettings(
    options: V2OrganizationRequestOptions
  ): Promise<V2OrganizationOidcSettingsResponse> {
    return V2OrganizationOidcSettingsResponseSchema.parse(
      await this.requestJson(`/v2/organizations/${encodeURIComponent(options.organizationId)}/oidc-settings`, {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async updateV2OrganizationOidcSettings(
    options: V2UpdateOrganizationOidcSettingsRequestOptions
  ): Promise<V2OrganizationOidcSettingsUpdateResponse> {
    const body: V2OrganizationOidcSettingsUpdateRequest = {
      status: options.status,
      ...(options.providerName ? { providerName: options.providerName } : {}),
      ...(options.issuer ? { issuer: options.issuer } : {}),
      ...(options.clientId ? { clientId: options.clientId } : {}),
      ...(options.clientSecretEnvVarName ? { clientSecretEnvVarName: options.clientSecretEnvVarName } : {}),
      ...(options.allowedDomains !== undefined ? { allowedDomains: options.allowedDomains } : {}),
      ...(options.jitProvisioningEnabled !== undefined ? { jitProvisioningEnabled: options.jitProvisioningEnabled } : {})
    };
    return V2OrganizationOidcSettingsUpdateResponseSchema.parse(
      await this.requestJson(`/v2/organizations/${encodeURIComponent(options.organizationId)}/oidc-settings`, {
        method: "PATCH",
        cache: "no-store",
        body,
        idempotencyKey: options.idempotencyKey,
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async getV2OrganizationWorkspaces(
    options: V2OrganizationWorkspacesRequestOptions
  ): Promise<V2OrganizationWorkspacesResponse> {
    return V2OrganizationWorkspacesResponseSchema.parse(
      await this.requestJson(`/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces`, {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async getV2Workspace(options: V2WorkspaceRequestOptions): Promise<V2WorkspaceResponse> {
    return V2WorkspaceResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}`,
        {
          cache: "no-store",
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async getV2OrganizationRoles(
    options: V2OrganizationMembershipsMeRequestOptions
  ): Promise<V2OrganizationRolesResponse> {
    return V2OrganizationRolesResponseSchema.parse(
      await this.requestJson(`/v2/organizations/${encodeURIComponent(options.organizationId)}/roles`, {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async getV2OrganizationServiceAccounts(
    options: V2OrganizationMembershipsMeRequestOptions
  ): Promise<V2OrganizationServiceAccountsResponse> {
    return V2OrganizationServiceAccountsResponseSchema.parse(
      await this.requestJson(`/v2/organizations/${encodeURIComponent(options.organizationId)}/service-accounts`, {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async createV2OrganizationServiceAccount(
    options: V2CreateOrganizationServiceAccountRequestOptions
  ): Promise<V2ServiceAccountCreateResponse> {
    return V2ServiceAccountCreateResponseSchema.parse(
      await this.requestJson(`/v2/organizations/${encodeURIComponent(options.organizationId)}/service-accounts`, {
        method: "POST",
        cache: "no-store",
        body: {
          name: options.name
        } satisfies V2ServiceAccountCreateRequest,
        idempotencyKey: options.idempotencyKey,
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async revokeV2OrganizationServiceAccount(
    options: V2RevokeOrganizationServiceAccountRequestOptions
  ): Promise<V2ServiceAccountRevocationResponse> {
    return V2ServiceAccountRevocationResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/service-accounts/${encodeURIComponent(options.serviceAccountId)}/revoke`,
        {
          method: "POST",
          cache: "no-store",
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async getV2OrganizationApiKeys(
    options: V2OrganizationMembershipsMeRequestOptions
  ): Promise<V2OrganizationApiKeysResponse> {
    return V2OrganizationApiKeysResponseSchema.parse(
      await this.requestJson(`/v2/organizations/${encodeURIComponent(options.organizationId)}/api-keys`, {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async createV2OrganizationApiKey(
    options: V2CreateOrganizationApiKeyRequestOptions
  ): Promise<V2ApiKeyCreateResponse> {
    return V2ApiKeyCreateResponseSchema.parse(
      await this.requestJson(`/v2/organizations/${encodeURIComponent(options.organizationId)}/api-keys`, {
        method: "POST",
        cache: "no-store",
        body: {
          name: options.name,
          serviceAccountId: options.serviceAccountId,
          ...(options.expiresAt !== undefined ? { expiresAt: options.expiresAt } : {})
        } satisfies V2ApiKeyCreateRequest,
        idempotencyKey: options.idempotencyKey,
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2SessionHeaders(options.sessionToken)
      })
    );
  }

  async revokeV2OrganizationApiKey(
    options: V2RevokeOrganizationApiKeyRequestOptions
  ): Promise<V2ApiKeyRevocationResponse> {
    return V2ApiKeyRevocationResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/api-keys/${encodeURIComponent(options.apiKeyId)}/revoke`,
        {
          method: "POST",
          cache: "no-store",
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async getV2OrganizationAuditEvents(
    options: V2OrganizationAuditEventsRequestOptions
  ): Promise<V2OrganizationAuditEventsResponse> {
    const query = buildV2AuditEventsQuery(options);
    return V2OrganizationAuditEventsResponseSchema.parse(
      await this.requestJson(`/v2/organizations/${encodeURIComponent(options.organizationId)}/audit-events${query}`, {
        cache: "no-store",
        ...(options.requestId ? { requestId: options.requestId } : {}),
        headers: buildV2AuthHeaders(options)
      })
    );
  }

  async getV2WorkspaceMembershipsMe(
    options: V2WorkspaceMembershipsMeRequestOptions
  ): Promise<V2WorkspaceMembershipsMeResponse> {
    return V2WorkspaceMembershipsMeResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships/me`,
        {
          cache: "no-store",
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async getV2WorkspaceMemberships(
    options: V2WorkspaceMembershipsMeRequestOptions
  ): Promise<V2WorkspaceMembershipsResponse> {
    return V2WorkspaceMembershipsResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships`,
        {
          cache: "no-store",
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async inviteV2WorkspaceMembership(
    options: V2InviteWorkspaceMembershipRequestOptions
  ): Promise<V2WorkspaceMembershipInviteResponse> {
    return V2WorkspaceMembershipInviteResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships`,
        {
          method: "POST",
          cache: "no-store",
          body: {
            email: options.email,
            ...(options.displayName !== undefined ? { displayName: options.displayName } : {})
          } satisfies V2WorkspaceMembershipInviteRequest,
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async cancelV2WorkspaceMembershipInvite(
    options: V2CancelWorkspaceMembershipInviteRequestOptions
  ): Promise<V2WorkspaceMembershipInviteCancellationResponse> {
    return V2WorkspaceMembershipInviteCancellationResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships/${encodeURIComponent(options.membershipId)}/cancel-invite`,
        {
          method: "POST",
          cache: "no-store",
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async resendV2WorkspaceMembershipInvite(
    options: V2ResendWorkspaceMembershipInviteRequestOptions
  ): Promise<V2WorkspaceMembershipInviteResendResponse> {
    return V2WorkspaceMembershipInviteResendResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships/${encodeURIComponent(options.membershipId)}/resend-invite`,
        {
          method: "POST",
          cache: "no-store",
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async updateV2WorkspaceMembershipInviteEmail(
    options: V2UpdateWorkspaceMembershipInviteEmailRequestOptions
  ): Promise<V2WorkspaceMembershipInviteEmailUpdateResponse> {
    return V2WorkspaceMembershipInviteEmailUpdateResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships/${encodeURIComponent(options.membershipId)}/invite-email`,
        {
          method: "PATCH",
          cache: "no-store",
          body: {
            invitedEmail: options.invitedEmail
          } satisfies V2WorkspaceMembershipInviteEmailUpdateRequest,
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async acceptV2WorkspaceMembershipInvite(
    options: V2AcceptWorkspaceMembershipInviteRequestOptions
  ): Promise<V2WorkspaceMembershipInviteAcceptanceResponse> {
    return V2WorkspaceMembershipInviteAcceptanceResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships/${encodeURIComponent(options.membershipId)}/accept-invite`,
        {
          method: "POST",
          cache: "no-store",
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async declineV2WorkspaceMembershipInvite(
    options: V2DeclineWorkspaceMembershipInviteRequestOptions
  ): Promise<V2WorkspaceMembershipInviteDeclineResponse> {
    return V2WorkspaceMembershipInviteDeclineResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships/${encodeURIComponent(options.membershipId)}/decline-invite`,
        {
          method: "POST",
          cache: "no-store",
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async removeV2WorkspaceMembership(
    options: V2RemoveWorkspaceMembershipRequestOptions
  ): Promise<V2WorkspaceMembershipRemovalResponse> {
    return V2WorkspaceMembershipRemovalResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships/${encodeURIComponent(options.membershipId)}`,
        {
          method: "DELETE",
          cache: "no-store",
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async leaveV2WorkspaceMembership(
    options: V2LeaveWorkspaceMembershipRequestOptions
  ): Promise<V2WorkspaceMembershipLeaveResponse> {
    return V2WorkspaceMembershipLeaveResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships/me`,
        {
          method: "DELETE",
          cache: "no-store",
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async updateV2WorkspaceMembership(
    options: V2UpdateWorkspaceMembershipRequestOptions
  ): Promise<V2WorkspaceMembershipUpdateResponse> {
    return V2WorkspaceMembershipUpdateResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships/${encodeURIComponent(options.membershipId)}`,
        {
          method: "PATCH",
          cache: "no-store",
          body: {
            status: options.status
          } satisfies V2WorkspaceMembershipUpdateRequest,
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  /**
   * @deprecated Prefer updateV2WorkspaceMembership({ status: "SUSPENDED" }) for new clients.
   * This compatibility alias preserves the legacy suspend operation, idempotency binding,
   * response shape, and audit action for deployed callers.
   */
  async suspendV2WorkspaceMembership(
    options: V2SuspendWorkspaceMembershipRequestOptions
  ): Promise<V2WorkspaceMembershipSuspensionResponse> {
    return V2WorkspaceMembershipSuspensionResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships/${encodeURIComponent(options.membershipId)}/suspend`,
        {
          method: "POST",
          cache: "no-store",
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  /**
   * @deprecated Prefer updateV2WorkspaceMembership({ status: "ACTIVE" }) for new clients.
   * This compatibility alias preserves the legacy reactivate operation, idempotency binding,
   * response shape, and audit action for deployed callers.
   */
  async reactivateV2WorkspaceMembership(
    options: V2ReactivateWorkspaceMembershipRequestOptions
  ): Promise<V2WorkspaceMembershipReactivationResponse> {
    return V2WorkspaceMembershipReactivationResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships/${encodeURIComponent(options.membershipId)}/reactivate`,
        {
          method: "POST",
          cache: "no-store",
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async assignV2WorkspaceMembershipRole(
    options: V2AssignWorkspaceMembershipRoleRequestOptions
  ): Promise<V2WorkspaceMembershipRoleAssignmentResponse> {
    return V2WorkspaceMembershipRoleAssignmentResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships/${encodeURIComponent(options.membershipId)}/roles`,
        {
          method: "POST",
          cache: "no-store",
          body: {
            roleId: options.roleId
          } satisfies V2WorkspaceMembershipRoleAssignmentRequest,
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async removeV2WorkspaceMembershipRole(
    options: V2RemoveWorkspaceMembershipRoleRequestOptions
  ): Promise<V2WorkspaceMembershipRoleRemovalResponse> {
    return V2WorkspaceMembershipRoleRemovalResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/memberships/${encodeURIComponent(options.membershipId)}/roles/${encodeURIComponent(options.roleId)}`,
        {
          method: "DELETE",
          cache: "no-store",
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async getV2WorkspaceRoles(options: V2WorkspaceMembershipsMeRequestOptions): Promise<V2WorkspaceRolesResponse> {
    return V2WorkspaceRolesResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/roles`,
        {
          cache: "no-store",
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async getV2WorkspaceServiceAccounts(
    options: V2WorkspaceMembershipsMeRequestOptions
  ): Promise<V2WorkspaceServiceAccountsResponse> {
    return V2WorkspaceServiceAccountsResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/service-accounts`,
        {
          cache: "no-store",
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async createV2WorkspaceServiceAccount(
    options: V2CreateWorkspaceServiceAccountRequestOptions
  ): Promise<V2ServiceAccountCreateResponse> {
    return V2ServiceAccountCreateResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/service-accounts`,
        {
          method: "POST",
          cache: "no-store",
          body: {
            name: options.name
          } satisfies V2ServiceAccountCreateRequest,
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async revokeV2WorkspaceServiceAccount(
    options: V2RevokeWorkspaceServiceAccountRequestOptions
  ): Promise<V2ServiceAccountRevocationResponse> {
    return V2ServiceAccountRevocationResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/service-accounts/${encodeURIComponent(options.serviceAccountId)}/revoke`,
        {
          method: "POST",
          cache: "no-store",
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async getV2WorkspaceApiKeys(options: V2WorkspaceMembershipsMeRequestOptions): Promise<V2WorkspaceApiKeysResponse> {
    return V2WorkspaceApiKeysResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/api-keys`,
        {
          cache: "no-store",
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async createV2WorkspaceApiKey(options: V2CreateWorkspaceApiKeyRequestOptions): Promise<V2ApiKeyCreateResponse> {
    return V2ApiKeyCreateResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/api-keys`,
        {
          method: "POST",
          cache: "no-store",
          body: {
            name: options.name,
            serviceAccountId: options.serviceAccountId,
            ...(options.expiresAt !== undefined ? { expiresAt: options.expiresAt } : {})
          } satisfies V2ApiKeyCreateRequest,
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async revokeV2WorkspaceApiKey(options: V2RevokeWorkspaceApiKeyRequestOptions): Promise<V2ApiKeyRevocationResponse> {
    return V2ApiKeyRevocationResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/api-keys/${encodeURIComponent(options.apiKeyId)}/revoke`,
        {
          method: "POST",
          cache: "no-store",
          idempotencyKey: options.idempotencyKey,
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2SessionHeaders(options.sessionToken)
        }
      )
    );
  }

  async getV2WorkspaceAuditEvents(
    options: V2WorkspaceAuditEventsRequestOptions
  ): Promise<V2WorkspaceAuditEventsResponse> {
    const query = buildV2AuditEventsQuery(options);
    return V2WorkspaceAuditEventsResponseSchema.parse(
      await this.requestJson(
        `/v2/organizations/${encodeURIComponent(options.organizationId)}/workspaces/${encodeURIComponent(options.workspaceId)}/audit-events${query}`,
        {
          cache: "no-store",
          ...(options.requestId ? { requestId: options.requestId } : {}),
          headers: buildV2AuthHeaders(options)
        }
      )
    );
  }
}

export function createMachineRoomApiClient(options: MachineRoomApiClientOptions): MachineRoomApiClient {
  return new MachineRoomApiClient(options);
}
