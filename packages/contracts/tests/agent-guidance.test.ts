import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENT_GUIDANCE_CONTRACT_V2,
  AgentAssignmentsResponseSchema,
  AgentGuidanceContractV2Schema,
  AgentReleaseManifestSchema,
  PublicAgentCapabilitiesSchema
} from "../src/index.js";

test("agent guidance v2 is strict, unique, and uses the canonical lane error", () => {
  assert.equal(AgentGuidanceContractV2Schema.parse(AGENT_GUIDANCE_CONTRACT_V2).schemaVersion, 2);
  const routes = AGENT_GUIDANCE_CONTRACT_V2.routes.map((route) => `${route.method} ${route.path}`);
  assert.equal(new Set(routes).size, routes.length);
  assert(AGENT_GUIDANCE_CONTRACT_V2.errors.some((error) => error.code === "GATE_ONE_V2_LANE_UNAUTHORIZED"));
  assert(!JSON.stringify(AGENT_GUIDANCE_CONTRACT_V2).includes("GATE_ONE_V2_REVIEWER_LANE_GRANT_MISSING"));
  assert.throws(() => AgentGuidanceContractV2Schema.parse({ ...AGENT_GUIDANCE_CONTRACT_V2, unexpected: true }));
});

test("public capability and assignment contracts reject private or unknown fields", () => {
  const status = { state: "UNKNOWN", reasonCode: "SOURCE_BUILD", nextAction: "Fetch the deployed capability endpoint." } as const;
  const runtime = {
    observedAt: "2026-07-09T00:00:00.000Z",
    source: "runtime_configuration",
    selfServeOnboarding: status,
    mcpReadPreflight: status,
    v1FirstSmoke: status,
    v2UniversalWrites: status,
    v2ShadowAssignments: status,
    v2ShadowSubmissions: status,
    v2SpecialistAssignments: status,
    v2SpecialistSubmissions: status,
    publicTrustReceipt: status,
    proofGraph: status
  } as const;
  assert.throws(() => PublicAgentCapabilitiesSchema.parse({
    schemaVersion: 1,
    observedAt: runtime.observedAt,
    docsVersion: "v",
    compatibleSdkRange: ">=0.1.4 <0.2.0",
    artifactUrls: { bootstrap: "/.well-known/agent-bootstrap.json" },
    policyPosture: { policyId: "id", policyVersion: "2", policyDigest: "sha256:x", globalState: "ENFORCE", canaryPercent: 100 },
    runtimeCapabilities: runtime,
    proofGraphFormats: ["JSON"],
    boundaries: { mcpWrites: false, browserPrivateKeys: false, humanGateTwoOnly: true, evidenceIsPublicationAuthority: false },
    privateKey: "forbidden"
  }));
  assert.throws(() => AgentAssignmentsResponseSchema.parse({ schemaVersion: 1, observedAt: runtime.observedAt, botId: "bot", blindFirstPass: true, peerSubmissionsVisible: false, assignments: [], linkedHumanId: "forbidden" }));
});

test("release manifests cannot claim incomplete package metadata", () => {
  assert.throws(() => AgentReleaseManifestSchema.parse({ schemaVersion: 1 }));
});

