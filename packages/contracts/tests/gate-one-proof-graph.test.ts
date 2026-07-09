import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  GATE_ONE_PROOF_GRAPH_ONTOLOGY_VERSION,
  GATE_ONE_PROOF_NODE_KINDS,
  GATE_ONE_PROOF_RELATION_KINDS,
  GATE_ONE_PROOF_RELATION_SOURCES,
  GATE_ONE_PROOF_RELATION_VISIBILITY,
  GateOneProofGraphVocabularySchema,
  GateOneProofNodeKindSchema,
  GateOneProofRelationInputSchema,
  GateOneProofRelationKindSchema,
  GateOneProofRelationSourceSchema,
  GateOneClaimSemanticFrameSchema,
  GateOneSemanticFrameCandidateRelationSchema,
  GateOnePublicProofGraphSchema,
  assertGateOneProofRelationAllowedPair,
  canonicalizeGateOneProofRelations,
  computeGateOnePublicProofGraphHash,
  gateOneProofRelationExposure,
  gateOneProofRelationIdentityDigest,
  sortGateOneProofRelations,
  type GateOneProofRelationInput
} from "../src/index.js";

const vocabularyPath = fileURLToPath(new URL("../src/governance/gate-one/proof-graph.v1.json", import.meta.url));

const baseRelation: GateOneProofRelationInput = {
  ontologyVersion: GATE_ONE_PROOF_GRAPH_ONTOLOGY_VERSION,
  storyId: "story-1",
  packetId: "packet-1",
  packetHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  relationSource: "PACKET",
  sourceRecordId: "packet-1",
  fromKind: "STORY",
  fromId: "story-1",
  relation: "STORY_HAS_PACKET",
  toKind: "PACKET",
  toId: "packet-1",
  mode: "PUBLIC_ADVISORY",
  publicationEffect: "NONE",
  policyVersion: "2.2.0",
  deterministicInputHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  visibility: "PUBLIC"
};

test("Gate One Proof Graph vocabulary JSON matches contract enums", () => {
  const vocabulary = GateOneProofGraphVocabularySchema.parse(JSON.parse(readFileSync(vocabularyPath, "utf8")));

  assert.equal(vocabulary.ontologyVersion, GATE_ONE_PROOF_GRAPH_ONTOLOGY_VERSION);
  assert.deepEqual(vocabulary.nodeKinds, [...GATE_ONE_PROOF_NODE_KINDS]);
  assert.deepEqual(vocabulary.relationKinds, [...GATE_ONE_PROOF_RELATION_KINDS]);
  assert.deepEqual(vocabulary.relationSources, [...GATE_ONE_PROOF_RELATION_SOURCES]);
  assert.deepEqual(vocabulary.visibility, [...GATE_ONE_PROOF_RELATION_VISIBILITY]);
  const relationKindsWithPairs = new Set(vocabulary.allowedPairs.map((pair) => pair.relation));
  assert.deepEqual(
    [...GATE_ONE_PROOF_RELATION_KINDS].filter((kind) => !relationKindsWithPairs.has(kind)),
    []
  );
  for (const pair of vocabulary.allowedPairs) {
    assert.ok(GATE_ONE_PROOF_NODE_KINDS.includes(pair.fromKind));
    assert.ok(GATE_ONE_PROOF_NODE_KINDS.includes(pair.toKind));
    assert.ok(GATE_ONE_PROOF_RELATION_KINDS.includes(pair.relation));
  }
});

test("Gate One Proof Graph accepts required node and relation kinds", () => {
  assert.equal(GateOneProofNodeKindSchema.parse("SEALED_EVIDENCE_REF"), "SEALED_EVIDENCE_REF");
  assert.equal(GateOneProofNodeKindSchema.parse("SPECIALIST_REVIEW"), "SPECIALIST_REVIEW");
  assert.equal(GateOneProofRelationKindSchema.parse("CONSENSUS_DEPENDS_ON_SAFETY_GATE"), "CONSENSUS_DEPENDS_ON_SAFETY_GATE");
  assert.equal(GateOneProofRelationKindSchema.parse("PUBLIC_TRUST_RECEIPT_SUMMARIZES_CONSENSUS"), "PUBLIC_TRUST_RECEIPT_SUMMARIZES_CONSENSUS");
  assert.equal(GateOneProofRelationKindSchema.parse("CLAIM_POTENTIALLY_CONTRADICTS_CLAIM"), "CLAIM_POTENTIALLY_CONTRADICTS_CLAIM");
  assert.equal(GateOneProofRelationKindSchema.parse("SHADOW_ASSIGNMENT_TARGETS_PACKET"), "SHADOW_ASSIGNMENT_TARGETS_PACKET");
  assert.equal(GateOneProofRelationKindSchema.parse("SHADOW_SUBMISSION_SATISFIES_ASSIGNMENT"), "SHADOW_SUBMISSION_SATISFIES_ASSIGNMENT");
  assert.equal(GateOneProofRelationKindSchema.parse("TRANSLATION_DERIVED_FROM_PACKET"), "TRANSLATION_DERIVED_FROM_PACKET");
  assert.equal(GateOneProofRelationSourceSchema.parse("PUBLIC_TRUST_RECEIPT"), "PUBLIC_TRUST_RECEIPT");
  assert.equal(GateOneProofRelationSourceSchema.parse("SEMANTIC_FRAME_SHADOW"), "SEMANTIC_FRAME_SHADOW");
  assert.equal(GateOneProofRelationSourceSchema.parse("SEMANTIC_FRAME"), "SEMANTIC_FRAME");
});

test("Gate One Proof Graph rejects unknown relation kinds", () => {
  assert.throws(() => GateOneProofRelationKindSchema.parse("TRUST_SCORE_SUMMARIZES_STORY"), /Invalid enum value/);
  assert.throws(() => GateOneProofRelationKindSchema.parse("CLAIM_BLOCKS_PUBLICATION_AS_CONTRADICTION"), /Invalid enum value/);
  assert.throws(
    () =>
      GateOneProofRelationInputSchema.parse({
        ...baseRelation,
        relation: "TRUST_SCORE_SUMMARIZES_STORY"
      }),
    /Invalid enum value/
  );
});

test("Gate One semantic frames are shadow-only contract artifacts", () => {
  const frame = GateOneClaimSemanticFrameSchema.parse({
    frameVersion: "gate-one-claim-semantic-frame-v1",
    storyId: "story-1",
    packetId: "packet-1",
    packetHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    claimId: "claim-1",
    subjectRef: "subject-1",
    subjectText: "subject-1",
    predicate: "FACTUAL",
    objectText: "The agency released a record.",
    qualifier: { materiality: "MATERIAL" },
    extractionMethod: "candidate-packet-v2-claim-fields-v1",
    extractionConfidence: 0.55
  });

  assert.equal(frame.reviewStatus, "SHADOW");
  assert.throws(
    () =>
      GateOneClaimSemanticFrameSchema.parse({
        ...frame,
        extractionMethod: "llm-semantic-extractor-v1"
      }),
    /Invalid literal value/
  );
});

test("Gate One semantic candidate relation contract has no publication authority", () => {
  const candidate = GateOneSemanticFrameCandidateRelationSchema.parse({
    storyId: "story-1",
    packetId: "packet-1",
    packetHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    fromClaimId: "claim-1",
    relation: "CLAIM_POTENTIALLY_CONTRADICTS_CLAIM",
    toClaimId: "claim-2",
    confidence: 0.2,
    reasonCode: "SHADOW_SAME_SUBJECT_PREDICATE_DIFFERENT_OBJECT_TEXT",
    reviewStatus: "SHADOW"
  });

  assert.equal(candidate.reviewStatus, "SHADOW");
  assert.throws(
    () =>
      GateOneSemanticFrameCandidateRelationSchema.parse({
        ...candidate,
        reviewStatus: "BLOCK"
      }),
    /Invalid literal value/
  );
});

test("Gate One Proof Graph validates public and sealed exposure flags", () => {
  const publicRelation = GateOneProofRelationInputSchema.parse(baseRelation);
  assert.deepEqual(gateOneProofRelationExposure(publicRelation), { public: true, sealed: false });

  const sealedRelation = GateOneProofRelationInputSchema.parse({
    ...baseRelation,
    relationSource: "SEALED_EVIDENCE_ACCESS_AUDIT",
    fromKind: "SEALED_EVIDENCE_REF",
    fromId: "sealed-ref-hash",
    relation: "SEALED_EVIDENCE_REF_BOUND_TO_PACKET",
    toKind: "PACKET",
    visibility: "SEALED",
    sealedRefHash: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
  });
  assert.deepEqual(gateOneProofRelationExposure(sealedRelation), { public: false, sealed: true });

  assert.throws(
    () =>
      GateOneProofRelationInputSchema.parse({
        ...baseRelation,
        visibility: "SEALED"
      }),
    /hashed sealed reference/
  );
  assert.throws(
    () =>
      GateOneProofRelationInputSchema.parse({
        ...baseRelation,
        sealedRefHash: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
      }),
    /must not carry sealed reference hashes/
  );
});

test("Gate One Proof Graph sorts and canonicalizes deterministically", () => {
  const second: GateOneProofRelationInput = {
    ...baseRelation,
    fromKind: "PACKET",
    fromId: "packet-1",
    relation: "PACKET_CONTAINS_CLAIM",
    toKind: "CLAIM",
    toId: "claim-1"
  };
  const left = canonicalizeGateOneProofRelations([second, baseRelation]);
  const right = canonicalizeGateOneProofRelations([baseRelation, second]);

  assert.equal(left, right);
  assert.deepEqual(
    sortGateOneProofRelations([second, baseRelation]).map((relation) => relation.relation),
    ["PACKET_CONTAINS_CLAIM", "STORY_HAS_PACKET"]
  );

  const tiedA: GateOneProofRelationInput = {
    ...baseRelation,
    sourceRecordId: "source-a",
    metadata: { ordinal: 1 }
  };
  const tiedB: GateOneProofRelationInput = {
    ...baseRelation,
    sourceRecordId: "source-b",
    metadata: { ordinal: 2 }
  };
  assert.equal(canonicalizeGateOneProofRelations([tiedB, tiedA]), canonicalizeGateOneProofRelations([tiedA, tiedB]));
});

test("Gate One Proof Graph relation identity digest normalizes nullable identity fields", () => {
  const withMissingIdentityFields = GateOneProofRelationInputSchema.parse({
    ...baseRelation,
    packetHash: undefined,
    sourceRecordId: undefined,
    deterministicInputHash: undefined
  });
  const withExplicitEquivalentIdentity = GateOneProofRelationInputSchema.parse({
    ...withMissingIdentityFields
  });

  assert.equal(
    gateOneProofRelationIdentityDigest(withMissingIdentityFields),
    gateOneProofRelationIdentityDigest(withExplicitEquivalentIdentity)
  );
  assert.equal(
    gateOneProofRelationIdentityDigest(baseRelation),
    gateOneProofRelationIdentityDigest({ ...baseRelation })
  );
  assert.notEqual(
    gateOneProofRelationIdentityDigest(baseRelation),
    gateOneProofRelationIdentityDigest({ ...baseRelation, toId: "packet-2" })
  );
});

test("Gate One Proof Graph allowed-pair assertion rejects invalid ontology edges", () => {
  const vocabulary = GateOneProofGraphVocabularySchema.parse(JSON.parse(readFileSync(vocabularyPath, "utf8")));

  assert.doesNotThrow(() => assertGateOneProofRelationAllowedPair(baseRelation, vocabulary.allowedPairs));
  assert.throws(
    () =>
      assertGateOneProofRelationAllowedPair({
        ...baseRelation,
        fromKind: "PACKET",
        toKind: "STORY"
      }, vocabulary.allowedPairs),
    /not an allowed ontology pair/
  );
});

test("Gate One public proof graph preserves advisory mode and publicationEffect", () => {
  const graphWithoutHash = {
    schemaVersion: "1.0" as const,
    ontologyVersion: GATE_ONE_PROOF_GRAPH_ONTOLOGY_VERSION,
    storyId: "story-1",
    packetId: "packet-1",
    packetHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    generatedAt: "2026-07-05T12:00:00.000Z",
    redactionVersion: "gate-one-proof-graph-public-v1" as const,
    publicRelationLimit: 500,
    nodes: [
      { kind: "STORY" as const, id: "story-1", label: "Story" },
      { kind: "PACKET" as const, id: "packet-1", label: "Packet" }
    ],
    relations: [
      {
        fromKind: "STORY" as const,
        fromId: "story-1",
        relation: "STORY_HAS_PACKET" as const,
        toKind: "PACKET" as const,
        toId: "packet-1",
        relationSource: "PACKET" as const,
        mode: "PUBLIC_ADVISORY",
        publicationEffect: "NONE"
      }
    ],
    omitted: {
      sealedRelationCount: 0,
      privateRelationCount: 0,
      rawTraceRelationCount: 0,
      reviewerSecretRelationCount: 0,
      truncatedPublicRelationCount: 0
    }
  };
  const graph = {
    ...graphWithoutHash,
    graphHash: computeGateOnePublicProofGraphHash(graphWithoutHash)
  };

  const parsed = GateOnePublicProofGraphSchema.parse(graph);
  assert.equal(parsed.relations[0]?.mode, "PUBLIC_ADVISORY");
  assert.equal(parsed.relations[0]?.publicationEffect, "NONE");
  assert.match(parsed.graphHash, /^sha256:[a-f0-9]{64}$/);
  assert.equal(
    computeGateOnePublicProofGraphHash({ ...graphWithoutHash, generatedAt: "2026-07-05T12:01:00.000Z" }),
    parsed.graphHash
  );
  assert.notEqual(
    computeGateOnePublicProofGraphHash({ ...graphWithoutHash, packetId: "packet-2" }),
    parsed.graphHash
  );
  assert.notEqual(
    computeGateOnePublicProofGraphHash({
      schemaVersion: graphWithoutHash.schemaVersion,
      ontologyVersion: graphWithoutHash.ontologyVersion,
      storyId: graphWithoutHash.storyId,
      packetHash: graphWithoutHash.packetHash,
      generatedAt: graphWithoutHash.generatedAt,
      redactionVersion: graphWithoutHash.redactionVersion,
      publicRelationLimit: graphWithoutHash.publicRelationLimit,
      nodes: graphWithoutHash.nodes,
      relations: graphWithoutHash.relations,
      omitted: graphWithoutHash.omitted
    }),
    parsed.graphHash
  );
  assert.match(
    computeGateOnePublicProofGraphHash({
      schemaVersion: graphWithoutHash.schemaVersion,
      ontologyVersion: graphWithoutHash.ontologyVersion,
      storyId: graphWithoutHash.storyId,
      packetId: graphWithoutHash.packetId,
      packetHash: graphWithoutHash.packetHash,
      generatedAt: graphWithoutHash.generatedAt,
      redactionVersion: graphWithoutHash.redactionVersion,
      publicRelationLimit: graphWithoutHash.publicRelationLimit,
      nodes: graphWithoutHash.nodes,
      relations: graphWithoutHash.relations,
      omitted: graphWithoutHash.omitted
    }),
    /^sha256:[a-f0-9]{64}$/
  );
});
