import assert from "node:assert/strict";
import test from "node:test";
import {
  ApiErrorSchema,
  FeedResponseSchema,
  IdempotencyKeySchema,
  IdempotencyRequestSchema,
  PayloadHashSchema,
  RequestIdSchema,
  V2AuthSessionResponseSchema,
  V2AgentResponseSchema,
  V2AgentsResponseSchema,
  V2HealthResponseSchema,
  V2MeResponseSchema,
  V2ApiKeyCreateRequestSchema,
  V2ApiKeyCreateResponseSchema,
  V2OrganizationApiKeysResponseSchema,
  V2OrganizationAuditEventsResponseSchema,
  V2OrganizationMembershipsMeResponseSchema,
  V2OrganizationMetadataUpdateRequestSchema,
  V2OrganizationOidcSettingsResponseSchema,
  V2OrganizationOidcSettingsUpdateRequestSchema,
  V2OrganizationOidcSettingsUpdateResponseSchema,
  V2OrganizationRolesResponseSchema,
  V2OrganizationServiceAccountsResponseSchema,
  V2PendingWorkspaceMembershipInviteResponseSchema,
  V2PendingWorkspaceMembershipInvitesResponseSchema,
  V2ReadyzResponseSchema,
  V2ServiceAccountCreateRequestSchema,
  V2ServiceAccountCreateResponseSchema,
  V2ServiceAccountRevocationResponseSchema,
  V2UsersMeResponseSchema,
  V2WorkspaceMembershipsResponseSchema,
  V2WorkspaceMembershipsMeResponseSchema,
  V2WorkspaceMembershipInviteAcceptanceResponseSchema,
  V2WorkspaceMembershipInviteCancellationResponseSchema,
  V2WorkspaceMembershipInviteDeclineResponseSchema,
  V2WorkspaceMembershipInviteEmailUpdateRequestSchema,
  V2WorkspaceMembershipInviteEmailUpdateResponseSchema,
  V2WorkspaceMembershipInviteRequestSchema,
  V2WorkspaceMembershipInviteResponseSchema,
  V2WorkspaceMembershipInviteResendResponseSchema,
  V2MachineRoomResponseSchema,
  V2WorkspaceMembershipRoleAssignmentRequestSchema,
  V2WorkspaceMembershipRoleAssignmentResponseSchema,
  V2WorkspaceMembershipRoleRemovalResponseSchema,
  V2WorkspaceMembershipUpdateRequestSchema,
  V2WorkspaceMembershipUpdateResponseSchema,
  V2WorkspaceApiKeysResponseSchema,
  V2WorkspaceAuditEventsResponseSchema,
  V2WorkspaceRolesResponseSchema,
  V2WorkspaceServiceAccountsResponseSchema,
  V2StoryDetailResponseSchema,
  V1ActionableErrorSchema,
  parseApiError,
  parseMachineRoomApiError,
  parseV1ActionableError
} from "../src/index.js";

test("@machinesroom/contracts validates standard API errors", () => {
  const payload = {
    error: {
      code: "UNAUTHORIZED",
      message: "Authentication required",
      requestId: "req_123"
    }
  };

  assert.deepEqual(ApiErrorSchema.parse(payload), payload);
  assert.equal(parseApiError(payload)?.error.code, "UNAUTHORIZED");
  assert.equal(parseMachineRoomApiError(payload)?.code, "UNAUTHORIZED");
  assert.equal(parseApiError({ error: { code: "BAD", message: "missing request id" } }), null);
});

test("@machinesroom/contracts validates V1 actionable API errors", () => {
  const payload = {
    error: "Invalid agent signature",
    code: "AGENT_SIGNATURE_INVALID",
    message: "Invalid agent signature",
    nextAction: "Check canonical JSON and re-sign the request.",
    requestId: "req_v1_error",
    retryAfterSeconds: 12,
    docs: {
      bots: "https://machinesroom.com/bots",
      skill: "https://machinesroom.com/agents/skill.md",
      openapi: "https://machinesroom.com/openapi.json"
    }
  };

  assert.deepEqual(V1ActionableErrorSchema.parse(payload), payload);
  assert.equal(parseV1ActionableError(payload)?.code, "AGENT_SIGNATURE_INVALID");
  const parsed = parseMachineRoomApiError(payload);
  assert.equal(parsed?.shape, "v1-actionable");
  assert.equal(parsed?.message, "Invalid agent signature");
  assert.equal(parsed?.nextAction, "Check canonical JSON and re-sign the request.");
  assert.equal(parsed?.retryAfterSeconds, 12);
});

test("@machinesroom/contracts validates request IDs", () => {
  assert.equal(RequestIdSchema.safeParse("req_123").success, true);
  assert.equal(RequestIdSchema.safeParse("").success, false);
  assert.equal(RequestIdSchema.safeParse("x".repeat(129)).success, false);
});

test("@machinesroom/contracts validates V2 organization OIDC settings without secret material", () => {
  assert.deepEqual(
    V2OrganizationOidcSettingsUpdateRequestSchema.parse({
      status: "ACTIVE",
      providerName: "Okta Workforce",
      issuer: "https://idp.example.com/oauth2/default/",
      clientId: "machine-room-client",
      clientSecretEnvVarName: "OIDC_OKTA_CLIENT_SECRET",
      allowedDomains: ["News.Example.COM"],
      jitProvisioningEnabled: false
    }),
    {
      status: "ACTIVE",
      providerName: "Okta Workforce",
      issuer: "https://idp.example.com/oauth2/default",
      clientId: "machine-room-client",
      clientSecretEnvVarName: "OIDC_OKTA_CLIENT_SECRET",
      allowedDomains: ["news.example.com"],
      jitProvisioningEnabled: false
    }
  );
  assert.deepEqual(V2OrganizationOidcSettingsUpdateRequestSchema.parse({ status: "DISABLED" }), {
    status: "DISABLED"
  });
  assert.deepEqual(
    V2OrganizationOidcSettingsUpdateRequestSchema.parse({
      status: "DISABLED",
      allowedDomains: []
    }),
    {
      status: "DISABLED",
      allowedDomains: []
    }
  );
  assert.deepEqual(
    V2OrganizationOidcSettingsUpdateRequestSchema.parse({
      status: "ACTIVE",
      providerName: "Okta Workforce",
      issuer: "https://idp.example.com/oauth2/default/",
      clientId: "machine-room-client",
      allowedDomains: ["News.Example.COM"],
      jitProvisioningEnabled: false
    }),
    {
      status: "ACTIVE",
      providerName: "Okta Workforce",
      issuer: "https://idp.example.com/oauth2/default",
      clientId: "machine-room-client",
      allowedDomains: ["news.example.com"],
      jitProvisioningEnabled: false
    }
  );

  assert.equal(
    V2OrganizationOidcSettingsUpdateRequestSchema.safeParse({
      status: "ACTIVE",
      providerName: "Bad IdP",
      issuer: "http://idp.example.com",
      clientId: "machine-room-client",
      clientSecretEnvVarName: "OIDC_OKTA_CLIENT_SECRET",
      allowedDomains: ["news.example.com"],
      jitProvisioningEnabled: false
    }).success,
    false
  );
  assert.equal(
    V2OrganizationOidcSettingsUpdateRequestSchema.safeParse({
      status: "ACTIVE",
      providerName: "Bad IdP",
      issuer: "https://idp.example.com",
      clientId: "machine-room-client",
      clientSecretEnvVarName: "raw-secret-value",
      allowedDomains: ["news.example.com"],
      jitProvisioningEnabled: false
    }).success,
    false
  );

  const response = {
    data: {
      organizationId: "org_123",
      oidcSettings: {
        organizationId: "org_123",
        status: "ACTIVE",
        providerName: "Okta Workforce",
        issuer: "https://idp.example.com/oauth2/default",
        clientId: "machine-room-client",
        clientSecretConfigured: true,
        allowedDomains: ["news.example.com"],
        jitProvisioningEnabled: false,
        createdAt: "2026-05-07T00:00:00.000Z",
        updatedAt: "2026-05-07T00:30:00.000Z"
      }
    },
    requestId: "req_v2_oidc_settings"
  };
  assert.deepEqual(V2OrganizationOidcSettingsResponseSchema.parse(response), response);

  assert.deepEqual(
    V2OrganizationOidcSettingsUpdateResponseSchema.parse({
      ...response,
      data: {
        ...response.data,
        updated: true,
        updatedFields: [
          "status",
          "providerName",
          "issuer",
          "clientId",
          "clientSecretEnvVarName",
          "allowedDomains",
          "jitProvisioningEnabled"
        ]
      },
      idempotency: {
        status: "created",
        key: "retry-key:oidc-settings",
        requestId: "req_v2_oidc_settings"
      }
    }).data.oidcSettings.clientSecretConfigured,
    true
  );
});

test("@machinesroom/contracts enforces V2 organization metadata serialized byte limits", () => {
  assert.equal(
    V2OrganizationMetadataUpdateRequestSchema.safeParse({
      metadata: {
        note: "x".repeat(8181)
      }
    }).success,
    true
  );

  assert.equal(
    V2OrganizationMetadataUpdateRequestSchema.safeParse({
      metadata: {
        note: "\u00e9".repeat(4091)
      }
    }).success,
    false
  );
});

test("@machinesroom/contracts validates V2 health and readiness envelopes", () => {
  assert.deepEqual(
    V2HealthResponseSchema.parse({
      data: {
        ok: true,
        service: "machines-room-api"
      },
      requestId: "req_health"
    }),
    {
      data: {
        ok: true,
        service: "machines-room-api"
      },
      requestId: "req_health"
    }
  );

  assert.deepEqual(
    V2ReadyzResponseSchema.parse({
      data: {
        ready: true,
        mode: "test"
      },
      requestId: "req_ready"
    }),
    {
      data: {
        ready: true,
        mode: "test"
      },
      requestId: "req_ready"
    }
  );
});

test("@machinesroom/contracts validates V2 session and me envelopes", () => {
  assert.deepEqual(
    V2AuthSessionResponseSchema.parse({
      data: {
        authenticated: false
      },
      requestId: "req_session_anon"
    }),
    {
      data: {
        authenticated: false
      },
      requestId: "req_session_anon"
    }
  );

  const authenticatedPayload = {
    data: {
      authenticated: true,
      user: {
        id: "user_123",
        email: "person@example.com",
        displayName: "Person"
      },
      proof: {
        verifiedHuman: true,
        linkedHumanId: "human_123",
        provider: "WORLD_ID",
        tier: "L1"
      },
      session: {
        expiresAt: "2026-04-28T12:00:00.000Z",
        lastUsedAt: "2026-04-28T00:00:00.000Z"
      }
    },
    requestId: "req_session_auth"
  };

  assert.deepEqual(V2AuthSessionResponseSchema.parse(authenticatedPayload), authenticatedPayload);

  const serviceAccountSessionPayload = {
    data: {
      authenticated: true,
      serviceAccount: {
        id: "svc_123",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        name: "Workspace Automation"
      },
      credential: {
        apiKeyId: "api_key_123",
        expiresAt: "2027-04-28T12:00:00.000Z",
        lastUsedAt: "2026-04-28T00:00:00.000Z"
      }
    },
    requestId: "req_session_service_account"
  };

  assert.deepEqual(V2AuthSessionResponseSchema.parse(serviceAccountSessionPayload), serviceAccountSessionPayload);

  assert.deepEqual(
    V2MeResponseSchema.parse({
      data: {
        user: authenticatedPayload.data.user,
        proof: authenticatedPayload.data.proof,
        session: authenticatedPayload.data.session
      },
      requestId: "req_me"
    }),
    {
      data: {
        user: authenticatedPayload.data.user,
        proof: authenticatedPayload.data.proof,
        session: authenticatedPayload.data.session
      },
      requestId: "req_me"
    }
  );

  assert.deepEqual(
    V2UsersMeResponseSchema.parse({
      data: {
        user: authenticatedPayload.data.user,
        actor: {
          actorId: "human-human_123",
          actorType: "human",
          verified: true,
          proofProvider: "WORLD_ID",
          userId: "user_123",
          linkedHumanId: "human_123"
        },
        authorization: {
          memberships: [
            {
              membershipId: "membership_123",
              organizationId: "org_123",
              roles: ["viewer"],
              permissions: ["story.read"]
            }
          ],
          unsupportedGrantKeys: {
            roles: [],
            permissions: []
          }
        },
        proof: authenticatedPayload.data.proof,
        session: authenticatedPayload.data.session
      },
      requestId: "req_users_me"
    }),
    {
      data: {
        user: authenticatedPayload.data.user,
        actor: {
          actorId: "human-human_123",
          actorType: "human",
          verified: true,
          proofProvider: "WORLD_ID",
          userId: "user_123",
          linkedHumanId: "human_123"
        },
        authorization: {
          memberships: [
            {
              membershipId: "membership_123",
              organizationId: "org_123",
              roles: ["viewer"],
              permissions: ["story.read"]
            }
          ],
          unsupportedGrantKeys: {
            roles: [],
            permissions: []
          }
        },
        proof: authenticatedPayload.data.proof,
        session: authenticatedPayload.data.session
      },
      requestId: "req_users_me"
    }
  );

  assert.deepEqual(
    V2UsersMeResponseSchema.parse({
      data: {
        user: authenticatedPayload.data.user,
        actor: {
          actorId: "human-human_123",
          actorType: "human",
          verified: true,
          proofProvider: "WORLD_ID",
          userId: "user_123",
          linkedHumanId: "human_123"
        },
        proof: authenticatedPayload.data.proof,
        session: authenticatedPayload.data.session
      },
      requestId: "req_users_me_legacy"
    }).data.authorization,
    {
      memberships: [],
      unsupportedGrantKeys: {
        roles: [],
        permissions: []
      }
    }
  );

  assert.deepEqual(
    V2OrganizationMembershipsMeResponseSchema.parse({
      data: {
        organizationId: "org_123",
        authorization: {
          memberships: [
            {
              membershipId: "membership_123",
              organizationId: "org_123",
              roles: ["viewer"],
              permissions: ["story.read"]
            }
          ],
          unsupportedGrantKeys: {
            roles: [],
            permissions: []
          }
        }
      },
      requestId: "req_org_memberships_me"
    }),
    {
      data: {
        organizationId: "org_123",
        authorization: {
          memberships: [
            {
              membershipId: "membership_123",
              organizationId: "org_123",
              roles: ["viewer"],
              permissions: ["story.read"]
            }
          ],
          unsupportedGrantKeys: {
            roles: [],
            permissions: []
          }
        }
      },
      requestId: "req_org_memberships_me"
    }
  );

  assert.deepEqual(
    V2WorkspaceMembershipsMeResponseSchema.parse({
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        authorization: {
          memberships: [
            {
              membershipId: "membership_123",
              organizationId: "org_123",
              workspaceId: "workspace_123",
              roles: ["editor"],
              permissions: ["story.transition"]
            }
          ],
          unsupportedGrantKeys: {
            roles: [],
            permissions: []
          }
        }
      },
      requestId: "req_workspace_memberships_me"
    }),
    {
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        authorization: {
          memberships: [
            {
              membershipId: "membership_123",
              organizationId: "org_123",
              workspaceId: "workspace_123",
              roles: ["editor"],
              permissions: ["story.transition"]
            }
          ],
          unsupportedGrantKeys: {
            roles: [],
            permissions: []
          }
        }
      },
      requestId: "req_workspace_memberships_me"
    }
  );

  assert.deepEqual(
    V2WorkspaceMembershipsResponseSchema.parse({
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        memberships: [
          {
            membershipId: "membership_123",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            userId: "user_123",
            status: "ACTIVE",
            roles: [
              {
                membershipRoleId: "membership_role_123",
                roleId: "role_workspace_editor",
                roleKey: "workspace-editor",
                roleName: "Workspace Editor"
              }
            ],
            createdAt: "2026-04-28T18:00:00.000Z",
            updatedAt: "2026-04-28T18:01:00.000Z"
          },
          {
            membershipId: "membership_invited",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            userId: "user_invited",
            status: "INVITED",
            invitedEmail: "candidate@example.com",
            invitedByUserId: "user_inviter",
            roles: [],
            createdAt: "2026-04-28T19:00:00.000Z",
            updatedAt: "2026-04-28T19:00:00.000Z"
          }
        ]
      },
      requestId: "req_workspace_memberships"
    }),
    {
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        memberships: [
          {
            membershipId: "membership_123",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            userId: "user_123",
            status: "ACTIVE",
            roles: [
              {
                membershipRoleId: "membership_role_123",
                roleId: "role_workspace_editor",
                roleKey: "workspace-editor",
                roleName: "Workspace Editor"
              }
            ],
            createdAt: "2026-04-28T18:00:00.000Z",
            updatedAt: "2026-04-28T18:01:00.000Z"
          },
          {
            membershipId: "membership_invited",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            userId: "user_invited",
            status: "INVITED",
            invitedEmail: "candidate@example.com",
            invitedByUserId: "user_inviter",
            roles: [],
            createdAt: "2026-04-28T19:00:00.000Z",
            updatedAt: "2026-04-28T19:00:00.000Z"
          }
        ]
      },
      requestId: "req_workspace_memberships"
    }
  );

  assert.deepEqual(
    V2PendingWorkspaceMembershipInvitesResponseSchema.parse({
      data: {
        invites: [
          {
            membershipId: "membership_invited",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            userId: "user_invited",
            status: "INVITED",
            invitedEmail: "candidate@example.com",
            invitedByUserId: "user_inviter",
            roles: [],
            createdAt: "2026-04-28T19:00:00.000Z",
            updatedAt: "2026-04-28T19:00:00.000Z"
          }
        ]
      },
      requestId: "req_pending_workspace_invites"
    }),
    {
      data: {
        invites: [
          {
            membershipId: "membership_invited",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            userId: "user_invited",
            status: "INVITED",
            invitedEmail: "candidate@example.com",
            invitedByUserId: "user_inviter",
            roles: [],
            createdAt: "2026-04-28T19:00:00.000Z",
            updatedAt: "2026-04-28T19:00:00.000Z"
          }
        ]
      },
      requestId: "req_pending_workspace_invites"
    }
  );

  assert.deepEqual(
    V2PendingWorkspaceMembershipInviteResponseSchema.parse({
      data: {
        invite: {
          membershipId: "membership_invited",
          organizationId: "org_123",
          workspaceId: "workspace_123",
          userId: "user_invited",
          status: "INVITED",
          invitedEmail: "candidate@example.com",
          invitedByUserId: "user_inviter",
          roles: [],
          createdAt: "2026-04-28T19:00:00.000Z",
          updatedAt: "2026-04-28T19:00:00.000Z"
        }
      },
      requestId: "req_pending_workspace_invite"
    }),
    {
      data: {
        invite: {
          membershipId: "membership_invited",
          organizationId: "org_123",
          workspaceId: "workspace_123",
          userId: "user_invited",
          status: "INVITED",
          invitedEmail: "candidate@example.com",
          invitedByUserId: "user_inviter",
          roles: [],
          createdAt: "2026-04-28T19:00:00.000Z",
          updatedAt: "2026-04-28T19:00:00.000Z"
        }
      },
      requestId: "req_pending_workspace_invite"
    }
  );

  assert.deepEqual(
    V2OrganizationRolesResponseSchema.parse({
      data: {
        organizationId: "org_123",
        roles: [
          {
            roleId: "role_org_reviewer",
            organizationId: "org_123",
            key: "reviewer",
            name: "Reviewer",
            system: false,
            permissions: ["role.read", "story.read"]
          }
        ]
      },
      requestId: "req_org_roles"
    }),
    {
      data: {
        organizationId: "org_123",
        roles: [
          {
            roleId: "role_org_reviewer",
            organizationId: "org_123",
            key: "reviewer",
            name: "Reviewer",
            system: false,
            permissions: ["role.read", "story.read"]
          }
        ]
      },
      requestId: "req_org_roles"
    }
  );

  assert.deepEqual(
    V2WorkspaceRolesResponseSchema.parse({
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        roles: [
          {
            roleId: "role_workspace_editor",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            key: "workspace-editor",
            name: "Workspace Editor",
            system: false,
            permissions: ["role.read", "story.transition"]
          }
        ]
      },
      requestId: "req_workspace_roles"
    }),
    {
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        roles: [
          {
            roleId: "role_workspace_editor",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            key: "workspace-editor",
            name: "Workspace Editor",
            system: false,
            permissions: ["role.read", "story.transition"]
          }
        ]
      },
      requestId: "req_workspace_roles"
    }
  );

  assert.deepEqual(
    V2WorkspaceMembershipRoleAssignmentRequestSchema.parse({
      roleId: " role_workspace_editor "
    }),
    {
      roleId: "role_workspace_editor"
    }
  );
  assert.equal(
    V2WorkspaceMembershipRoleAssignmentRequestSchema.safeParse({
      roleId: "role_workspace_editor",
      ignored: true
    }).success,
    false
  );

  assert.deepEqual(
    V2WorkspaceMembershipInviteRequestSchema.parse({
      email: " Candidate@Example.com ",
      displayName: " Candidate Person "
    }),
    {
      email: "candidate@example.com",
      displayName: "Candidate Person"
    }
  );
  assert.equal(
    V2WorkspaceMembershipInviteRequestSchema.safeParse({
      email: "candidate@example.com",
      ignored: true
    }).success,
    false
  );
  assert.deepEqual(
    V2WorkspaceMembershipUpdateRequestSchema.parse({
      status: " SUSPENDED "
    }),
    {
      status: "SUSPENDED"
    }
  );
  assert.equal(
    V2WorkspaceMembershipUpdateRequestSchema.safeParse({
      status: "REMOVED"
    }).success,
    false
  );
  assert.equal(
    V2WorkspaceMembershipUpdateRequestSchema.safeParse({
      status: "ACTIVE",
      roles: []
    }).success,
    false
  );
  assert.deepEqual(
    V2WorkspaceMembershipInviteEmailUpdateRequestSchema.parse({
      invitedEmail: " Candidate@Example.com "
    }),
    {
      invitedEmail: "candidate@example.com"
    }
  );
  assert.equal(
    V2WorkspaceMembershipInviteEmailUpdateRequestSchema.safeParse({
      invitedEmail: "candidate@example.com",
      status: "INVITED"
    }).success,
    false
  );
  assert.equal(
    V2WorkspaceMembershipInviteEmailUpdateRequestSchema.safeParse({
      invitedEmail: "not-an-email"
    }).success,
    false
  );

  assert.deepEqual(
    V2WorkspaceMembershipInviteResponseSchema.parse({
      data: {
        membershipId: "membership_invite_123",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_invited",
        status: "INVITED",
        invitedEmail: "candidate@example.com",
        invitedByUserId: "user_inviter",
        roles: [],
        createdAt: "2026-04-29T00:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        created: true
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-invite",
        requestId: "req_workspace_membership_invite"
      },
      requestId: "req_workspace_membership_invite"
    }),
    {
      data: {
        membershipId: "membership_invite_123",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_invited",
        status: "INVITED",
        invitedEmail: "candidate@example.com",
        invitedByUserId: "user_inviter",
        roles: [],
        createdAt: "2026-04-29T00:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        created: true
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-invite",
        requestId: "req_workspace_membership_invite"
      },
      requestId: "req_workspace_membership_invite"
    }
  );

  assert.deepEqual(
    V2WorkspaceMembershipInviteCancellationResponseSchema.parse({
      data: {
        membershipId: "membership_invite_123",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_invited",
        status: "REMOVED",
        invitedEmail: "candidate@example.com",
        invitedByUserId: "user_inviter",
        roles: [],
        createdAt: "2026-04-28T19:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        canceled: true
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-invite-cancel",
        requestId: "req_workspace_membership_invite_cancel"
      },
      requestId: "req_workspace_membership_invite_cancel"
    }),
    {
      data: {
        membershipId: "membership_invite_123",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_invited",
        status: "REMOVED",
        invitedEmail: "candidate@example.com",
        invitedByUserId: "user_inviter",
        roles: [],
        createdAt: "2026-04-28T19:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        canceled: true
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-invite-cancel",
        requestId: "req_workspace_membership_invite_cancel"
      },
      requestId: "req_workspace_membership_invite_cancel"
    }
  );

  assert.deepEqual(
    V2WorkspaceMembershipInviteResendResponseSchema.parse({
      data: {
        membershipId: "membership_invite_123",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_invited",
        status: "INVITED",
        invitedEmail: "candidate@example.com",
        invitedByUserId: "user_resender",
        roles: [],
        createdAt: "2026-04-28T19:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        resent: true
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-invite-resend",
        requestId: "req_workspace_membership_invite_resend"
      },
      requestId: "req_workspace_membership_invite_resend"
    }),
    {
      data: {
        membershipId: "membership_invite_123",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_invited",
        status: "INVITED",
        invitedEmail: "candidate@example.com",
        invitedByUserId: "user_resender",
        roles: [],
        createdAt: "2026-04-28T19:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        resent: true
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-invite-resend",
        requestId: "req_workspace_membership_invite_resend"
      },
      requestId: "req_workspace_membership_invite_resend"
    }
  );

  assert.deepEqual(
    V2WorkspaceMembershipInviteAcceptanceResponseSchema.parse({
      data: {
        membershipId: "membership_invite_123",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_invited",
        status: "ACTIVE",
        invitedEmail: "candidate@example.com",
        invitedByUserId: "user_inviter",
        roles: [],
        createdAt: "2026-04-28T19:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        accepted: true
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-invite-accept",
        requestId: "req_workspace_membership_invite_accept"
      },
      requestId: "req_workspace_membership_invite_accept"
    }),
    {
      data: {
        membershipId: "membership_invite_123",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_invited",
        status: "ACTIVE",
        invitedEmail: "candidate@example.com",
        invitedByUserId: "user_inviter",
        roles: [],
        createdAt: "2026-04-28T19:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        accepted: true
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-invite-accept",
        requestId: "req_workspace_membership_invite_accept"
      },
      requestId: "req_workspace_membership_invite_accept"
    }
  );

  assert.deepEqual(
    V2WorkspaceMembershipInviteDeclineResponseSchema.parse({
      data: {
        membershipId: "membership_invite_123",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_invited",
        status: "REMOVED",
        invitedEmail: "candidate@example.com",
        invitedByUserId: "user_inviter",
        roles: [],
        createdAt: "2026-04-28T19:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        declined: true
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-invite-decline",
        requestId: "req_workspace_membership_invite_decline"
      },
      requestId: "req_workspace_membership_invite_decline"
    }),
    {
      data: {
        membershipId: "membership_invite_123",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_invited",
        status: "REMOVED",
        invitedEmail: "candidate@example.com",
        invitedByUserId: "user_inviter",
        roles: [],
        createdAt: "2026-04-28T19:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        declined: true
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-invite-decline",
        requestId: "req_workspace_membership_invite_decline"
      },
      requestId: "req_workspace_membership_invite_decline"
    }
  );

  assert.deepEqual(
    V2WorkspaceMembershipUpdateResponseSchema.parse({
      data: {
        membershipId: "membership_123",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_member",
        status: "SUSPENDED",
        roles: [],
        createdAt: "2026-04-28T18:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        updated: true,
        updatedFields: ["status"],
        previousStatus: "ACTIVE"
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-update",
        requestId: "req_workspace_membership_update"
      },
      requestId: "req_workspace_membership_update"
    }),
    {
      data: {
        membershipId: "membership_123",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_member",
        status: "SUSPENDED",
        roles: [],
        createdAt: "2026-04-28T18:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        updated: true,
        updatedFields: ["status"],
        previousStatus: "ACTIVE"
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-update",
        requestId: "req_workspace_membership_update"
      },
      requestId: "req_workspace_membership_update"
    }
  );
  assert.deepEqual(
    V2WorkspaceMembershipInviteEmailUpdateResponseSchema.parse({
      data: {
        membershipId: "membership_invited",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_corrected",
        status: "INVITED",
        invitedEmail: "corrected@example.com",
        invitedByUserId: "user_inviter",
        roles: [],
        createdAt: "2026-04-28T19:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        updated: true,
        updatedFields: ["invitedEmail", "userId"],
        previousUserId: "user_invited",
        previousInvitedEmail: "candidate@example.com"
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-invite-email",
        requestId: "req_workspace_membership_invite_email_update"
      },
      requestId: "req_workspace_membership_invite_email_update"
    }),
    {
      data: {
        membershipId: "membership_invited",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_corrected",
        status: "INVITED",
        invitedEmail: "corrected@example.com",
        invitedByUserId: "user_inviter",
        roles: [],
        createdAt: "2026-04-28T19:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        updated: true,
        updatedFields: ["invitedEmail", "userId"],
        previousUserId: "user_invited",
        previousInvitedEmail: "candidate@example.com"
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-invite-email",
        requestId: "req_workspace_membership_invite_email_update"
      },
      requestId: "req_workspace_membership_invite_email_update"
    }
  );
  assert.equal(
    V2WorkspaceMembershipInviteEmailUpdateResponseSchema.safeParse({
      data: {
        membershipId: "membership_invited",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_invited",
        status: "ACTIVE",
        invitedEmail: "corrected@example.com",
        roles: [],
        createdAt: "2026-04-28T19:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        updated: true,
        updatedFields: ["invitedEmail", "userId"],
        previousUserId: "user_invited"
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-invite-email",
        requestId: "req_workspace_membership_invite_email_update"
      },
      requestId: "req_workspace_membership_invite_email_update"
    }).success,
    false
  );
  assert.equal(
    V2WorkspaceMembershipInviteEmailUpdateResponseSchema.safeParse({
      data: {
        membershipId: "membership_invited",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        userId: "user_corrected",
        status: "INVITED",
        invitedEmail: "corrected@example.com",
        roles: [],
        createdAt: "2026-04-28T19:00:00.000Z",
        updatedAt: "2026-04-29T00:00:00.000Z",
        updated: true,
        updatedFields: ["invitedEmail"]
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-invite-email",
        requestId: "req_workspace_membership_invite_email_update"
      },
      requestId: "req_workspace_membership_invite_email_update"
    }).success,
    false
  );

  assert.deepEqual(
    V2WorkspaceMembershipRoleAssignmentResponseSchema.parse({
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        membershipId: "membership_123",
        roleId: "role_workspace_editor",
        roleKey: "workspace-editor",
        membershipRoleId: "membership_role_123",
        created: true
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-role",
        requestId: "req_workspace_role_assign"
      },
      requestId: "req_workspace_role_assign"
    }),
    {
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        membershipId: "membership_123",
        roleId: "role_workspace_editor",
        roleKey: "workspace-editor",
        membershipRoleId: "membership_role_123",
        created: true
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-role",
        requestId: "req_workspace_role_assign"
      },
      requestId: "req_workspace_role_assign"
    }
  );

  assert.deepEqual(
    V2WorkspaceMembershipRoleRemovalResponseSchema.parse({
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        membershipId: "membership_123",
        roleId: "role_workspace_editor",
        roleKey: "workspace-editor",
        membershipRoleId: "membership_role_123",
        removed: true
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-role-remove",
        requestId: "req_workspace_role_remove"
      },
      requestId: "req_workspace_role_remove"
    }),
    {
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        membershipId: "membership_123",
        roleId: "role_workspace_editor",
        roleKey: "workspace-editor",
        membershipRoleId: "membership_role_123",
        removed: true
      },
      idempotency: {
        status: "created",
        key: "retry-key:membership-role-remove",
        requestId: "req_workspace_role_remove"
      },
      requestId: "req_workspace_role_remove"
    }
  );

  assert.deepEqual(
    V2OrganizationServiceAccountsResponseSchema.parse({
      data: {
        organizationId: "org_123",
        serviceAccounts: [
          {
            serviceAccountId: "svc_org_writer",
            organizationId: "org_123",
            name: "Organization Writer",
            status: "ACTIVE",
            createdByUserId: "user_creator",
            lastUsedAt: "2026-04-28T12:00:00.000Z",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-28T01:00:00.000Z"
          }
        ]
      },
      requestId: "req_org_service_accounts"
    }),
    {
      data: {
        organizationId: "org_123",
        serviceAccounts: [
          {
            serviceAccountId: "svc_org_writer",
            organizationId: "org_123",
            name: "Organization Writer",
            status: "ACTIVE",
            createdByUserId: "user_creator",
            lastUsedAt: "2026-04-28T12:00:00.000Z",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-28T01:00:00.000Z"
          }
        ]
      },
      requestId: "req_org_service_accounts"
    }
  );

  assert.deepEqual(
    V2OrganizationAuditEventsResponseSchema.parse({
      data: {
        organizationId: "org_123",
        auditEvents: [
          {
            auditEventId: "audit_123",
            actorKind: "USER",
            actorId: "human-user-user_123",
            actorUserId: "user_123",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            action: "story.read",
            resourceType: "story",
            resourceId: "story_123",
            requestId: "req_audit",
            traceId: "trace_audit",
            createdAt: "2026-04-28T12:00:00.000Z"
          }
        ],
        pagination: {
          nextCursor: "cursor_123"
        }
      },
      requestId: "req_org_audit_events"
    }),
    {
      data: {
        organizationId: "org_123",
        auditEvents: [
          {
            auditEventId: "audit_123",
            actorKind: "USER",
            actorId: "human-user-user_123",
            actorUserId: "user_123",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            action: "story.read",
            resourceType: "story",
            resourceId: "story_123",
            requestId: "req_audit",
            traceId: "trace_audit",
            createdAt: "2026-04-28T12:00:00.000Z"
          }
        ],
        pagination: {
          nextCursor: "cursor_123"
        }
      },
      requestId: "req_org_audit_events"
    }
  );

  assert.deepEqual(
    V2WorkspaceServiceAccountsResponseSchema.parse({
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        serviceAccounts: [
          {
            serviceAccountId: "svc_workspace_writer",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            name: "Workspace Writer",
            status: "ACTIVE",
            createdByUserId: "user_creator",
            lastUsedAt: "2026-04-28T12:00:00.000Z",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-28T01:00:00.000Z"
          }
        ]
      },
      requestId: "req_workspace_service_accounts"
    }),
    {
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        serviceAccounts: [
          {
            serviceAccountId: "svc_workspace_writer",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            name: "Workspace Writer",
            status: "ACTIVE",
            createdByUserId: "user_creator",
            lastUsedAt: "2026-04-28T12:00:00.000Z",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-28T01:00:00.000Z"
          }
        ]
      },
      requestId: "req_workspace_service_accounts"
    }
  );

  assert.deepEqual(V2ServiceAccountCreateRequestSchema.parse({ name: "  Workspace automation  " }), {
    name: "Workspace automation"
  });
  assert.equal(
    V2ServiceAccountCreateRequestSchema.safeParse({
      name: "Workspace automation",
      apiKeyScopes: ["story.write"]
    }).success,
    false
  );
  assert.equal(V2ServiceAccountCreateRequestSchema.safeParse({ name: "" }).success, false);

  const serviceAccountCreateResponse = {
    data: {
      serviceAccountId: "svc_workspace_automation",
      organizationId: "org_123",
      workspaceId: "workspace_123",
      name: "Workspace automation",
      status: "ACTIVE",
      createdByUserId: "user_creator",
      createdAt: "2026-04-28T00:00:00.000Z",
      updatedAt: "2026-04-28T00:00:00.000Z",
      created: true
    },
    idempotency: {
      status: "created",
      key: "retry-key:service-account-create",
      requestId: "req_service_account_create"
    },
    requestId: "req_service_account_create"
  };
  assert.deepEqual(V2ServiceAccountCreateResponseSchema.parse(serviceAccountCreateResponse), serviceAccountCreateResponse);
  assert.equal(
    V2ServiceAccountCreateResponseSchema.safeParse({
      ...serviceAccountCreateResponse,
      data: {
        ...serviceAccountCreateResponse.data,
        rawApiKey: "tmr_secret"
      }
    }).success,
    false
  );
  assert.equal(
    V2ServiceAccountCreateResponseSchema.safeParse({
      ...serviceAccountCreateResponse,
      data: {
        serviceAccountId: "svc_workspace_automation",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        name: "Workspace automation",
        status: "ACTIVE",
        createdAt: "2026-04-28T00:00:00.000Z",
        updatedAt: "2026-04-28T00:00:00.000Z",
        created: true
      }
    }).success,
    false
  );

  const serviceAccountRevocationResponse = {
    data: {
      serviceAccountId: "svc_workspace_automation",
      organizationId: "org_123",
      workspaceId: "workspace_123",
      name: "Workspace automation",
      status: "REVOKED",
      createdByUserId: "user_creator",
      revokedAt: "2026-04-29T00:00:00.000Z",
      createdAt: "2026-04-28T00:00:00.000Z",
      updatedAt: "2026-04-29T00:00:00.000Z",
      previousStatus: "ACTIVE",
      revoked: true,
      revokedApiKeyCount: 2
    },
    idempotency: {
      status: "created",
      key: "retry-key:service-account-revoke",
      requestId: "req_service_account_revoke"
    },
    requestId: "req_service_account_revoke"
  };
  assert.deepEqual(
    V2ServiceAccountRevocationResponseSchema.parse(serviceAccountRevocationResponse),
    serviceAccountRevocationResponse
  );
  assert.equal(
    V2ServiceAccountRevocationResponseSchema.safeParse({
      ...serviceAccountRevocationResponse,
      data: {
        ...serviceAccountRevocationResponse.data,
        keyPrefix: "tmr_live"
      }
    }).success,
    false
  );
  assert.equal(
    V2ServiceAccountRevocationResponseSchema.safeParse({
      ...serviceAccountRevocationResponse,
      data: {
        ...serviceAccountRevocationResponse.data,
        status: "SUSPENDED"
      }
    }).success,
    false
  );

  assert.deepEqual(
    V2OrganizationApiKeysResponseSchema.parse({
      data: {
        organizationId: "org_123",
        apiKeys: [
          {
            apiKeyId: "api_key_org_writer",
            organizationId: "org_123",
            serviceAccountId: "svc_org_writer",
            name: "Organization Writer Key",
            status: "EXPIRED",
            expiresAt: "2026-05-28T00:00:00.000Z",
            lastUsedAt: "2026-04-28T12:00:00.000Z",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-28T01:00:00.000Z"
          }
        ]
      },
      requestId: "req_org_api_keys"
    }),
    {
      data: {
        organizationId: "org_123",
        apiKeys: [
          {
            apiKeyId: "api_key_org_writer",
            organizationId: "org_123",
            serviceAccountId: "svc_org_writer",
            name: "Organization Writer Key",
            status: "EXPIRED",
            expiresAt: "2026-05-28T00:00:00.000Z",
            lastUsedAt: "2026-04-28T12:00:00.000Z",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-28T01:00:00.000Z"
          }
        ]
      },
      requestId: "req_org_api_keys"
    }
  );

  assert.deepEqual(
    V2WorkspaceApiKeysResponseSchema.parse({
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        apiKeys: [
          {
            apiKeyId: "api_key_workspace_writer",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            serviceAccountId: "svc_workspace_writer",
            name: "Workspace Writer Key",
            status: "ACTIVE",
            expiresAt: "2026-05-28T00:00:00.000Z",
            lastUsedAt: "2026-04-28T12:00:00.000Z",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-28T01:00:00.000Z"
          }
        ]
      },
      requestId: "req_workspace_api_keys"
    }),
    {
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        apiKeys: [
          {
            apiKeyId: "api_key_workspace_writer",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            serviceAccountId: "svc_workspace_writer",
            name: "Workspace Writer Key",
            status: "ACTIVE",
            expiresAt: "2026-05-28T00:00:00.000Z",
            lastUsedAt: "2026-04-28T12:00:00.000Z",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-28T01:00:00.000Z"
          }
        ]
      },
      requestId: "req_workspace_api_keys"
    }
  );

  assert.deepEqual(
    V2ApiKeyCreateRequestSchema.parse({
      name: "  Workspace Writer Key  ",
      serviceAccountId: "  svc_workspace_writer  ",
      expiresAt: "2026-05-28T00:00:00.000Z"
    }),
    {
      name: "Workspace Writer Key",
      serviceAccountId: "svc_workspace_writer",
      expiresAt: "2026-05-28T00:00:00.000Z"
    }
  );
  assert.equal(
    V2ApiKeyCreateRequestSchema.safeParse({
      name: "Workspace Writer Key",
      serviceAccountId: "svc_workspace_writer",
      scopes: ["story.write"]
    }).success,
    false
  );
  assert.equal(
    V2ApiKeyCreateRequestSchema.safeParse({
      name: "Workspace Writer Key",
      serviceAccountId: "svc_workspace_writer",
      metadata: {
        purpose: "ci"
      }
    }).success,
    false
  );
  assert.equal(
    V2ApiKeyCreateRequestSchema.safeParse({
      name: "Workspace Writer Key",
      userId: "user_123"
    }).success,
    false
  );

  const apiKeyCreateResponse = {
    data: {
      apiKeyId: "api_key_workspace_writer",
      organizationId: "org_123",
      workspaceId: "workspace_123",
      serviceAccountId: "svc_workspace_writer",
      name: "Workspace Writer Key",
      status: "ACTIVE",
      secretAvailable: true,
      apiKey: "tmr_test_abcdefghijklmnopqrstuvwxyz1234567890",
      keyPrefix: "tmr_live",
      expiresAt: "2026-05-28T00:00:00.000Z",
      createdAt: "2026-04-28T00:00:00.000Z",
      updatedAt: "2026-04-28T00:00:00.000Z",
      created: true
    },
    idempotency: {
      status: "created",
      key: "retry-key:api-key-create",
      requestId: "req_api_key_create"
    },
    requestId: "req_api_key_create"
  };
  assert.deepEqual(V2ApiKeyCreateResponseSchema.parse(apiKeyCreateResponse), apiKeyCreateResponse);
  assert.equal(
    V2ApiKeyCreateResponseSchema.safeParse({
      ...apiKeyCreateResponse,
      data: {
        ...apiKeyCreateResponse.data,
        keyHash: "hashed_secret"
      }
    }).success,
    false
  );
  assert.equal(
    V2ApiKeyCreateResponseSchema.safeParse({
      ...apiKeyCreateResponse,
      data: {
        ...apiKeyCreateResponse.data,
        scopes: ["story.write"]
      }
    }).success,
    false
  );
  assert.equal(
    V2ApiKeyCreateResponseSchema.safeParse({
      ...apiKeyCreateResponse,
      data: {
        ...apiKeyCreateResponse.data,
        userId: "user_123"
      }
    }).success,
    false
  );
  assert.equal(
    V2ApiKeyCreateResponseSchema.safeParse({
      ...apiKeyCreateResponse,
      data: {
        ...apiKeyCreateResponse.data,
        apiKey: "too-short"
      }
    }).success,
    false
  );
  assert.equal(
    V2ApiKeyCreateResponseSchema.safeParse({
      ...apiKeyCreateResponse,
      data: {
        ...apiKeyCreateResponse.data,
        secretAvailable: false
      }
    }).success,
    false
  );
  assert.equal(
    V2ApiKeyCreateResponseSchema.safeParse({
      ...apiKeyCreateResponse,
      data: {
        apiKeyId: "api_key_workspace_writer",
        organizationId: "org_123",
        workspaceId: "workspace_123",
        serviceAccountId: "svc_workspace_writer",
        name: "Workspace Writer Key",
        status: "ACTIVE",
        secretAvailable: true,
        keyPrefix: "tmr_live",
        expiresAt: "2026-05-28T00:00:00.000Z",
        createdAt: "2026-04-28T00:00:00.000Z",
        updatedAt: "2026-04-28T00:00:00.000Z",
        created: true
      }
    }).success,
    false
  );
  const apiKeyCreateReplayResponse = {
    data: {
      apiKeyId: "api_key_workspace_writer",
      organizationId: "org_123",
      workspaceId: "workspace_123",
      serviceAccountId: "svc_workspace_writer",
      name: "Workspace Writer Key",
      status: "ACTIVE",
      secretAvailable: false,
      keyPrefix: "tmr_live",
      expiresAt: "2026-05-28T00:00:00.000Z",
      createdAt: "2026-04-28T00:00:00.000Z",
      updatedAt: "2026-04-28T00:00:00.000Z",
      created: true
    },
    idempotency: {
      status: "replayed",
      key: "retry-key:api-key-create",
      requestId: "req_api_key_create_replay"
    },
    requestId: "req_api_key_create_replay"
  };
  assert.deepEqual(
    V2ApiKeyCreateResponseSchema.parse(apiKeyCreateReplayResponse),
    apiKeyCreateReplayResponse
  );
  assert.equal(
    V2ApiKeyCreateResponseSchema.safeParse({
      ...apiKeyCreateReplayResponse,
      data: {
        ...apiKeyCreateReplayResponse.data,
        apiKey: "tmr_test_abcdefghijklmnopqrstuvwxyz1234567890"
      }
    }).success,
    false
  );
  assert.equal(
    V2ApiKeyCreateResponseSchema.safeParse({
      ...apiKeyCreateReplayResponse,
      idempotency: {
        ...apiKeyCreateReplayResponse.idempotency,
        status: "created"
      }
    }).success,
    false
  );

  assert.deepEqual(
    V2WorkspaceAuditEventsResponseSchema.parse({
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        auditEvents: [
          {
            auditEventId: "audit_workspace_123",
            actorKind: "USER",
            actorId: "human-user-user_123",
            actorUserId: "user_123",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            action: "workspace.role.read",
            resourceType: "role",
            resourceId: "role_123",
            requestId: "req_workspace_audit",
            createdAt: "2026-04-28T12:00:00.000Z"
          }
        ],
        pagination: {}
      },
      requestId: "req_workspace_audit_events"
    }),
    {
      data: {
        organizationId: "org_123",
        workspaceId: "workspace_123",
        auditEvents: [
          {
            auditEventId: "audit_workspace_123",
            actorKind: "USER",
            actorId: "human-user-user_123",
            actorUserId: "user_123",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            action: "workspace.role.read",
            resourceType: "role",
            resourceId: "role_123",
            requestId: "req_workspace_audit",
            createdAt: "2026-04-28T12:00:00.000Z"
          }
        ],
        pagination: {}
      },
      requestId: "req_workspace_audit_events"
    }
  );
});

test("@machinesroom/contracts validates PR56 V2 content read envelopes", () => {
  const translation = {
    requestedLanguage: "fr",
    servedLanguage: "fr",
    status: "translated",
    provider: "LOCAL_CTRANSLATE2_OPUS_MT",
    providerModel: "Helsinki-NLP/opus-mt-en-fr",
    qualityStatus: "ACCEPTED",
    qualityScore: 32,
    sourceRevisionHash: "article-revision-1",
    glossaryVersion: "golden-v1",
    instructionVersion: "golden-v1",
    artifactId: "translation_123",
    updatedAt: "2026-05-19T00:00:00.000Z"
  };
  const story = {
    id: "story_123",
    title: "Story title",
    state: "PROVISIONAL",
    editorialState: "PROVISIONAL",
    promotionState: "PROVISIONAL",
    publicationStage: "PROVISIONAL",
    reviewStatus: "CLEAR",
    room: "tech",
    language: "en",
    summary: ["A concise summary."],
    translation
  };

  assert.deepEqual(
    V2StoryDetailResponseSchema.parse({
      data: story,
      requestId: "req_v2_story_detail"
    }),
    {
      data: story,
      requestId: "req_v2_story_detail"
    }
  );

  const machineRoom = {
    storyId: "story_123",
    packet: {
      id: "packet_123",
      hash: "sha256:packet",
      schemaVersion: 1,
      createdAt: "2026-04-30T00:00:00.000Z"
    },
    claims: [
      {
        id: "claim_123",
        text: "The claim under review.",
        citations: ["source_123"]
      }
    ],
    attestations: [
      {
        id: "attestation_123",
        botId: "bot_123",
        verified: true,
        role: "FACT_CHECK",
        signedAt: "2026-04-30T00:01:00.000Z"
      }
    ],
    objections: [
      {
        id: "objection_123",
        botId: "bot_456",
        verified: false,
        role: "RISK",
        severity: "MEDIUM",
        reason: "Needs stronger sourcing.",
        signedAt: "2026-04-30T00:02:00.000Z"
      }
    ],
    translation
  };

  assert.deepEqual(
    V2MachineRoomResponseSchema.parse({
      data: machineRoom,
      requestId: "req_v2_machine_room"
    }),
    {
      data: machineRoom,
      requestId: "req_v2_machine_room"
    }
  );

  assert.equal(
    V2MachineRoomResponseSchema.safeParse({
      data: {
        ...machineRoom,
        attestations: [
          {
            ...machineRoom.attestations[0],
            linkedHumanId: "human_123"
          }
        ]
      },
      requestId: "req_v2_machine_room_unredacted"
    }).success,
    false
  );
});

test("@machinesroom/contracts validates PR58 V2 agent read envelopes", () => {
  const agent = {
    botId: "bot_writer",
    source: "self-serve",
    status: "ACTIVE",
    trustTier: "VERIFIED",
    verified: true,
    allowedActions: ["candidate.create", "attestation.create"],
    joinedAt: "2026-04-30T00:00:00.000Z",
    verifiedAt: "2026-04-30T00:01:00.000Z",
    createdAt: "2026-04-30T00:00:00.000Z",
    updatedAt: "2026-04-30T00:01:00.000Z"
  };

  assert.deepEqual(
    V2AgentsResponseSchema.parse({
      data: {
        agents: [agent]
      },
      requestId: "req_v2_agents"
    }),
    {
      data: {
        agents: [agent]
      },
      requestId: "req_v2_agents"
    }
  );

  assert.deepEqual(
    V2AgentResponseSchema.parse({
      data: {
        agent
      },
      requestId: "req_v2_agent"
    }),
    {
      data: {
        agent
      },
      requestId: "req_v2_agent"
    }
  );

  assert.equal(
    V2AgentResponseSchema.safeParse({
      data: {
        agent: {
          ...agent,
          linkedHumanId: "human_secret"
        }
      },
      requestId: "req_v2_agent_unredacted"
    }).success,
    false
  );
});

test("@machinesroom/contracts validates idempotency keys", () => {
  assert.equal(IdempotencyKeySchema.safeParse("retry-key:123").success, true);
  assert.equal(IdempotencyKeySchema.safeParse("bad space").success, false);
});

test("@machinesroom/contracts validates idempotency payload hashes", () => {
  const payloadHash = "a".repeat(64);
  assert.equal(PayloadHashSchema.safeParse(payloadHash).success, true);
  assert.equal(PayloadHashSchema.safeParse("not-a-sha").success, false);
  assert.equal(IdempotencyRequestSchema.safeParse({ key: "retry-key:123", operation: " ", payloadHash }).success, false);
  assert.deepEqual(
    IdempotencyRequestSchema.parse({
      key: "retry-key:123",
      operation: "story.comment.create",
      payloadHash
    }),
    {
      key: "retry-key:123",
      operation: "story.comment.create",
      payloadHash
    }
  );
});

test("@machinesroom/contracts validates public feed read models", () => {
  const parsed = FeedResponseSchema.parse({
    items: [
      {
        storyId: "story-1",
        clusterId: "cluster-1",
        title: "Story",
        room: "tech",
        language: "en",
        state: "CONTESTED",
        editorialState: "CONTESTED",
        promotionState: "PROVISIONAL",
        publicationStage: "CANDIDATE",
        reviewStatus: "EMERGING",
        updatedAt: "2026-04-28T00:00:00.000Z",
        summary: ["One line"],
        sourceCount: 2,
        translation: {
          requestedLanguage: "es",
          servedLanguage: "en",
          status: "source_fallback",
          sourceRevisionHash: "article-revision-1"
        }
      }
    ],
    nextCursor: "cursor-1"
  });

  assert.equal(parsed.items[0]?.room, "tech");
  assert.equal(parsed.items[0]?.translation?.servedLanguage, "en");
  assert.equal(parsed.nextCursor, "cursor-1");
});
