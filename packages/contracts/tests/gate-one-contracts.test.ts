import assert from "node:assert/strict";
import test from "node:test";
import {
  GateOneCanonicalJsonError,
  GateOneCandidatePacketV2Schema,
  GateOneCreateLaneAttestationRequestV2Schema,
  GateOneLaneAttestationV2Schema,
  GateOnePreflightResultSchema,
  GateOneSpecialistReviewV2Schema,
  assertCandidatePacketV2Hash,
  buildLaneAttestationSignaturePayload,
  buildSpecialistReviewSignaturePayload,
  canonicalizeCandidatePacketV2,
  computeCandidatePacketV2Hash,
  stableGateOneDigest,
  stableGateOneStringify,
  structuredDecisionSignaturePayloadDigest,
  type GateOneCandidatePacketV2,
  type GateOneCreateLaneAttestationRequestV2,
  type GateOneLaneAttestationV2,
  type GateOnePreflightResult,
  type GateOneSpecialistReviewV2
} from "../src/index.js";

const ZERO_HASH = `sha256:${"0".repeat(64)}` as const;
const NOW = "2026-06-24T12:00:00.000Z";

function buildPacket(overrides: Partial<GateOneCandidatePacketV2> = {}): GateOneCandidatePacketV2 {
  const draft = GateOneCandidatePacketV2Schema.parse({
    schemaVersion: "2.0",
    packetId: "packet-1",
    storyId: "story-1",
    packetHash: ZERO_HASH,
    createdAt: NOW,
    createdByBotId: "writer-bot-1",
    policyProfile: "STANDARD",
    policyVersion: "2.2.0",
    highRiskFlags: [],
    room: "public-accountability",
    articleType: "news",
    language: "en",
    canonicalLanguage: "en",
    reportingOrigin: "ORIGINAL_REPORTING",
    title: "Agency publishes audit findings",
    summary: ["The agency published audit findings with supporting records."],
    article: {
      schemaVersion: "1.0",
      blocks: [
        {
          id: "block-1",
          type: "paragraph",
          text: "The agency published audit findings on Wednesday.",
          claimIds: ["claim-1"],
          evidenceIds: ["ev-1"],
          mediaIds: []
        }
      ]
    },
    claims: [
      {
        id: "claim-1",
        version: 1,
        text: "The agency published audit findings on Wednesday.",
        type: "FACTUAL",
        materiality: "MATERIAL",
        epistemicStatus: "VERIFIED",
        confidenceLanguage: "published",
        evidenceIds: ["ev-1"],
        counterevidenceIds: [],
        subjectIds: ["subject-agency"],
        publicNotes: "Supported by the public audit document."
      }
    ],
    sources: [
      {
        id: "source-1",
        version: 1,
        sourceClass: "OFFICIAL",
        controller: "Agency",
        originClusterId: "cluster-agency-audit",
        language: "en",
        directness: "DIRECT",
        retrievedAt: NOW,
        archiveStatus: "ARCHIVED"
      }
    ],
    evidence: [
      {
        id: "ev-1",
        version: 1,
        kind: "DOCUMENT",
        sourceId: "source-1",
        originClusterId: "cluster-agency-audit",
        uri: "https://example.test/audit",
        archiveUri: "https://archive.example.test/audit",
        contentHash: stableGateOneDigest({ document: "audit-v1" }),
        mimeType: "application/pdf",
        obtainedAt: NOW,
        accessStatus: "PUBLIC",
        authenticityStatus: "VERIFIED",
        transformationIds: [],
        publicSummary: "Public audit document."
      }
    ],
    media: [],
    provenanceGraph: {
      version: "1.0",
      entities: [{ id: "entity-audit", type: "document" }],
      activities: [{ id: "activity-retrieval", type: "retrieval", atTime: NOW }],
      agents: [{ id: "agent-agency", type: "organization", publicLabel: "Agency" }],
      edges: [{ type: "WAS_ATTRIBUTED_TO", fromId: "entity-audit", toId: "agent-agency" }]
    },
    fairnessReport: {
      version: "1.0",
      affectedStakeholders: [
        {
          stakeholderId: "subject-agency",
          role: "agency",
          materiality: "MEDIUM",
          representedInStory: true,
          representationEvidenceIds: ["ev-1"]
        }
      ],
      rightOfReply: [{ subjectId: "subject-agency", required: false, status: "NOT_REQUIRED", responseEvidenceIds: [] }],
      materialCounterevidenceIds: [],
      alternativeExplanations: [],
      knownUnknowns: [],
      uncertaintyTreatment: "No material uncertainty in the publication fact.",
      fairnessExceptions: []
    },
    disclosures: [],
    methods: {
      version: "1.0",
      byline: "writer-bot-1",
      methodSummary: "Packet assembled from public audit records.",
      aiAssistance: true,
      reviewedLanguages: ["en"]
    },
    translations: [],
    lifecycle: {
      version: "1.0",
      currentVersion: 1,
      claimAddressabilityMap: { "claim-1": "block-1" },
      correctionTaxonomyVersion: "corrections-v1",
      propagationTargets: ["article", "feed", "search", "machine-room"],
      challengeRoute: "/stories/story-1/challenge",
      expiryPolicy: "standard-24h",
      translationDependencies: [],
      cacheInvalidationDependencies: ["story:story-1", "feed:public-accountability"]
    },
    publicEnvelope: {
      claimIds: ["claim-1"],
      evidenceIds: ["ev-1"],
      disclosureIds: [],
      publicSummary: "Public audit document was reviewed; no sealed references are exposed.",
      redactionVersion: "public-redaction-v1"
    },
    ...overrides
  });

  return GateOneCandidatePacketV2Schema.parse({
    ...draft,
    packetHash: computeCandidatePacketV2Hash(draft)
  });
}

function buildAttestation(overrides: Partial<GateOneLaneAttestationV2> = {}): GateOneLaneAttestationV2 {
  return GateOneLaneAttestationV2Schema.parse({
    schemaVersion: "2.0",
    attestationId: "att-1",
    storyId: "story-1",
    packetHash: buildPacket().packetHash,
    lane: "FACT_CHECK",
    policyVersion: "2.2.0",
    rubricVersion: "FACT_CHECK_RUBRIC_V1",
    verdict: "PASS",
    checks: [
      {
        checkId: "FACT.CLAIM_SUPPORT",
        status: "PASS",
        severity: "LOW",
        claimIds: ["claim-1"],
        evidenceIds: ["ev-1"],
        objectRefs: ["claim:claim-1"],
        publicRationale: "The cited public audit document supports the claim.",
        requiredDisclosureIds: [],
        requiredSpecialistTypes: []
      }
    ],
    publicRationale: "The material claim is supported by the cited public audit document.",
    requiredDisclosureIds: [],
    declaredConflicts: [],
    reviewer: {
      botId: "fact-bot-1",
      controllingOwnerId: "owner-fact-1",
      verificationStatus: "VERIFIED",
      provider: "provider-a",
      modelFamily: "model-family-a",
      modelVersion: "model-a-2026-06",
      toolchainVersion: "fact-toolchain-v1",
      retrievalProviderIds: ["retrieval-a"],
      retrievalIndexVersions: ["index-a-1"],
      promptOrRubricDigest: stableGateOneDigest({ rubric: "FACT_CHECK_RUBRIC_V1" })
    },
    signedAt: NOW,
    nonce: "nonce-1234567890abcdef",
    keyVersion: "key-v1",
    signature: "sig-placeholder",
    ...overrides
  });
}

test("Gate One canonical JSON is deterministic and rejects unsupported values", () => {
  assert.equal(stableGateOneStringify({ b: "line\r\none", a: 1 }), stableGateOneStringify({ a: 1, b: "line\none" }));
  assert.throws(() => stableGateOneStringify({ value: Number.NaN }), GateOneCanonicalJsonError);
  assert.throws(() => stableGateOneStringify({ value: undefined }), GateOneCanonicalJsonError);
  assert.throws(() => stableGateOneStringify({ "\u00e9": "precomposed", "e\u0301": "combining" }), /duplicate key/);
});

test("Candidate Packet V2 hash is deterministic and excludes packetHash itself", () => {
  const packet = buildPacket();
  const samePacketDifferentHashField = { ...packet, packetHash: ZERO_HASH };

  assert.equal(computeCandidatePacketV2Hash(packet), packet.packetHash);
  assert.equal(computeCandidatePacketV2Hash(samePacketDifferentHashField), packet.packetHash);
  assert.equal(canonicalizeCandidatePacketV2(packet), canonicalizeCandidatePacketV2(samePacketDifferentHashField));
  assert.equal(assertCandidatePacketV2Hash(packet), packet);
  assert.throws(() => assertCandidatePacketV2Hash(samePacketDifferentHashField), /hash mismatch/);
});

test("Candidate Packet V2 material mutation changes the canonical hash", () => {
  const packet = buildPacket();
  const mutated = buildPacket({
    claims: [
      {
        ...packet.claims[0]!,
        text: "The agency published audit findings on Thursday."
      }
    ]
  });

  assert.notEqual(mutated.packetHash, packet.packetHash);
});

test("Candidate Packet V2 rejects missing material evidence and public sealed-envelope fields", () => {
  const packet = buildPacket();

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        claims: [{ ...packet.claims[0]!, evidenceIds: [] }]
      }),
    /material factual claims must reference evidence/
  );

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        publicEnvelope: {
          ...packet.publicEnvelope,
          sealedEnvelopeRef: "sealed://not-public"
        }
      }),
    /Unrecognized key/
  );

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        article: {
          ...packet.article,
          blocks: [{ ...packet.article.blocks[0]!, claimIds: ["claim-missing"] }]
        }
      }),
    /claim claim-missing is not defined/
  );

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        publicEnvelope: {
          ...packet.publicEnvelope,
          claimIds: ["claim-missing"]
        }
      }),
    /claim claim-missing is not defined/
  );

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        evidence: [{ ...packet.evidence[0]!, accessStatus: "SEALED" }],
        publicEnvelope: {
          ...packet.publicEnvelope,
          evidenceIds: ["ev-1"]
        }
      }),
    /must be PUBLIC/
  );

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        evidence: [{ ...packet.evidence[0]!, accessStatus: "SEALED" }],
        publicEnvelope: {
          ...packet.publicEnvelope,
          evidenceIds: []
        }
      }),
    /non-public evidence ev-1 must include sealedMetadataRef/
  );

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        evidence: [
          {
            ...packet.evidence[0]!,
            accessStatus: "RESTRICTED",
            sealedMetadataRef: "sealed://gate-one-v2/evidence/ev-1"
          }
        ],
        publicEnvelope: {
          ...packet.publicEnvelope,
          evidenceIds: []
        }
      }),
    /non-public evidence ev-1 must not include uri/
  );

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        evidence: [
          {
            ...packet.evidence[0]!,
            sealedMetadataRef: "sealed://gate-one-v2/evidence/ev-1"
          }
        ]
      }),
    /PUBLIC evidence ev-1 must not include sealedMetadataRef/
  );

  const { uri: _uri, archiveUri: _archiveUri, ...sealedEvidenceWithoutUrls } = packet.evidence[0]!;
  assert.doesNotThrow(() =>
    GateOneCandidatePacketV2Schema.parse({
      ...packet,
      claims: [
        {
          ...packet.claims[0]!,
          evidenceIds: ["ev-1"]
        }
      ],
      evidence: [
        {
          ...sealedEvidenceWithoutUrls,
          accessStatus: "SEALED",
          sealedMetadataRef: "sealed://gate-one-v2/evidence/ev-1"
        }
      ],
      publicEnvelope: {
        ...packet.publicEnvelope,
        evidenceIds: []
      }
    })
  );
});

test("Candidate Packet V2 rejects dangling nested packet references", () => {
  const packet = buildPacket();

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        sources: [{ ...packet.sources[0]!, independentSourceIds: ["source-missing"] }]
      }),
    /source source-missing is not defined/
  );

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        media: [
          {
            id: "media-1",
            evidenceId: "ev-missing",
            kind: "IMAGE",
            credentialStatus: "PRESENT_VALID",
            syntheticOrAlteredStatus: "NONE_KNOWN"
          }
        ]
      }),
    /evidence ev-missing is not defined/
  );

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        provenanceGraph: {
          ...packet.provenanceGraph,
          edges: [{ type: "USED", fromId: "entity-audit", toId: "node-missing" }]
        }
      }),
    /provenance node node-missing is not defined/
  );

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        fairnessReport: {
          ...packet.fairnessReport,
          affectedStakeholders: [{ ...packet.fairnessReport.affectedStakeholders[0]!, representationEvidenceIds: ["ev-missing"] }]
        }
      }),
    /evidence ev-missing is not defined/
  );

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        fairnessReport: {
          ...packet.fairnessReport,
          rightOfReply: [{ subjectId: "subject-agency", required: true, status: "RESPONDED", responseEvidenceIds: ["ev-missing"] }]
        }
      }),
    /evidence ev-missing is not defined/
  );

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        lifecycle: {
          ...packet.lifecycle,
          claimAddressabilityMap: { "claim-missing": "block-1" }
        }
      }),
    /claim claim-missing is not defined/
  );

  assert.throws(
    () =>
      GateOneCandidatePacketV2Schema.parse({
        ...packet,
        lifecycle: {
          ...packet.lifecycle,
          claimAddressabilityMap: { "claim-1": "block-missing" }
        }
      }),
    /block block-missing is not defined/
  );
});

test("Lane attestation signature payload binds the full structured decision", () => {
  const attestation = buildAttestation();
  const payload = buildLaneAttestationSignaturePayload(attestation);
  const changedVerdict = buildLaneAttestationSignaturePayload(
    buildAttestation({
      verdict: "REVISE",
      checks: [
        {
          ...attestation.checks[0]!,
          status: "FAIL",
          severity: "HIGH",
          publicRationale: "The claim needs revision.",
          requiredAction: "Create a replacement packet."
        }
      ],
      publicRationale: "The claim needs revision."
    })
  );

  assert.equal(payload.bodyDigest, stableGateOneDigest(payload.body));
  assert.notEqual(structuredDecisionSignaturePayloadDigest(payload), structuredDecisionSignaturePayloadDigest(changedVerdict));
});

test("Structured decision signature payload helpers accept unsigned bodies", () => {
  const attestation = buildAttestation();
  const { signature: _signature, ...unsignedAttestation } = attestation;
  const lanePayload = buildLaneAttestationSignaturePayload(unsignedAttestation);

  assert.equal(lanePayload.bodyDigest, stableGateOneDigest(unsignedAttestation));
  assert.equal("signature" in lanePayload.body, false);

  const { attestationId: _attestationId, lane: _lane, signature: _reviewSignature, ...sharedDecisionFields } = attestation;
  const unsignedReview = {
    ...sharedDecisionFields,
    reviewId: "spec-review-1",
    requirementId: "spec-req-1",
    type: "LEGAL_RIGHTS" as const
  };
  const specialistPayload = buildSpecialistReviewSignaturePayload(unsignedReview);

  assert.equal(specialistPayload.decisionKind, "SPECIALIST_REVIEW");
  assert.equal(specialistPayload.bodyDigest, stableGateOneDigest(unsignedReview));
  assert.equal("signature" in specialistPayload.body, false);
});

test("Structured decision signature payload helpers accept create request bodies", () => {
  const attestation = buildAttestation();
  const { attestationId: _attestationId, signature: _laneSignature, ...unsignedLaneCreateRequest } = attestation;
  const { attestationId: _signedAttestationId, ...signedLaneCreateRequest } = attestation;
  const unsignedLanePayload = buildLaneAttestationSignaturePayload(unsignedLaneCreateRequest);
  const signedLanePayload = buildLaneAttestationSignaturePayload(signedLaneCreateRequest);

  assert.equal(unsignedLanePayload.bodyDigest, stableGateOneDigest(unsignedLaneCreateRequest));
  assert.equal(signedLanePayload.bodyDigest, stableGateOneDigest(unsignedLaneCreateRequest));
  assert.equal("attestationId" in unsignedLanePayload.body, false);
  assert.equal("signature" in signedLanePayload.body, false);

  const { attestationId: _unusedAttestationId, lane: _lane, signature: _reviewSignature, ...sharedDecisionFields } = attestation;
  const unsignedSpecialistCreateRequest = {
    ...sharedDecisionFields,
    requirementId: "spec-req-1",
    type: "LEGAL_RIGHTS" as const
  };
  const signedSpecialistCreateRequest = {
    ...unsignedSpecialistCreateRequest,
    signature: "sig-placeholder"
  };
  const unsignedSpecialistPayload = buildSpecialistReviewSignaturePayload(unsignedSpecialistCreateRequest);
  const signedSpecialistPayload = buildSpecialistReviewSignaturePayload(signedSpecialistCreateRequest);

  assert.equal(unsignedSpecialistPayload.decisionKind, "SPECIALIST_REVIEW");
  assert.equal(unsignedSpecialistPayload.bodyDigest, stableGateOneDigest(unsignedSpecialistCreateRequest));
  assert.equal(signedSpecialistPayload.bodyDigest, stableGateOneDigest(unsignedSpecialistCreateRequest));
  assert.equal("reviewId" in unsignedSpecialistPayload.body, false);
  assert.equal("signature" in signedSpecialistPayload.body, false);
});

test("V2 lane attestation request is structured but server-owned attestation id is omitted", () => {
  const { attestationId: _attestationId, ...request } = buildAttestation();
  const parsed: GateOneCreateLaneAttestationRequestV2 = GateOneCreateLaneAttestationRequestV2Schema.parse(request);

  assert.equal(parsed.signature, "sig-placeholder");
  assert.equal(parsed.reviewer.botId, "fact-bot-1");
  assert.equal("attestationId" in parsed, false);
  assert.throws(
    () =>
      GateOneCreateLaneAttestationRequestV2Schema.parse({
        ...request,
        attestationId: "client-owned-id"
      }),
    /Unrecognized key/
  );
});

test("V2 reviewer metadata requires controlling owner binding for every verification status", () => {
  const { attestationId: _attestationId, ...verifiedRequest } = buildAttestation();
  const { controllingOwnerId: _verifiedOwnerId, ...verifiedReviewerWithoutOwner } = verifiedRequest.reviewer;
  const unverifiedRequest = {
    ...verifiedRequest,
    reviewer: {
      ...verifiedRequest.reviewer,
      verificationStatus: "UNVERIFIED" as const
    }
  };
  const { controllingOwnerId: _unverifiedOwnerId, ...unverifiedReviewerWithoutOwner } = unverifiedRequest.reviewer;

  assert.throws(
    () =>
      GateOneCreateLaneAttestationRequestV2Schema.parse({
        ...verifiedRequest,
        reviewer: verifiedReviewerWithoutOwner
      }),
    /controllingOwnerId/
  );
  assert.throws(
    () =>
      GateOneCreateLaneAttestationRequestV2Schema.parse({
        ...unverifiedRequest,
        reviewer: unverifiedReviewerWithoutOwner
      }),
    /controllingOwnerId/
  );
});

test("V2 signed decision schemas require explicit empty arrays instead of injecting defaults", () => {
  const { attestationId: _attestationId, ...request } = buildAttestation();
  const { requiredDisclosureIds: _requiredDisclosureIds, ...missingTopLevelDisclosureIds } = request;
  const { requiredDisclosureIds: _checkRequiredDisclosureIds, ...checkMissingDisclosureIds } = request.checks[0]!;
  const { retrievalProviderIds: _retrievalProviderIds, ...reviewerMissingRetrievalProviders } = request.reviewer;

  assert.throws(
    () => GateOneCreateLaneAttestationRequestV2Schema.parse(missingTopLevelDisclosureIds),
    /requiredDisclosureIds/
  );
  assert.throws(
    () =>
      GateOneCreateLaneAttestationRequestV2Schema.parse({
        ...request,
        checks: [checkMissingDisclosureIds]
      }),
    /requiredDisclosureIds/
  );
  assert.throws(
    () =>
      GateOneCreateLaneAttestationRequestV2Schema.parse({
        ...request,
        reviewer: reviewerMissingRetrievalProviders
      }),
    /retrievalProviderIds/
  );
});

test("Structured decisions enforce disclosure and recusal ineligibility rules", () => {
  assert.throws(
    () => buildAttestation({ verdict: "PASS_WITH_DISCLOSURE", requiredDisclosureIds: [], checks: [{ ...buildAttestation().checks[0]! }] }),
    /requires at least one disclosure id/
  );

  assert.throws(
    () =>
      buildAttestation({
        verdict: "PASS_WITH_DISCLOSURE",
        requiredDisclosureIds: ["disclosure-1"],
        checks: [
          {
            ...buildAttestation().checks[0]!,
            status: "FAIL",
            severity: "HIGH",
            requiredDisclosureIds: ["disclosure-1"],
            publicRationale: "The claim needs a correction and disclosure."
          }
        ]
      }),
    /PASS_WITH_DISCLOSURE decision cannot include failing checks/
  );

  assert.throws(
    () =>
      buildAttestation({
        declaredConflicts: [{ type: "OWNER", description: "Same controlling owner as writer.", recusalRequired: true }]
      }),
    /required recusal/
  );
});

test("Specialist review contracts use the same structured verdict semantics", () => {
  const { attestationId: _attestationId, lane: _lane, ...sharedDecisionFields } = buildAttestation();
  const specialistReview: GateOneSpecialistReviewV2 = GateOneSpecialistReviewV2Schema.parse({
    ...sharedDecisionFields,
    reviewId: "spec-review-1",
    requirementId: "spec-req-1",
    type: "LEGAL_RIGHTS"
  });

  assert.equal(specialistReview.type, "LEGAL_RIGHTS");
});

test("Preflight result contract rejects contradictory verdicts", () => {
  const base: GateOnePreflightResult = {
    id: "preflight-1",
    storyId: "story-1",
    packetHash: buildPacket().packetHash,
    contractId: "PACKET_INTEGRITY_V1",
    contractVersion: "1.0.0",
    policyVersion: "2.2.0",
    verdict: "PASS",
    checks: [
      {
        checkId: "PKT.HASH_RECOMPUTES",
        status: "PASS",
        severity: "LOW",
        objectRefs: ["packet:packet-1"],
        publicMessage: "Packet hash recomputes."
      }
    ],
    requiredSpecialists: [],
    requiredDisclosures: [],
    deterministicInputHash: stableGateOneDigest({ packetHash: buildPacket().packetHash, contractId: "PACKET_INTEGRITY_V1" }),
    startedAt: NOW,
    completedAt: NOW,
    implementationVersion: "packet-integrity-v1"
  };

  assert.equal(GateOnePreflightResultSchema.parse(base).verdict, "PASS");
  assert.throws(
    () =>
      GateOnePreflightResultSchema.parse({
        ...base,
        checks: [{ ...base.checks[0]!, status: "FAIL", severity: "CRITICAL" }]
      }),
    /PASS preflight cannot include failing checks/
  );
  assert.throws(
    () =>
      GateOnePreflightResultSchema.parse({
        ...base,
        verdict: "PASS_WITH_REQUIREMENTS"
      }),
    /must include a disclosure or specialist requirement/
  );
  assert.throws(
    () =>
      GateOnePreflightResultSchema.parse({
        ...base,
        verdict: "PASS_WITH_REQUIREMENTS",
        checks: [{ ...base.checks[0]!, status: "FAIL", severity: "HIGH" }],
        requiredDisclosures: [
          {
            id: "disclosure-1",
            type: "UNVERIFIED_OR_DEVELOPING_EVIDENCE",
            textTemplateKey: "developing-evidence-v1",
            parameters: {},
            sourceRuleCodes: ["PKT.HASH_RECOMPUTES"],
            public: true
          }
        ]
      }),
    /PASS_WITH_REQUIREMENTS preflight cannot include failing checks/
  );
});
