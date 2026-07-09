import assert from "node:assert/strict";
import test from "node:test";
import {
  ApiErrorSchema,
  FeedResponseSchema,
  IdempotencyKeySchema,
  MachineRoomAgentCandidateCreateRequestSchema,
  MachineRoomArticleDocumentSchema,
  MachineRoomArticleWriteDocumentSchema,
  validateMachineRoomArticleDocumentReferences,
  IdempotencyRequestSchema,
  MachineRoomArticleDocumentV1Schema,
  MachineRoomResponseSchema,
  PayloadHashSchema,
  GateOneV2PreflightRunResponseSchema,
  PublishComputeResponseSchema,
  RequestIdSchema,
  StoryDetailSchema,
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
      bots: "https://machinesroom.com/agents",
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

test("@machinesroom/contracts validates publish compute response envelopes", () => {
  const candidateHash = "a".repeat(64);
  const packetHash = `sha256:${candidateHash}`;
  const policyDigest = `sha256:${"b".repeat(64)}`;
  const readinessHash = `sha256:${"c".repeat(64)}`;
  const payload = {
    candidateHash,
    storyId: "story-1",
    editorialPass: true,
    safetyDecision: "ALLOW",
    copyrightDecision: "ALLOW",
    gateOneV2SafetyGateHandoff: {
      schemaVersion: "1.0",
      mode: "SHADOW",
      publicationEffect: "NONE",
      status: "READY",
      consensusEvaluationEnabled: true,
      safetyGateEnforcedInV1: true,
      v2SafetyGateRequired: true,
      storyId: "story-1",
      packetHash,
      renderedSafetyDecision: "ALLOW",
      consensusSafetyDecision: "ALLOW",
      editorialPass: true,
      safetyAllowsPublication: true,
      v2EligibleAfterSafety: true,
      consensusEvaluationRequest: {
        path: "/v2/internal/stories/story-1/consensus/evaluate",
        body: { packetHash, safetyDecision: "ALLOW" }
      },
      blockers: []
    },
    gateOneV2PublishReadiness: {
      schemaVersion: "1.0",
      mode: "SHADOW",
      publicationEffect: "NONE",
      advisoryOnly: true,
      storyId: "story-1",
      packetHash,
      generatedAt: "2026-06-24T12:05:00.000Z",
      policy: {
        id: "gate-one-v2-mvp",
        version: "2.2.0",
        digest: policyDigest,
        globalState: "ENFORCE",
        canaryPercent: 100
      },
      enforcementRequested: false,
      enforcementState: "DISABLED",
      enforcementActive: false,
      controlState: "NOT_READY",
      v1Publishable: true,
      v1Blockers: [],
      safetyGate: { decision: "ALLOW", allowsPublication: true },
      consensus: null,
      wouldAllowPublicationIfPolicyEnabled: false,
      readyForPolicyPromotion: false,
      blockers: ["gate_one_v2_consensus_enforcement_disabled", "gate_one_v2_consensus_evaluation_missing"],
      readinessHash
    },
    gateOneV2PublishEnforcement: {
      schemaVersion: "1.0",
      policy: {
        id: "gate-one-v2-mvp",
        version: "2.2.0",
        digest: policyDigest,
        globalState: "ENFORCE",
        canaryPercent: 100
      },
      enforcementRequested: false,
      enforcementActive: false,
      mode: "DISABLED",
      publicationEffect: "NONE",
      canary: { configuredPercent: 100, cohortPercent: 42.5, included: true },
      legacyPublishable: true,
      finalPublishable: true,
      v2ControlsSatisfied: false,
      safetyGateAllowsPublication: true,
      consensusAllowsPublication: false,
      consensusPolicyMatches: false,
      readinessHash,
      blockers: ["gate_one_v2_consensus_enforcement_disabled", "gate_one_v2_consensus_evaluation_missing"]
    },
    publishable: true,
    blockers: [],
    scan: {
      pass: "SCAN2_RENDERED",
      hardBlock: false,
      decisionHash: "safety-decision-hash",
      reasons: [],
      rationale: "SafetyGate allowed publication."
    },
    copyrightScan: {
      lane: "deep",
      decision: "ALLOW",
      sourceCount: 2,
      missingSourceTextCount: 0,
      candidateSignatureCount: 10,
      maxOverlapSignatureCount: 1,
      maxSourceSignatureCount: 10,
      maxOverlapRatio: 0.1,
      rationale: ["ALLOW"]
    }
  };

  assert.equal(PublishComputeResponseSchema.parse(payload).gateOneV2PublishEnforcement.publicationEffect, "NONE");
  const activeEnforcementPayload = {
    ...payload,
    gateOneV2PublishEnforcement: {
      ...payload.gateOneV2PublishEnforcement,
      policy: {
        ...payload.gateOneV2PublishEnforcement.policy,
        globalState: "ENFORCE",
        canaryPercent: 100
      },
      enforcementRequested: true,
      enforcementActive: true,
      mode: "ENFORCE",
      publicationEffect: "V2_ENFORCED",
      canary: {
        configuredPercent: 100,
        cohortPercent: 42.5,
        included: true
      },
      finalPublishable: false,
      consensusPolicyMatches: true,
      blockers: ["gate_one_v2_consensus_not_allow"]
    },
    publishable: false,
    blockers: ["gate_one_v2_consensus_not_allow"]
  };

  assert.equal(
    PublishComputeResponseSchema.parse(activeEnforcementPayload).gateOneV2PublishEnforcement.publicationEffect,
    "V2_ENFORCED"
  );
  const activeAllowPayload = {
    ...payload,
    gateOneV2PublishEnforcement: {
      ...activeEnforcementPayload.gateOneV2PublishEnforcement,
      v2ControlsSatisfied: true,
      consensusAllowsPublication: true,
      consensusPolicyMatches: true,
      finalPublishable: true,
      blockers: []
    },
    publishable: true,
    blockers: []
  };
  assert.equal(PublishComputeResponseSchema.parse(activeAllowPayload).gateOneV2PublishEnforcement.finalPublishable, true);
  assert.throws(() =>
    PublishComputeResponseSchema.parse({
      ...activeEnforcementPayload,
      publishable: true
    })
  );
  assert.throws(() =>
    PublishComputeResponseSchema.parse({
      ...activeEnforcementPayload,
      blockers: []
    })
  );
  assert.throws(() =>
    PublishComputeResponseSchema.parse({
      ...activeEnforcementPayload,
      gateOneV2PublishEnforcement: {
        ...activeEnforcementPayload.gateOneV2PublishEnforcement,
        policy: {
          ...activeEnforcementPayload.gateOneV2PublishEnforcement.policy,
          canaryPercent: 0
        },
        canary: {
          ...activeEnforcementPayload.gateOneV2PublishEnforcement.canary,
          configuredPercent: 0,
          included: true
        }
      }
    })
  );
  assert.throws(() =>
    PublishComputeResponseSchema.parse({
      ...activeEnforcementPayload,
      gateOneV2PublishEnforcement: {
        ...activeEnforcementPayload.gateOneV2PublishEnforcement,
        canary: {
          ...activeEnforcementPayload.gateOneV2PublishEnforcement.canary,
          configuredPercent: 5,
          included: true
        }
      }
    })
  );
  assert.throws(() =>
    PublishComputeResponseSchema.parse({
      ...activeEnforcementPayload,
      gateOneV2PublishEnforcement: {
        ...activeEnforcementPayload.gateOneV2PublishEnforcement,
        blockers: ["unrelated_blocker"]
      },
      blockers: ["unrelated_blocker"]
    })
  );
  assert.throws(() =>
    PublishComputeResponseSchema.parse({
      ...activeEnforcementPayload,
      gateOneV2PublishEnforcement: {
        ...activeEnforcementPayload.gateOneV2PublishEnforcement,
        enforcementActive: false
      }
    })
  );
  assert.throws(() =>
    PublishComputeResponseSchema.parse({
      ...activeEnforcementPayload,
      gateOneV2PublishEnforcement: {
        ...activeEnforcementPayload.gateOneV2PublishEnforcement,
        v2ControlsSatisfied: true
      }
    })
  );
  assert.throws(() =>
    PublishComputeResponseSchema.parse({
      ...activeEnforcementPayload,
      gateOneV2PublishEnforcement: {
        ...activeEnforcementPayload.gateOneV2PublishEnforcement,
        finalPublishable: true
      }
    })
  );
  assert.throws(() =>
    PublishComputeResponseSchema.parse({
      ...activeEnforcementPayload,
      gateOneV2PublishEnforcement: {
        ...activeEnforcementPayload.gateOneV2PublishEnforcement,
        blockers: []
      }
    })
  );
  assert.throws(() =>
    PublishComputeResponseSchema.parse({
      ...payload,
      gateOneV2PublishEnforcement: {
        ...payload.gateOneV2PublishEnforcement,
        publicationEffect: "V2_ENFORCED"
      }
    })
  );
  assert.throws(() =>
    PublishComputeResponseSchema.parse({
      ...payload,
      gateOneV2PublishReadiness: {
        ...payload.gateOneV2PublishReadiness,
        enforcementActive: true,
        publicationEffect: "V2_ENFORCED"
      }
    })
  );
});

test("@machinesroom/contracts validates packet-bound Gate One V2 preflight run responses", () => {
  const storyId = "story-1";
  const packetId = "packet-1";
  const packetHash = `sha256:${"a".repeat(64)}`;
  const buildResult = (contractId: string, digestNibble: string) => ({
    id: `preflight:${contractId}:${digestNibble.repeat(32)}`,
    storyId,
    packetHash,
    contractId,
    contractVersion: "1.0.0",
    policyVersion: "2.2.0",
    verdict: "PASS",
    checks: [
      {
        checkId: `${contractId.toLowerCase()}.ok`,
        status: "PASS",
        severity: "LOW",
        objectRefs: [],
        publicMessage: "Preflight check passed."
      }
    ],
    requiredSpecialists: [],
    requiredDisclosures: [],
    deterministicInputHash: `sha256:${digestNibble.repeat(64)}`,
    startedAt: "2026-06-24T12:00:00.000Z",
    completedAt: "2026-06-24T12:00:01.000Z",
    implementationVersion: "gate-one-v2-p2-preflight@1.0.0",
    externalDependencySnapshot: {},
    persistence: {
      packetId,
      runId: `run-${contractId.toLowerCase()}`
    }
  });
  const payload = {
    storyId,
    packetId,
    packetHash,
    promotedToCurrent: false,
    satisfiedForConsensus: true,
    missingContractIds: [],
    failedContractIds: [],
    requiredSpecialists: [],
    requiredDisclosures: [],
    results: [
      buildResult("PACKET_INTEGRITY_V1", "1"),
      buildResult("PUBLICATION_QA_V1", "2"),
      buildResult("RIGHTS_ROUTING_V1", "3"),
      buildResult("LIFECYCLE_READINESS_V1", "4")
    ]
  };

  assert.equal(GateOneV2PreflightRunResponseSchema.parse(payload).results.length, 4);
  const packetIntegrityFailure = {
    ...payload,
    promotedToCurrent: false,
    satisfiedForConsensus: false,
    missingContractIds: ["PUBLICATION_QA_V1", "RIGHTS_ROUTING_V1", "LIFECYCLE_READINESS_V1"],
    failedContractIds: ["PACKET_INTEGRITY_V1"],
    results: [
      {
        ...buildResult("PACKET_INTEGRITY_V1", "5"),
        verdict: "FAIL",
        checks: [
          {
            checkId: "packet_integrity_v1.schema",
            status: "FAIL",
            severity: "CRITICAL",
            objectRefs: [],
            publicMessage: "Candidate Packet V2 schema validation failed."
          }
        ]
      }
    ]
  };

  assert.equal(GateOneV2PreflightRunResponseSchema.parse(packetIntegrityFailure).results.length, 1);
  assert.throws(() =>
    GateOneV2PreflightRunResponseSchema.parse({
      ...packetIntegrityFailure,
      satisfiedForConsensus: true
    })
  );
  assert.throws(() =>
    GateOneV2PreflightRunResponseSchema.parse({
      ...payload,
      satisfiedForConsensus: true,
      failedContractIds: [],
      results: payload.results.map((result, index) =>
        index === 0
          ? {
              ...result,
              verdict: "FAIL",
              checks: [
                {
                  checkId: "packet_integrity_v1.hash",
                  status: "FAIL",
                  severity: "CRITICAL",
                  objectRefs: [],
                  publicMessage: "Packet hash did not match the canonical packet."
                }
              ]
            }
          : result
      )
    })
  );
  assert.throws(() =>
    GateOneV2PreflightRunResponseSchema.parse({
      ...payload,
      results: [
        buildResult("PACKET_INTEGRITY_V1", "1"),
        buildResult("PUBLICATION_QA_V1", "2"),
        buildResult("RIGHTS_ROUTING_V1", "3"),
        buildResult("RIGHTS_ROUTING_V1", "4")
      ]
    })
  );
  assert.throws(() =>
    GateOneV2PreflightRunResponseSchema.parse({
      ...payload,
      results: payload.results.map((result, index) => (index === 0 ? { ...result, packetHash: `sha256:${"b".repeat(64)}` } : result))
    })
  );
});

test("@machinesroom/contracts preserves public article documents on story reads", () => {
  const article = {
    schemaVersion: 1,
    articleType: "analysis",
    dek: "A structured article document sits beside the evidence ledger.",
    revisionHash: "a".repeat(64),
    updatedAt: "2026-05-30T12:00:00.000Z",
    document: {
      schemaVersion: 1,
      blocks: [
        {
          type: "paragraph",
          text: [
            { text: "Readable article prose with " },
            { text: "claim evidence", marks: [{ type: "claimRef", claimId: "claim-1" }] },
            { text: " and " },
            { text: "source evidence", marks: [{ type: "sourceRef", sourceKey: "source-1" }] },
            { text: "." }
          ]
        },
        {
          type: "factBox",
          title: "What to know",
          items: [[{ text: "Article blocks must survive SDK response parsing." }]],
          sourceRefs: ["source-1"]
        }
      ]
    }
  };

  const story = StoryDetailSchema.parse({
    id: "story-1",
    title: "Structured story",
    state: "PROVISIONAL",
    editorialState: "PROVISIONAL",
    promotionState: "PROVISIONAL",
    publicationStage: "CANDIDATE",
    reviewStatus: "EMERGING",
    room: "world",
    language: "en",
    summary: ["One summary bullet."],
    article
  });

  assert.equal(story.article?.document.blocks[0]?.type, "paragraph");
  assert.equal(story.article?.document.blocks[1]?.type, "factBox");

  const machineRoom = MachineRoomResponseSchema.parse({
    storyId: "story-1",
    packet: {
      id: "packet-1",
      hash: "b".repeat(64),
      schemaVersion: 2,
      createdAt: "2026-05-30T12:00:00.000Z"
    },
    article,
    claims: [{ id: "claim-row-1", key: "claim-1", text: "Atomic claim.", citations: ["source-1"] }],
    attestations: [],
    objections: [],
    gateOneV2ShadowAdvisoryReceipt: {
      schemaVersion: "1.0",
      advisoryOnly: true,
      redactionVersion: "gate-one-v2-shadow-advisory-public-v1",
      storyId: "story-1",
      packetId: "packet-gate-one-v2-shadow-1",
      packetHash: "c".repeat(64),
      generatedAt: "2026-05-30T12:01:00.000Z",
      publicationEffect: "NONE",
      receiptHash: `sha256:${"d".repeat(64)}`,
      lanes: [
        {
          lane: "FAIRNESS_REPLY",
          runId: "shadow-run-1",
          mode: "SHADOW",
          policyVersion: "2.2.0",
          policyDigest: `sha256:${"e".repeat(64)}`,
          rubricVersion: "FAIRNESS_REPLY_RUBRIC_V1",
          verdict: "PASS",
          deterministicInputHash: `sha256:${"f".repeat(64)}`,
          implementationVersion: "gate-one-p3-shadow-v1",
          publicRationale: "No public fairness advisory findings.",
          requiredDisclosureIds: [],
          requiredSpecialistTypes: [],
          checks: [
            {
              checkId: "FAIRNESS_REPLY.NO_REPLY_REQUIRED",
              status: "PASS",
              severity: "LOW",
              claimIds: ["claim-row-1"],
              evidenceIds: [],
              objectRefs: ["claim:claim-row-1"],
              publicRationale: "No reply handling issue detected.",
              requiredDisclosureIds: [],
              requiredSpecialistTypes: []
            }
          ],
          createdAt: "2026-05-30T12:00:30.000Z"
        }
      ]
    },
    gateOneV2ConsensusReceipt: {
      schemaVersion: "1.0",
      advisoryOnly: true,
      redactionVersion: "gate-one-v2-consensus-public-v1",
      storyId: "story-1",
      packetId: "packet-gate-one-v2-consensus-1",
      packetHash: "c".repeat(64),
      generatedAt: "2026-05-30T12:02:00.000Z",
      publicationEffect: "NONE",
      receiptHash: `sha256:${"a".repeat(64)}`,
      consensus: {
        evaluationId: "consensus-eval:packet-gate-one-v2-consensus-1:1",
        mode: "SHADOW",
        policyVersion: "2.2.0",
        policyDigest: `sha256:${"e".repeat(64)}`,
        profile: "STANDARD",
        terminalStatus: "PENDING",
        terminalStep: "REVIEW_ELIGIBILITY",
        wouldAllowPublication: false,
        approved: false,
        blocked: false,
        targetState: "CONTESTED",
        reasonCodes: ["LANE_SIGNERS_MISSING"],
        selectedReviewCount: 0,
        safetyDecision: "ALLOW",
        activeLegalHold: false,
        trustWeightPolicyApplied: false,
        deterministicTraceHash: `sha256:${"9".repeat(64)}`,
        implementationVersion: "gate-one-v2-p4-consensus-shadow@1.0.0",
        evaluatedAt: "2026-05-30T12:02:00.000Z"
      }
    },
    gateOneV2TrustReceipt: {
      schemaVersion: "1.0",
      advisoryOnly: true,
      redactionVersion: "gate-one-v2-public-trust-receipt-v1",
      storyId: "story-1",
      packetId: "packet-gate-one-v2-trust-1",
      packetHash: "c".repeat(64),
      generatedAt: "2026-05-30T12:03:00.000Z",
      publicationEffect: "NONE",
      mode: "PUBLIC_ADVISORY",
      policy: {
        version: "2.2.0",
        profile: "STANDARD",
        globalState: "ENFORCE",
        canaryPercent: 100
      },
      packet: {
        current: true,
        createdAt: "2026-05-30T12:00:00.000Z",
        language: "en",
        canonicalLanguage: "en",
        articleType: "STANDARD_NEWS",
        reportingOrigin: "LOCAL_REPORTING"
      },
      preflights: [
        {
          contractId: "PACKET_INTEGRITY_V1",
          status: "PASS",
          contractVersion: "1.0.0",
          checkCount: 3,
          requiredSpecialistCount: 0,
          requiredDisclosureCount: 0,
          completedAt: "2026-05-30T12:00:10.000Z",
          implementationVersion: "gate-one-v2-p2-preflights@1.0.0"
        }
      ],
      universalLanes: [
        {
          lane: "RISK",
          policyState: "ENFORCE",
          status: "ATTESTED",
          attestationCount: 1,
          latestSignedAt: "2026-05-30T12:01:00.000Z",
          verdicts: { BLOCK: 1 }
        },
        {
          lane: "FAIRNESS_REPLY",
          policyState: "ENFORCE",
          status: "ADVISORY_RUN_ONLY",
          attestationCount: 0,
          verdicts: {},
          advisoryRunVerdict: "PASS"
        }
      ],
      shadowLanes: [
        {
          lane: "EDITORIAL_INTEGRITY",
          policyState: "SHADOW",
          status: "NOT_RUN"
        }
      ],
      specialistRequirements: {
        conditionalOnly: true,
        status: "NONE",
        requiredTypes: [],
        requiredCount: 0
      },
      disclosures: {
        publicDisclosureIds: [],
        publicDisclosureCount: 0,
        renderReceiptStatus: "NOT_PUBLIC_IN_THIS_RECEIPT"
      },
      claims: {
        publicClaimCount: 1,
        items: [
          {
            id: "claim-row-1",
            text: "Atomic claim.",
            epistemicStatus: "VERIFIED",
            confidenceLanguage: "confirmed by public source",
            evidenceCount: 1,
            counterevidenceCount: 0
          }
        ]
      },
      provenance: {
        publicSourceCount: 1,
        publicEvidenceCount: 1,
        graphEntityCount: 0,
        graphActivityCount: 0,
        graphAgentCount: 0,
        graphAlternative: {
          summary: "1 public evidence object from 1 public source; 0 provenance graph nodes available as public counts.",
          publicEvidenceLimit: 20,
          publicEvidenceShown: 1,
          publicEvidenceTruncated: false,
          items: [
            {
              evidenceId: "evidence-row-1",
              publicSourceLabel: "Public source 1",
              sourceClass: "OFFICIAL",
              directness: "DIRECT",
              authenticityStatus: "VERIFIED",
              publicSummary: "Public minutes summary."
            }
          ]
        }
      },
      fairness: {
        affectedStakeholderCount: 0,
        rightOfReplyCount: 0,
        materialCounterevidenceCount: 0,
        alternativeExplanationCount: 0,
        knownUnknownCount: 0,
        fairnessExceptionCount: 0
      },
      consensus: {
        terminalStatus: "PENDING",
        terminalStep: "REVIEW_ELIGIBILITY",
        reasonCodes: ["LANE_SIGNERS_MISSING"],
        selectedReviewCount: 0,
        safetyDecision: "ALLOW",
        activeLegalHold: false,
        receiptHash: `sha256:${"a".repeat(64)}`
      },
      safety: {
        status: "RECORDED_IN_CONSENSUS",
        decision: "ALLOW"
      },
      lifecycle: {
        currentVersion: 1,
        challengeRoute: "/stories/story-1/challenge",
        correctionTaxonomyVersion: "corrections-v1",
        expiryPolicy: "gate-one-v2-attestation-ttl",
        correctionHooksVisible: true,
        previousVersionsPath: "/stories/story-1/versions",
        previousVersionsAvailable: false,
        translationDependencyCount: 0,
        cacheInvalidationDependencyCount: 1,
        staleReceipt: false
      },
      receiptHash: `sha256:${"7".repeat(64)}`
    }
  });

  assert.equal(machineRoom.article?.document.blocks[0]?.type, "paragraph");
  assert.equal(machineRoom.claims[0]?.key, "claim-1");
  assert.equal(machineRoom.gateOneV2ShadowAdvisoryReceipt?.publicationEffect, "NONE");
  assert.equal(machineRoom.gateOneV2ConsensusReceipt?.publicationEffect, "NONE");
  assert.equal(machineRoom.gateOneV2ConsensusReceipt?.consensus.mode, "SHADOW");
  assert.equal(machineRoom.gateOneV2TrustReceipt?.publicationEffect, "NONE");
  assert.equal(machineRoom.gateOneV2TrustReceipt?.universalLanes[0]?.verdicts.BLOCK, 1);

  const historicalMachineRoom = MachineRoomResponseSchema.parse({
    ...machineRoom,
    packet: {
      ...machineRoom.packet,
      id: "packet-gate-one-v2-trust-history",
      hash: "d".repeat(64)
    },
    gateOneV2TrustReceipt: {
      ...machineRoom.gateOneV2TrustReceipt!,
      packetId: "packet-gate-one-v2-trust-history",
      packetHash: "d".repeat(64),
      packet: {
        ...machineRoom.gateOneV2TrustReceipt!.packet,
        current: false
      },
      lifecycle: {
        ...machineRoom.gateOneV2TrustReceipt!.lifecycle,
        staleReceipt: true
      },
      receiptHash: `sha256:${"8".repeat(64)}`
    }
  });
  assert.equal(historicalMachineRoom.gateOneV2TrustReceipt?.packet.current, false);
  assert.equal(historicalMachineRoom.gateOneV2TrustReceipt?.lifecycle.staleReceipt, true);
});

test("@machinesroom/contracts mirrors article document runtime validation", () => {
  assert.equal(
    MachineRoomArticleDocumentV1Schema.safeParse({
      schemaVersion: 1,
      blocks: [
        {
          type: "paragraph",
          text: [{ text: "Unsafe links must fail public SDK validation.", marks: [{ type: "link", href: "javascript:alert(1)" }] }]
        }
      ]
    }).success,
    false
  );

  assert.equal(
    MachineRoomArticleDocumentV1Schema.safeParse({
      schemaVersion: 1,
      blocks: [{ type: "embed", provider: "url", url: "ftp://example.com/file" }]
    }).success,
    false
  );

  assert.equal(
    MachineRoomArticleDocumentV1Schema.safeParse({
      schemaVersion: 1,
      blocks: Array.from({ length: 31 }, () => ({
        type: "paragraph",
        text: [{ text: "x".repeat(10_000) }]
      }))
    }).success,
    false
  );

  assert.equal(
    MachineRoomArticleDocumentV1Schema.safeParse({
      schemaVersion: 1,
      blocks: [{ type: "image", assetId: "/images/example.png", alt: "Allowed image" }]
    }).success,
    true
  );

  assert.equal(
    MachineRoomArticleDocumentV1Schema.safeParse({
      schemaVersion: 1,
      blocks: [{ type: "image", assetId: "https://evil.example/tracker.png", alt: "Remote image" }]
    }).success,
    true
  );

  assert.equal(
    MachineRoomArticleWriteDocumentSchema.safeParse({
      schemaVersion: 1,
      blocks: [{ type: "image", assetId: "https://evil.example/tracker.png", alt: "Remote image" }]
    }).success,
    false
  );

  assert.equal(
    MachineRoomAgentCandidateCreateRequestSchema.safeParse({
      botId: "bot-123",
      verified: false,
      room: "world",
      language: "en",
      articleType: "news",
      title: "Candidate title",
      summary: ["A short summary."],
      article: {
        schemaVersion: 1,
        blocks: [{ type: "image", assetId: "https://evil.example/tracker.png", alt: "Remote image" }]
      },
      claims: [{ id: "claim-1", text: "Evidence-backed claim.", citations: ["source-1"] }],
      sources: [{ sourceKey: "source-1", sourceName: "Example", url: "https://example.com" }]
    }).success,
    false
  );
});

test("@machinesroom/contracts validates request IDs", () => {
  assert.equal(RequestIdSchema.safeParse("req_123").success, true);
  assert.equal(RequestIdSchema.safeParse("").success, false);
  assert.equal(RequestIdSchema.safeParse("x".repeat(129)).success, false);
});

test("@machinesroom/contracts validates agent candidate payloads and article references", () => {
  const candidate = {
    botId: "bot-123",
    verified: false,
    room: "world",
    language: "en",
    articleType: "news",
    title: "Candidate title",
    summary: ["A short summary."],
    article: {
      schemaVersion: 1,
      blocks: [
        {
          type: "paragraph",
          text: [
            { text: "Known claim", marks: [{ type: "claimRef", claimId: "claim-1" }] },
            { text: " with source", marks: [{ type: "sourceRef", sourceKey: "source-1" }] }
          ]
        }
      ]
    },
    claims: [{ id: "claim-1", text: "Evidence-backed claim.", citations: ["source-1"] }],
    sources: [{ sourceKey: "source-1", sourceName: "Example", url: "https://example.com" }]
  };

  const parsed = MachineRoomAgentCandidateCreateRequestSchema.safeParse(candidate);
  assert.equal(parsed.success, true);
  if (!parsed.success) return;

  assert.deepEqual(
    validateMachineRoomArticleDocumentReferences({
      document: parsed.data.article!,
      claimKeys: ["claim-1"],
      sourceKeys: ["source-1", "https://example.com"]
    }),
    []
  );

  const badDocument = MachineRoomArticleDocumentSchema.parse({
    schemaVersion: 1,
    blocks: [
      {
        type: "paragraph",
        text: [{ text: "Unknown", marks: [{ type: "claimRef", claimId: "claim-missing" }] }]
      },
      {
        type: "quote",
        text: [{ text: "Unknown source" }],
        sourceRefs: ["source-missing"]
      }
    ]
  });

  assert.deepEqual(
    validateMachineRoomArticleDocumentReferences({
      document: badDocument,
      claimKeys: ["claim-1"],
      sourceKeys: ["source-1"]
    }),
    [
      "blocks[0].text[0] references unknown claimId 'claim-missing'",
      "blocks[1].sourceRefs references unknown sourceKey 'source-missing'"
    ]
  );
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
      apiKey: "tmr_live_abcdefghijklmnopqrstuvwxyz1234567890",
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
        apiKey: "tmr_live_abcdefghijklmnopqrstuvwxyz1234567890"
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
