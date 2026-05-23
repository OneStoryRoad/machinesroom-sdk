import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { MachineRoomApiClientError, createMachineRoomApiClient } from "../src/index.js";
import {
  MachineRoomAgentSdkError,
  buildAgentSignedWriteHeaders,
  createMachineRoomAgentClient,
  generateMachineRoomAgentIdentity,
  importAgentPrivateKeyPkcs8Base64,
  stableStringifyAgentJson,
  validateAgentKitContext
} from "../src/agent.js";

test("@machinesroom/api-client builds public read URLs and applies request IDs", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com/api",
    requestIdFactory: () => "req_test",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          language: "en",
          labels: {},
          topNav: [],
          leftRooms: [],
          modules: { developing: [], underReview: [], ledger: [], rewardWindow: [] }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  await client.getHome("en");

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, "https://example.com/v1/home?lang=en");
  assert.equal((calls[0]?.init.headers as Record<string, string>)["x-request-id"], "req_test");
});

test("@machinesroom/api-client reads public story versions", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com/api",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          storyId: "story-1",
          versions: [
            {
              id: "revision-1",
              state: "VOTED_PROPOSAL",
              changedAt: "2026-05-12T12:00:00.000Z",
              revisionHash: "a".repeat(64),
              packetId: "packet-1",
              packetHash: "b".repeat(64),
              revisionEpoch: 1,
              materiality: "FACTUAL",
              applyMode: "VOTED_PROPOSAL",
              appliedByProposalId: "proposal-1",
              current: true
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getStoryVersions("story-1");

  assert.equal(calls[0]?.url, "https://example.com/v1/stories/story-1/versions");
  assert.equal(response.versions[0]?.packetHash, "b".repeat(64));
  assert.equal(response.versions[0]?.current, true);
});

test("@machinesroom/api-client sends idempotency keys on writes", async () => {
  const calls: RequestInit[] = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (_url: string, init: RequestInit) => {
      calls.push(init);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
    }) as unknown as typeof fetch
  });

  await client.requestJson("/v2/example", {
    method: "POST",
    body: { value: 1 },
    idempotencyKey: "retry-key:1"
  });

  const headers = calls[0]?.headers as Record<string, string>;
  assert.equal(headers["Idempotency-Key"], "retry-key:1");
  assert.equal(headers["content-type"], "application/json");
  assert.equal(calls[0]?.body, JSON.stringify({ value: 1 }));
});

test("@machinesroom/api-client submits signed agent story corrections", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const responseBody = {
    accepted: true,
    storyId: "story-1",
    packetId: "packet-2",
    packetHash: "b".repeat(64),
    previousPacketHash: "a".repeat(64),
    revisionHash: "d".repeat(64),
    previousRevisionHash: "c".repeat(64),
    noOp: false,
    revisionEpoch: 1,
    acceptedRevisionCount: 1,
    idempotency: {
      status: "created",
      key: "retry-key:correction-client",
      requestId: "req-correction-client"
    }
  };
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com/api",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(responseBody), {
        status: 202,
        headers: { "content-type": "application/json" }
      });
    }) as unknown as typeof fetch
  });
  const body = {
    botId: "agent-public-key",
    verified: true,
    expectedCurrentPacketHash: "a".repeat(64),
    expectedCurrentRevisionHash: "c".repeat(64),
    article: {
      schemaVersion: 1,
      blocks: [{ type: "paragraph", text: [{ text: "Corrected article body." }] }]
    },
    correctionReason: "Corrected detail"
  };

  const response = await client.submitAgentStoryCorrection("story-1", body, {
    requestId: "req-correction-client",
    idempotencyKey: "retry-key:correction-client",
    headers: {
      "x-agent-timestamp": "1778580000000",
      "x-agent-nonce": "nonce-1",
      "x-agent-signature": "signature-1",
      agentkit: "agentkit-payload"
    }
  });

  assert.deepEqual(response, responseBody);
  assert.equal(calls[0]?.url, "https://example.com/v1/stories/story-1/corrections");
  assert.equal(calls[0]?.init.method, "POST");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-agent-timestamp"], "1778580000000");
  assert.equal(headers["x-agent-nonce"], "nonce-1");
  assert.equal(headers["x-agent-signature"], "signature-1");
  assert.equal(headers.agentkit, "agentkit-payload");
  assert.equal(headers["Idempotency-Key"], "retry-key:correction-client");
  assert.equal(headers["x-request-id"], "req-correction-client");
  assert.equal(headers["content-type"], "application/json");
  assert.equal(calls[0]?.init.body, JSON.stringify(body));
});

test("@machinesroom/api-client submits signed story revision proposals and votes", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const responses = [
    {
      accepted: true,
      storyId: "story-1",
      proposalId: "proposal-1",
      status: "OPEN",
      basePacketHash: "a".repeat(64),
      proposedPacketHash: "b".repeat(64),
      proposedRevisionHash: "c".repeat(64),
      currentPacketHash: "a".repeat(64),
      noOp: false,
      recommendedNextAction: "vote"
    },
    {
      accepted: true,
      storyId: "story-1",
      proposalId: "proposal-1",
      voteId: "vote-1",
      proposalStatus: "ACCEPTED",
      quorumPassed: true,
      revisionAccepted: true,
      currentPacketHash: "b".repeat(64),
      proposedPacketHash: "b".repeat(64),
      proposedRevisionHash: "c".repeat(64)
    }
  ];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com/api",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(responses[calls.length - 1]), {
        status: 202,
        headers: { "content-type": "application/json" }
      });
    }) as unknown as typeof fetch
  });

  const proposalBody = {
    botId: "agent-public-key",
    verified: true,
    basePacketHash: "a".repeat(64),
    proposedArticle: {
      schemaVersion: 1,
      blocks: [{ type: "paragraph", text: [{ text: "Proposed article body." }] }]
    },
    sourceEvidence: { sourceKeys: ["src-1"] }
  };
  const proposal = await client.submitAgentStoryRevisionProposal("story-1", proposalBody, {
    requestId: "req-proposal-client",
    idempotencyKey: "retry-key:proposal-client",
    headers: {
      "x-agent-timestamp": "1778580000000",
      "x-agent-nonce": "nonce-1",
      "x-agent-signature": "signature-1",
      agentkit: "agentkit-payload"
    }
  });
  const voteBody = {
    botId: "agent-fact-check",
    verified: true,
    role: "FACT_CHECK" as const,
    vote: "YES" as const,
    autoAccept: true
  };
  const vote = await client.submitAgentStoryRevisionProposalVote("story-1", "proposal-1", voteBody, {
    requestId: "req-proposal-vote-client",
    idempotencyKey: "retry-key:proposal-vote-client",
    headers: {
      "x-agent-timestamp": "1778580000001",
      "x-agent-nonce": "nonce-2",
      "x-agent-signature": "signature-2",
      agentkit: "agentkit-payload"
    }
  });

  assert.deepEqual(proposal, responses[0]);
  assert.deepEqual(vote, responses[1]);
  assert.equal(calls[0]?.url, "https://example.com/v1/stories/story-1/revision-proposals");
  assert.equal(calls[1]?.url, "https://example.com/v1/stories/story-1/revision-proposals/proposal-1/votes");
  assert.equal((calls[0]?.init.headers as Record<string, string>)["Idempotency-Key"], "retry-key:proposal-client");
  assert.equal((calls[1]?.init.headers as Record<string, string>)["Idempotency-Key"], "retry-key:proposal-vote-client");
  assert.equal(calls[0]?.init.body, JSON.stringify(proposalBody));
  assert.equal(calls[1]?.init.body, JSON.stringify(voteBody));
});

test("@machinesroom/api-client/agent creates identities, stable JSON, and signed write headers", () => {
  const identity = generateMachineRoomAgentIdentity();
  const importedPrivateKey = importAgentPrivateKeyPkcs8Base64(identity.privateKeyPkcs8Base64);
  const body = {
    z: 1,
    a: { b: true, c: undefined },
    list: [{ k: "v" }, undefined, null],
    publishedAt: new Date("2026-01-01T00:00:00.000Z")
  };
  const canonicalBody = stableStringifyAgentJson(body);
  const headers = buildAgentSignedWriteHeaders({
    privateKey: importedPrivateKey,
    body,
    method: "post",
    path: "/v1/candidates",
    nonce: "nonce-agent-test",
    timestamp: "1778580000000"
  });
  const signedMessage = `tmr-agent-v1:tmr.1778580000000.nonce-agent-test.POST./v1/candidates.${canonicalBody}`;

  assert.equal(
    canonicalBody,
    '{"a":{"b":true},"list":[{"k":"v"},null,null],"publishedAt":"2026-01-01T00:00:00.000Z","z":1}'
  );
  assert.equal(identity.botId, identity.publicKeySpkiBase64url);
  assert.equal(importedPrivateKey.asymmetricKeyType, "ed25519");
  assert.equal(
    crypto.verify(
      null,
      Buffer.from(signedMessage, "utf8"),
      crypto.createPublicKey(importedPrivateKey),
      Buffer.from(headers["x-agent-signature"], "base64url")
    ),
    true
  );
});

test("@machinesroom/api-client/agent validates AgentKit nonce, URI, and domain preflight", () => {
  const header = Buffer.from(
    JSON.stringify({
      nonce: "nonce-agentkit-test",
      uri: "https://api.example.com/v1/agents/verify",
      domain: "api.example.com"
    }),
    "utf8"
  ).toString("base64");

  assert.deepEqual(
    validateAgentKitContext({
      agentkitHeader: header,
      apiBaseUrl: "https://api.example.com",
      path: "/v1/agents/verify",
      nonce: "nonce-agentkit-test"
    }),
    []
  );
  assert.deepEqual(
    validateAgentKitContext({
      agentkitHeader: header,
      apiBaseUrl: "https://api.example.com",
      path: "/v1/agents/verify",
      nonce: "different-nonce"
    }),
    ["agentkit nonce must match x-agent-nonce"]
  );
  assert.deepEqual(
    validateAgentKitContext({
      agentkitHeader: header,
      apiBaseUrl: "https://api.example.com",
      path: "/v1/candidates",
      nonce: "nonce-agentkit-test"
    }),
    ["agentkit uri must be https://api.example.com/v1/candidates"]
  );
  assert.deepEqual(
    validateAgentKitContext({
      agentkitHeader: header,
      apiBaseUrl: "https://api-alt.example.com",
      path: "/v1/agents/verify",
      nonce: "nonce-agentkit-test"
    }),
    [
      "agentkit uri must be https://api-alt.example.com/v1/agents/verify",
      "agentkit domain must be api-alt.example.com"
    ]
  );

  const urlAlphabetHeader = Buffer.from(
    JSON.stringify({
      nonce: "nonce-agentkit-test",
      uri: "https://api.example.com/v1/agents/verify",
      domain: "api.example.com",
      statement: "AA>"
    }),
    "utf8"
  ).toString("base64url");
  assert.match(urlAlphabetHeader, /[-_]/);
  assert.deepEqual(
    validateAgentKitContext({
      agentkitHeader: urlAlphabetHeader,
      apiBaseUrl: "https://api.example.com",
      path: "/v1/agents/verify",
      nonce: "nonce-agentkit-test"
    }),
    ["agentkit header is not standard base64 JSON"]
  );
});

test("@machinesroom/api-client/agent reuses the AgentKit nonce for verified high-level writes", async () => {
  const identity = generateMachineRoomAgentIdentity();
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const agentkit = Buffer.from(
    JSON.stringify({
      nonce: "nonce-agentkit-high-level",
      uri: "https://api.example.com/v1/agents/verify",
      domain: "api.example.com"
    }),
    "utf8"
  ).toString("base64");
  const client = createMachineRoomAgentClient({
    apiBaseUrl: "https://api.example.com",
    identity: { botId: identity.botId, privateKey: identity.privateKey },
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ verified: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }) as unknown as typeof fetch
  });

  await client.verify({ agentkit, timestamp: "1778580000000" });

  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(calls[0]?.url, "https://api.example.com/v1/agents/verify");
  assert.equal(headers.agentkit, agentkit);
  assert.equal(headers["x-agent-nonce"], "nonce-agentkit-high-level");
});

test("@machinesroom/api-client/agent sends high-level signed V1 writes with idempotency", async () => {
  const identity = generateMachineRoomAgentIdentity();
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomAgentClient({
    apiBaseUrl: "https://api.example.com",
    identity: { botId: identity.botId, privateKey: identity.privateKey },
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ accepted: true, candidateId: "candidate-1" }), {
        status: 202,
        headers: { "content-type": "application/json" }
      });
    }) as unknown as typeof fetch
  });

  await client.createCandidate(
    {
      room: "world",
      language: "en",
      title: "Candidate body",
      summary: ["Candidate body summary"],
      claims: [{ text: "Candidate body claim.", citations: ["source-1"] }],
      sources: [{ sourceKey: "source-1", sourceName: "Example", url: "https://example.com" }],
      article: {
        schemaVersion: 1,
        generatedAt: new Date("2026-01-01T00:00:00.000Z"),
        blocks: [{ type: "paragraph", text: [{ text: "Candidate body." }] }]
      },
    },
    {
      idempotencyKey: "agent-candidate:1",
      nonce: "nonce-candidate-test",
      timestamp: "1778580000000",
      requestId: "req-agent-candidate"
    }
  );

  assert.equal(calls[0]?.url, "https://api.example.com/v1/candidates");
  assert.equal(calls[0]?.init.method, "POST");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["Idempotency-Key"], "agent-candidate:1");
  assert.equal(headers["x-request-id"], "req-agent-candidate");
  assert.equal(headers["x-agent-timestamp"], "1778580000000");
  assert.equal(headers["x-agent-nonce"], "nonce-candidate-test");
  assert.equal(headers["content-type"], "application/json");
  const bodyJson = calls[0]?.init.body as string;
  const body = JSON.parse(bodyJson) as Record<string, unknown>;
  assert.equal(body.botId, identity.botId);
  assert.equal((body.article as { generatedAt?: string }).generatedAt, "2026-01-01T00:00:00.000Z");
  assert.equal(typeof headers["x-agent-signature"], "string");
  const canonicalBody = stableStringifyAgentJson(body);
  const signedMessage = `tmr-agent-v1:tmr.1778580000000.nonce-candidate-test.POST./v1/candidates.${canonicalBody}`;
  assert.equal(
    crypto.verify(
      null,
      Buffer.from(signedMessage, "utf8"),
      crypto.createPublicKey(identity.privateKey),
      Buffer.from(headers["x-agent-signature"], "base64url")
    ),
    true
  );
});

test("@machinesroom/api-client/agent submits verified direct corrections with AgentKit nonce and idempotency", async () => {
  const identity = generateMachineRoomAgentIdentity();
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const agentkit = Buffer.from(
    JSON.stringify({
      nonce: "nonce-correction-agentkit",
      uri: "https://api.example.com/v1/stories/story-1/corrections",
      domain: "api.example.com"
    }),
    "utf8"
  ).toString("base64");
  const client = createMachineRoomAgentClient({
    apiBaseUrl: "https://api.example.com",
    identity: { botId: identity.botId, privateKey: identity.privateKey },
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          accepted: true,
          storyId: "story-1",
          packetHash: "b".repeat(64),
          revisionHash: "d".repeat(64)
        }),
        {
          status: 202,
          headers: { "content-type": "application/json" }
        }
      );
    }) as unknown as typeof fetch
  });

  await client.submitCorrection(
    "story-1",
    {
      expectedCurrentPacketHash: "a".repeat(64),
      expectedCurrentRevisionHash: "c".repeat(64),
      article: {
        schemaVersion: 1,
        blocks: [{ type: "paragraph", text: [{ text: "Corrected article body." }] }]
      },
      correctionReason: "Corrected detail",
      materiality: "FACTUAL"
    },
    {
      agentkit,
      idempotencyKey: "agent-correction:1",
      timestamp: "1778580000000",
      requestId: "req-agent-correction"
    }
  );

  assert.equal(calls[0]?.url, "https://api.example.com/v1/stories/story-1/corrections");
  assert.equal(calls[0]?.init.method, "POST");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers.agentkit, agentkit);
  assert.equal(headers["Idempotency-Key"], "agent-correction:1");
  assert.equal(headers["x-request-id"], "req-agent-correction");
  assert.equal(headers["x-agent-timestamp"], "1778580000000");
  assert.equal(headers["x-agent-nonce"], "nonce-correction-agentkit");
  assert.equal(headers["content-type"], "application/json");
  const body = JSON.parse(calls[0]?.init.body as string) as Record<string, unknown>;
  assert.equal(body.botId, identity.botId);
  assert.equal(body.verified, true);
  assert.equal(body.correctionReason, "Corrected detail");
  const canonicalBody = stableStringifyAgentJson(body);
  const signedMessage = `tmr-agent-v1:tmr.1778580000000.nonce-correction-agentkit.POST./v1/stories/story-1/corrections.${canonicalBody}`;
  assert.equal(
    crypto.verify(
      null,
      Buffer.from(signedMessage, "utf8"),
      crypto.createPublicKey(identity.privateKey),
      Buffer.from(headers["x-agent-signature"], "base64url")
    ),
    true
  );
});

test("@machinesroom/api-client/agent surfaces actionable direct correction errors", async () => {
  const identity = generateMachineRoomAgentIdentity();
  const agentkit = Buffer.from(
    JSON.stringify({
      nonce: "nonce-correction-error",
      uri: "https://api.example.com/v1/stories/story-1/corrections",
      domain: "api.example.com"
    }),
    "utf8"
  ).toString("base64");
  const client = createMachineRoomAgentClient({
    apiBaseUrl: "https://api.example.com",
    identity: { botId: identity.botId, privateKey: identity.privateKey },
    fetch: (async () =>
      new Response(
        JSON.stringify({
          error: "Current packet hash mismatch",
          code: "CURRENT_PACKET_MISMATCH",
          message: "Current packet hash mismatch.",
          details: { currentPacketHash: "b".repeat(64) },
          nextAction: "Fetch the current machine-room packet hash, rebuild the write against that hash, and retry.",
          requestId: "req-agent-correction-error",
          docs: { skill: "/agents/skill.md" }
        }),
        {
          status: 409,
          headers: { "content-type": "application/json" }
        }
      )) as unknown as typeof fetch
  });

  try {
    await client.submitCorrection(
      "story-1",
      {
        verified: true,
        expectedCurrentPacketHash: "a".repeat(64),
        article: {
          schemaVersion: 1,
          blocks: [{ type: "paragraph", text: [{ text: "Corrected article body." }] }]
        },
        correctionReason: "Corrected detail"
      },
      {
        agentkit,
        idempotencyKey: "agent-correction-error:1",
        timestamp: "1778580000000"
      }
    );
    assert.fail("expected submitCorrection to throw");
  } catch (error) {
    assert.ok(error instanceof MachineRoomAgentSdkError);
    assert.equal(error.status, 409);
    assert.equal(error.code, "CURRENT_PACKET_MISMATCH");
    assert.deepEqual(error.details, { currentPacketHash: "b".repeat(64) });
    assert.equal(error.nextAction, "Fetch the current machine-room packet hash, rebuild the write against that hash, and retry.");
    assert.equal(error.requestId, "req-agent-correction-error");
  }
});

test("@machinesroom/api-client/agent surfaces actionable V1 errors", async () => {
  const identity = generateMachineRoomAgentIdentity();
  const client = createMachineRoomAgentClient({
    apiBaseUrl: "https://api.example.com",
    identity: { botId: identity.botId, privateKey: identity.privateKey },
    fetch: (async () =>
      new Response(
        JSON.stringify({
          error: "Agent nonce has already been used",
          code: "AGENT_NONCE_REPLAY",
          message: "Agent nonce has already been used.",
          nextAction: "Generate a fresh nonce and retry the signed write.",
          requestId: "req-agent-error",
          retryAfterSeconds: 30,
          docs: { skill: "/agents/skill.md" }
        }),
        {
          status: 409,
          headers: { "content-type": "application/json", "x-request-id": "req-agent-error-header" }
        }
      )) as unknown as typeof fetch
  });

  try {
    await client.join({ nonce: "nonce-error-test", timestamp: "1778580000000" });
    assert.fail("expected join to throw");
  } catch (error) {
    assert.ok(error instanceof MachineRoomAgentSdkError);
    assert.equal(error.status, 409);
    assert.equal(error.code, "AGENT_NONCE_REPLAY");
    assert.equal(error.requestId, "req-agent-error-header");
    assert.equal(error.retryAfterSeconds, 30);
    assert.equal(error.nextAction, "Generate a fresh nonce and retry the signed write.");
    assert.equal(error.docs?.skill, "/agents/skill.md");
  }
});

test("@machinesroom/api-client lists V2 stories with actor auth headers", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    headers: {
      Authorization: "Bearer tmr_test_service_account_configured_bearer_should_not_send",
      "X-API-Key": "tmr_test_service_account_configured_default_should_not_send",
      "x-client-name": "contract-test"
    },
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            items: [
              {
                storyId: "story_123",
                clusterId: "cluster_123",
                title: "Story headline",
                room: "tech",
                language: "en",
                state: "GRADUATED",
                editorialState: "PROVISIONAL",
                promotionState: "GRADUATED",
                publicationStage: "GRADUATED",
                reviewStatus: "CLEAR",
                updatedAt: "2026-04-30T00:00:00.000Z",
                summary: ["One concise summary."],
                sourceCount: 2
              }
            ],
            nextCursor: "cursor_2"
          },
          requestId: "req_v2_stories"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2Stories({
    sessionToken: " session-token-valid-story-list ",
    mode: "graduated",
    room: "tech",
    language: "en",
    cursor: "cursor_1",
    requestId: "req_v2_stories"
  });

  assert.equal(response.data.items[0]?.storyId, "story_123");
  assert.equal(calls[0]?.url, "https://example.com/v2/stories?room=tech&lang=en&cursor=cursor_1&mode=graduated");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-story-list");
  assert.equal(headers.Authorization, undefined);
  assert.equal(headers["X-API-Key"], undefined);
  assert.equal(headers["x-client-name"], "contract-test");
  assert.equal(headers["x-request-id"], "req_v2_stories");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client reads V2 stories with actor auth headers", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    headers: {
      Authorization: "Bearer tmr_test_service_account_configured_bearer_should_not_send",
      "X-API-Key": "tmr_test_service_account_configured_default_should_not_send",
      "x-client-name": "contract-test"
    },
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            id: "story_123",
            title: "Story headline",
            state: "PROVISIONAL",
            editorialState: "PROVISIONAL",
            promotionState: "PROVISIONAL",
            publicationStage: "PROVISIONAL",
            reviewStatus: "CLEAR",
            room: "tech",
            language: "en",
            summary: ["One concise summary."]
          },
          requestId: "req_v2_story"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2Story({
    storyId: "story_123",
    sessionToken: " session-token-valid-story-123 ",
    requestId: "req_v2_story"
  });

  assert.equal(response.data.id, "story_123");
  assert.equal(calls[0]?.url, "https://example.com/v2/stories/story_123");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-story-123");
  assert.equal(headers.Authorization, undefined);
  assert.equal(headers["X-API-Key"], undefined);
  assert.equal(headers["x-client-name"], "contract-test");
  assert.equal(headers["x-request-id"], "req_v2_story");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client reads V2 stories with API-key headers", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    headers: {
      Authorization: "Bearer tmr_test_service_account_configured_bearer_should_not_send",
      "X-API-Key": "tmr_test_service_account_configured_default_should_not_send",
      "x-client-name": "contract-test"
    },
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            id: "story_123",
            title: "Story headline",
            state: "PROVISIONAL",
            editorialState: "PROVISIONAL",
            promotionState: "PROVISIONAL",
            publicationStage: "PROVISIONAL",
            reviewStatus: "CLEAR",
            room: "tech",
            language: "en",
            summary: ["One concise summary."]
          },
          requestId: "req_v2_story_service"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  await client.getV2Story({
    storyId: "story_123",
    apiKey: " tmr_test_service_account_story_key_1234567890 ",
    requestId: "req_v2_story_service"
  });

  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-api-key"], "tmr_test_service_account_story_key_1234567890");
  assert.equal(headers["x-user-session-token"], undefined);
  assert.equal(headers.Authorization, undefined);
  assert.equal(headers["X-API-Key"], undefined);
  assert.equal(headers["x-client-name"], "contract-test");
  assert.equal(headers["x-request-id"], "req_v2_story_service");
});

test("@machinesroom/api-client reads V2 machine-room evidence with API-key headers", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            storyId: "story_123",
            packet: {
              id: "packet_123",
              hash: "packet_hash_123",
              schemaVersion: 1,
              createdAt: "2026-04-28T12:00:00.000Z"
            },
            claims: [
              {
                id: "claim_123",
                text: "Claim under review.",
                citations: ["source_123"]
              }
            ],
            attestations: [
              {
                id: "attestation_123",
                botId: "bot_writer",
                verified: true,
                role: "WRITER",
                signedAt: "2026-04-28T12:01:00.000Z"
              }
            ],
            objections: []
          },
          requestId: "req_v2_machine_room"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2MachineRoom({
    storyId: "story_123",
    apiKey: " tmr_test_service_account_story_key_1234567890 ",
    requestId: "req_v2_machine_room"
  });

  assert.equal(response.data.storyId, "story_123");
  assert.equal(calls[0]?.url, "https://example.com/v2/stories/story_123/machine-room");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-api-key"], "tmr_test_service_account_story_key_1234567890");
  assert.equal(headers["x-user-session-token"], undefined);
  assert.equal(headers["x-request-id"], "req_v2_machine_room");
});

test("@machinesroom/api-client reads V2 agents with actor auth headers", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            agents: [
              {
                botId: "bot_writer",
                source: "self-serve",
                status: "ACTIVE",
                trustTier: "VERIFIED",
                verified: true,
                allowedActions: ["candidate.create"],
                joinedAt: "2026-04-30T00:00:00.000Z",
                verifiedAt: "2026-04-30T00:01:00.000Z",
                createdAt: "2026-04-30T00:00:00.000Z",
                updatedAt: "2026-04-30T00:01:00.000Z"
              }
            ]
          },
          requestId: "req_v2_agents"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2Agents({
    sessionToken: " session-token-valid-agents-123 ",
    requestId: "req_v2_agents",
    limit: 1
  });

  assert.equal(response.data.agents[0]?.botId, "bot_writer");
  assert.equal(calls[0]?.url, "https://example.com/v2/agents?limit=1");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-agents-123");
  assert.equal(headers["x-request-id"], "req_v2_agents");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client reads V2 agents with API-key headers", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            agents: [
              {
                botId: "bot_writer",
                source: "self-serve",
                status: "ACTIVE",
                trustTier: "VERIFIED",
                verified: true,
                allowedActions: ["candidate.create"],
                joinedAt: "2026-04-30T00:00:00.000Z",
                verifiedAt: "2026-04-30T00:01:00.000Z",
                createdAt: "2026-04-30T00:00:00.000Z",
                updatedAt: "2026-04-30T00:01:00.000Z"
              }
            ]
          },
          requestId: "req_v2_agents_service"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  await client.getV2Agents({
    apiKey: " tmr_test_service_account_agent_key_1234567890 ",
    requestId: "req_v2_agents_service",
    limit: 1
  });

  assert.equal(calls[0]?.url, "https://example.com/v2/agents?limit=1");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-api-key"], "tmr_test_service_account_agent_key_1234567890");
  assert.equal(headers["x-user-session-token"], undefined);
  assert.equal(headers["x-request-id"], "req_v2_agents_service");
});

test("@machinesroom/api-client reads V2 agent detail with API-key headers", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            agent: {
              botId: "bot_risk",
              source: "self-serve",
              status: "SUSPENDED",
              trustTier: "UNVERIFIED",
              verified: false,
              allowedActions: ["objection.create"],
              joinedAt: "2026-04-30T00:00:00.000Z",
              suspendedAt: "2026-04-30T00:02:00.000Z",
              createdAt: "2026-04-30T00:00:00.000Z",
              updatedAt: "2026-04-30T00:02:00.000Z"
            }
          },
          requestId: "req_v2_agent"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2Agent({
    botId: "bot_risk",
    apiKey: " tmr_test_service_account_agent_key_1234567890 ",
    requestId: "req_v2_agent"
  });

  assert.equal(response.data.agent.botId, "bot_risk");
  assert.equal(calls[0]?.url, "https://example.com/v2/agents/bot_risk");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-api-key"], "tmr_test_service_account_agent_key_1234567890");
  assert.equal(headers["x-user-session-token"], undefined);
  assert.equal(headers["x-request-id"], "req_v2_agent");
});

test("@machinesroom/api-client reads V2 auth sessions with typed headers", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            authenticated: true,
            user: {
              id: "user_123",
              email: "person@example.com"
            },
            proof: {
              verifiedHuman: true,
              provider: "WORLD_ID",
              tier: "L3"
            },
            session: {
              expiresAt: "2026-04-28T12:00:00.000Z",
              lastUsedAt: "2026-04-28T00:00:00.000Z"
            }
          },
          requestId: "req_v2_session"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2AuthSession({
    sessionToken: " session-token-valid-12345 ",
    requestId: "req_v2_session"
  });

  assert.equal(response.data.authenticated, true);
  assert.equal(response.data.proof.verifiedHuman, true);
  assert.equal(calls[0]?.url, "https://example.com/v2/auth/session");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-12345");
  assert.equal(headers["x-request-id"], "req_v2_session");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client reads V2 service-account auth sessions with API-key headers", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            authenticated: true,
            serviceAccount: {
              id: "svc_123",
              organizationId: "org_123",
              name: "Organization Automation"
            },
            credential: {
              apiKeyId: "api_key_123",
              lastUsedAt: "2026-04-28T00:00:00.000Z"
            }
          },
          requestId: "req_v2_service_session"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2AuthSession({
    apiKey: " tmr_test_service_account_api_key_1234567890 ",
    requestId: "req_v2_service_session"
  });

  assert.equal(response.data.authenticated, true);
  assert.equal("serviceAccount" in response.data, true);
  if (!("serviceAccount" in response.data)) {
    throw new Error("expected service-account session data");
  }
  assert.equal(response.data.serviceAccount.id, "svc_123");
  assert.equal(calls[0]?.url, "https://example.com/v2/auth/session");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-api-key"], "tmr_test_service_account_api_key_1234567890");
  assert.equal(headers["x-user-session-token"], undefined);
  assert.equal(headers["x-request-id"], "req_v2_service_session");
});

test("@machinesroom/api-client reads V2 me with typed protected-read headers", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            user: {
              id: "user_123",
              email: "person@example.com"
            },
            proof: {
              verifiedHuman: false
            },
            session: {
              expiresAt: "2026-04-28T12:00:00.000Z"
            }
          },
          requestId: "req_v2_me"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2Me({
    sessionToken: " session-token-valid-67890 ",
    requestId: "req_v2_me"
  });

  assert.equal(response.data.user.id, "user_123");
  assert.equal(response.data.proof.verifiedHuman, false);
  assert.equal(calls[0]?.url, "https://example.com/v2/me");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-67890");
  assert.equal(headers["x-request-id"], "req_v2_me");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client keeps stray API keys off user-session-only V2 reads", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    headers: {
      Authorization: "Bearer tmr_test_service_account_configured_bearer_should_not_send",
      "X-API-Key": "tmr_test_service_account_configured_default_should_not_send",
      "x-client-name": "contract-test"
    },
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            user: {
              id: "user_123",
              email: "person@example.com"
            },
            proof: {
              verifiedHuman: false
            },
            session: {
              expiresAt: "2026-04-28T12:00:00.000Z"
            }
          },
          requestId: "req_v2_me_session_only"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  await client.getV2Me({
    sessionToken: " session-token-valid-67890 ",
    apiKey: " tmr_test_service_account_should_not_send ",
    requestId: "req_v2_me_session_only"
  } as Parameters<typeof client.getV2Me>[0] & { apiKey: string });

  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-67890");
  assert.equal(headers.Authorization, undefined);
  assert.equal(headers["x-api-key"], undefined);
  assert.equal(headers["X-API-Key"], undefined);
  assert.equal(headers["x-client-name"], "contract-test");
});

test("@machinesroom/api-client parses standard V2 me API errors", async () => {
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async () =>
      new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            requestId: "req_error"
          }
        }),
        { status: 401, headers: { "content-type": "application/json" } }
      )) as unknown as typeof fetch
  });

  await assert.rejects(
    () => client.getV2Me({ sessionToken: "missing-session-token-12345" }),
    (error) =>
      error instanceof MachineRoomApiClientError &&
      error.status === 401 &&
      error.requestId === "req_error" &&
      /Authentication required/.test(error.message)
  );
});

test("@machinesroom/api-client parses V1 actionable API errors", async () => {
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async () =>
      new Response(
        JSON.stringify({
          error: "Replay nonce detected",
          code: "AGENT_NONCE_REPLAY",
          message: "Replay nonce detected",
          details: { nonce: "nonce-123" },
          nextAction: "Generate a fresh nonce and re-sign the request.",
          docs: { skill: "https://machinesroom.com/agents/skill.md" }
        }),
        { status: 409, headers: { "content-type": "application/json", "retry-after": "7" } }
      )) as unknown as typeof fetch
  });

  await assert.rejects(
    () => client.getHome(),
    (error) =>
      error instanceof MachineRoomApiClientError &&
      error.status === 409 &&
      error.code === "AGENT_NONCE_REPLAY" &&
      error.retryAfterSeconds === 7 &&
      error.nextAction === "Generate a fresh nonce and re-sign the request." &&
      error.docs?.skill === "https://machinesroom.com/agents/skill.md" &&
      /Replay nonce detected/.test(error.message)
  );
});

test("@machinesroom/api-client reads V2 users me with actor session fields", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            user: {
              id: "user_123",
              email: "person@example.com"
            },
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
                  workspaceId: "workspace_123",
                  roles: ["viewer"],
                  permissions: ["story.read"]
                }
              ],
              unsupportedGrantKeys: {
                roles: [],
                permissions: []
              }
            },
            proof: {
              verifiedHuman: true,
              linkedHumanId: "human_123",
              provider: "WORLD_ID",
              tier: "L3"
            },
            session: {
              expiresAt: "2026-04-28T12:00:00.000Z"
            }
          },
          requestId: "req_v2_users_me"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2UsersMe({
    sessionToken: " session-token-valid-users-me ",
    requestId: "req_v2_users_me"
  });

  assert.equal(response.data.actor.actorId, "human-human_123");
  assert.equal(response.data.actor.userId, "user_123");
  assert.deepEqual(response.data.authorization.memberships[0], {
    membershipId: "membership_123",
    organizationId: "org_123",
    workspaceId: "workspace_123",
    roles: ["viewer"],
    permissions: ["story.read"]
  });
  assert.equal(calls[0]?.url, "https://example.com/v2/users/me");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-users-me");
  assert.equal(headers["x-request-id"], "req_v2_users_me");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client tolerates V2 users me payloads before authorization rollout", async () => {
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async () =>
      new Response(
        JSON.stringify({
          data: {
            user: {
              id: "user_123",
              email: "person@example.com"
            },
            actor: {
              actorId: "human-user_123",
              actorType: "human",
              verified: false,
              userId: "user_123"
            },
            proof: {
              verifiedHuman: false
            },
            session: {
              expiresAt: "2026-04-28T12:00:00.000Z"
            }
          },
          requestId: "req_v2_users_me_legacy"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )) as unknown as typeof fetch
  });

  const response = await client.getV2UsersMe({
    sessionToken: "session-token-valid-users-me"
  });

  assert.deepEqual(response.data.authorization, {
    memberships: [],
    unsupportedGrantKeys: {
      roles: [],
      permissions: []
    }
  });
});

test("@machinesroom/api-client lists pending V2 workspace membership invites for the current user", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            invites: [
              {
                membershipId: "membership_invite_123",
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
          requestId: "req_v2_pending_workspace_invites"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2PendingWorkspaceMembershipInvites({
    sessionToken: " session-token-valid-users-me ",
    requestId: "req_v2_pending_workspace_invites"
  });

  assert.equal(response.data.invites[0]?.membershipId, "membership_invite_123");
  assert.equal(calls[0]?.url, "https://example.com/v2/users/me/workspace-membership-invites");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-users-me");
  assert.equal(headers["x-request-id"], "req_v2_pending_workspace_invites");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client reads a pending V2 workspace membership invite for the current user", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            invite: {
              membershipId: "membership_invite_123",
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
          requestId: "req_v2_pending_workspace_invite"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2PendingWorkspaceMembershipInvite({
    membershipId: " membership/invite 123 ",
    sessionToken: " session-token-valid-users-me ",
    requestId: "req_v2_pending_workspace_invite"
  });

  assert.equal(response.data.invite.membershipId, "membership_invite_123");
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/users/me/workspace-membership-invites/%20membership%2Finvite%20123%20"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-users-me");
  assert.equal(headers["x-request-id"], "req_v2_pending_workspace_invite");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client reads scoped V2 organization memberships for the current user", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
          requestId: "req_v2_org_memberships_me"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2OrganizationMembershipsMe({
    organizationId: "org_123",
    sessionToken: " session-token-valid-org-123 ",
    requestId: "req_v2_org_memberships_me"
  });

  assert.equal(response.data.organizationId, "org_123");
  assert.deepEqual(response.data.authorization.memberships, [
    {
      membershipId: "membership_123",
      organizationId: "org_123",
      roles: ["viewer"],
      permissions: ["story.read"]
    }
  ]);
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123/memberships/me");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-org-123");
  assert.equal(headers["x-request-id"], "req_v2_org_memberships_me");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client reads V2 organization admin resources with user-session headers", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    headers: {
      Authorization: "Bearer tmr_test_service_account_configured_bearer_should_not_send",
      "X-API-Key": "tmr_test_service_account_configured_default_should_not_send",
      "x-client-name": "contract-test"
    },
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      const responses: Record<string, unknown> = {
        "https://example.com/v2/organizations": {
          data: {
            organizations: [
              {
                organizationId: "org_123",
                slug: "machine-room",
                name: "Machine Room",
                plan: "ENTERPRISE",
                status: "ACTIVE",
                createdAt: "2026-05-07T00:00:00.000Z",
                updatedAt: "2026-05-07T00:30:00.000Z"
              }
            ]
          },
          requestId: "req_v2_organizations"
        },
        "https://example.com/v2/organizations/org_123": {
          data: {
            organization: {
              organizationId: "org_123",
              slug: "machine-room",
              name: "Machine Room",
              plan: "ENTERPRISE",
              status: "ACTIVE",
              metadata: { tierOwner: "platform" },
              createdAt: "2026-05-07T00:00:00.000Z",
              updatedAt: "2026-05-07T00:30:00.000Z"
            }
          },
          requestId: "req_v2_organization"
        },
        "https://example.com/v2/organizations/org_123/workspaces": {
          data: {
            organizationId: "org_123",
            workspaces: [
              {
                workspaceId: "workspace_123",
                organizationId: "org_123",
                slug: "newsroom",
                name: "Newsroom",
                status: "ACTIVE",
                createdAt: "2026-05-07T01:00:00.000Z",
                updatedAt: "2026-05-07T01:30:00.000Z"
              }
            ]
          },
          requestId: "req_v2_organization_workspaces"
        },
        "https://example.com/v2/organizations/org_123/workspaces/workspace_123": {
          data: {
            organizationId: "org_123",
            workspace: {
              workspaceId: "workspace_123",
              organizationId: "org_123",
              slug: "newsroom",
              name: "Newsroom",
              status: "ACTIVE",
              createdAt: "2026-05-07T01:00:00.000Z",
              updatedAt: "2026-05-07T01:30:00.000Z"
            }
          },
          requestId: "req_v2_workspace"
        }
      };
      return new Response(JSON.stringify(responses[url]), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }) as unknown as typeof fetch
  });

  const organizations = await client.getV2Organizations({
    sessionToken: " session-token-valid-org-admin ",
    requestId: "req_v2_organizations"
  });
  const organization = await client.getV2Organization({
    organizationId: "org_123",
    sessionToken: " session-token-valid-org-admin ",
    requestId: "req_v2_organization"
  });
  const workspaces = await client.getV2OrganizationWorkspaces({
    organizationId: "org_123",
    sessionToken: " session-token-valid-org-admin ",
    requestId: "req_v2_organization_workspaces"
  });
  const workspace = await client.getV2Workspace({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    sessionToken: " session-token-valid-org-admin ",
    requestId: "req_v2_workspace"
  });

  assert.equal(organizations.data.organizations[0]?.plan, "ENTERPRISE");
  assert.equal(organization.data.organization.status, "ACTIVE");
  assert.deepEqual(organization.data.organization.metadata, { tierOwner: "platform" });
  assert.equal(workspaces.data.workspaces[0]?.workspaceId, "workspace_123");
  assert.equal(workspace.data.workspace.name, "Newsroom");
  assert.deepEqual(
    calls.map((call) => call.url),
    [
      "https://example.com/v2/organizations",
      "https://example.com/v2/organizations/org_123",
      "https://example.com/v2/organizations/org_123/workspaces",
      "https://example.com/v2/organizations/org_123/workspaces/workspace_123"
    ]
  );
  for (const call of calls) {
    const headers = call.init.headers as Record<string, string>;
    assert.equal(headers["x-user-session-token"], "session-token-valid-org-admin");
    assert.equal(headers.Authorization, undefined);
    assert.equal(headers["X-API-Key"], undefined);
    assert.equal(headers["x-client-name"], "contract-test");
    assert.equal(call.init.cache, "no-store");
  }
});

test("@machinesroom/api-client updates V2 organization metadata with user-session headers", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    headers: {
      Authorization: "Bearer tmr_test_service_account_configured_bearer_should_not_send",
      "X-API-Key": "tmr_test_service_account_configured_default_should_not_send",
      "x-client-name": "contract-test"
    },
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            organization: {
              organizationId: "org_123",
              slug: "machine-room",
              name: "Machine Room",
              plan: "ENTERPRISE",
              status: "ACTIVE",
              metadata: {
                billingContact: "ops@example.com"
              },
              createdAt: "2026-05-07T00:00:00.000Z",
              updatedAt: "2026-05-07T02:00:00.000Z"
            },
            updated: true,
            updatedFields: ["metadata"]
          },
          idempotency: {
            status: "created",
            key: "retry-key:organization-metadata-update",
            requestId: "req_v2_organization_metadata_update"
          },
          requestId: "req_v2_organization_metadata_update"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.updateV2OrganizationMetadata({
    organizationId: "org_123",
    sessionToken: " session-token-valid-org-admin ",
    idempotencyKey: "retry-key:organization-metadata-update",
    requestId: "req_v2_organization_metadata_update",
    metadata: {
      billingContact: "ops@example.com"
    }
  });

  assert.equal(response.data.updated, true);
  assert.deepEqual(response.data.organization.metadata, { billingContact: "ops@example.com" });
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123");
  assert.equal(calls[0]?.init.method, "PATCH");
  assert.equal(calls[0]?.init.body, JSON.stringify({ metadata: { billingContact: "ops@example.com" } }));
  assert.equal(calls[0]?.init.cache, "no-store");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-org-admin");
  assert.equal(headers["Idempotency-Key"], "retry-key:organization-metadata-update");
  assert.equal(headers["x-request-id"], "req_v2_organization_metadata_update");
  assert.equal(headers.Authorization, undefined);
  assert.equal(headers["X-API-Key"], undefined);
  assert.equal(headers["x-client-name"], "contract-test");
});

test("@machinesroom/api-client manages V2 organization OIDC settings with user-session headers", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    headers: {
      Authorization: "Bearer tmr_test_service_account_configured_bearer_should_not_send",
      "X-API-Key": "tmr_test_service_account_configured_default_should_not_send",
      "x-client-name": "contract-test"
    },
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      const oidcSettings = {
        organizationId: "org_123",
        status: "ACTIVE",
        providerName: "Okta Workforce",
        issuer: "https://idp.example.com/oauth2/default",
        clientId: "machine-room-client",
        clientSecretConfigured: true,
        allowedDomains: ["news.example.com"],
        jitProvisioningEnabled: false,
        createdAt: "2026-05-07T00:00:00.000Z",
        updatedAt: "2026-05-07T02:00:00.000Z"
      };
      return new Response(
        JSON.stringify(
          init.method === "PATCH"
            ? {
                data: {
                  organizationId: "org_123",
                  oidcSettings,
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
                  key: "retry-key:organization-oidc-settings",
                  requestId: "req_v2_organization_oidc_settings_update"
                },
                requestId: "req_v2_organization_oidc_settings_update"
              }
            : {
                data: {
                  organizationId: "org_123",
                  oidcSettings
                },
                requestId: "req_v2_organization_oidc_settings"
              }
        ),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const readResponse = await client.getV2OrganizationOidcSettings({
    organizationId: "org_123",
    sessionToken: " session-token-valid-org-admin ",
    requestId: "req_v2_organization_oidc_settings"
  });
  const updateResponse = await client.updateV2OrganizationOidcSettings({
    organizationId: "org_123",
    sessionToken: " session-token-valid-org-admin ",
    requestId: "req_v2_organization_oidc_settings_update",
    idempotencyKey: "retry-key:organization-oidc-settings",
    status: "ACTIVE",
    providerName: "Okta Workforce",
    issuer: "https://idp.example.com/oauth2/default/",
    clientId: "machine-room-client",
    allowedDomains: ["News.Example.COM"],
    jitProvisioningEnabled: false
  });

  assert.equal(readResponse.data.oidcSettings.clientSecretConfigured, true);
  assert.equal(updateResponse.data.updated, true);
  assert.deepEqual(
    calls.map((call) => call.url),
    [
      "https://example.com/v2/organizations/org_123/oidc-settings",
      "https://example.com/v2/organizations/org_123/oidc-settings"
    ]
  );
  assert.equal(calls[0]?.init.method, "GET");
  assert.equal(calls[1]?.init.method, "PATCH");
  assert.equal(
    calls[1]?.init.body,
    JSON.stringify({
      status: "ACTIVE",
      providerName: "Okta Workforce",
      issuer: "https://idp.example.com/oauth2/default/",
      clientId: "machine-room-client",
      allowedDomains: ["News.Example.COM"],
      jitProvisioningEnabled: false
    })
  );
  for (const call of calls) {
    const headers = call.init.headers as Record<string, string>;
    assert.equal(headers["x-user-session-token"], "session-token-valid-org-admin");
    assert.equal(headers.Authorization, undefined);
    assert.equal(headers["X-API-Key"], undefined);
    assert.equal(headers["x-client-name"], "contract-test");
    assert.equal(call.init.cache, "no-store");
  }
  const updateHeaders = calls[1]?.init.headers as Record<string, string>;
  assert.equal(updateHeaders["Idempotency-Key"], "retry-key:organization-oidc-settings");
});

test("@machinesroom/api-client reads scoped V2 organization roles", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
          requestId: "req_v2_org_roles"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2OrganizationRoles({
    organizationId: "org_123",
    sessionToken: " session-token-valid-org-123 ",
    requestId: "req_v2_org_roles"
  });

  assert.equal(response.data.organizationId, "org_123");
  assert.deepEqual(response.data.roles, [
    {
      roleId: "role_org_reviewer",
      organizationId: "org_123",
      key: "reviewer",
      name: "Reviewer",
      system: false,
      permissions: ["role.read", "story.read"]
    }
  ]);
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123/roles");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-org-123");
  assert.equal(headers["x-request-id"], "req_v2_org_roles");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client reads scoped V2 workspace memberships for the current user", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
          requestId: "req_v2_workspace_memberships_me"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2WorkspaceMembershipsMe({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_memberships_me"
  });

  assert.equal(response.data.organizationId, "org_123");
  assert.equal(response.data.workspaceId, "workspace_123");
  assert.deepEqual(response.data.authorization.memberships, [
    {
      membershipId: "membership_123",
      organizationId: "org_123",
      workspaceId: "workspace_123",
      roles: ["editor"],
      permissions: ["story.transition"]
    }
  ]);
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships/me");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_memberships_me");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client reads scoped V2 workspace memberships inventory", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
              }
            ]
          },
          requestId: "req_v2_workspace_memberships"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2WorkspaceMemberships({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_memberships"
  });

  assert.equal(response.data.organizationId, "org_123");
  assert.equal(response.data.workspaceId, "workspace_123");
  assert.equal(response.data.memberships[0]?.membershipId, "membership_123");
  assert.equal(response.data.memberships[0]?.roles[0]?.roleKey, "workspace-editor");
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_memberships");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client reads scoped V2 workspace roles", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
          requestId: "req_v2_workspace_roles"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2WorkspaceRoles({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_roles"
  });

  assert.equal(response.data.organizationId, "org_123");
  assert.equal(response.data.workspaceId, "workspace_123");
  assert.deepEqual(response.data.roles, [
    {
      roleId: "role_workspace_editor",
      organizationId: "org_123",
      workspaceId: "workspace_123",
      key: "workspace-editor",
      name: "Workspace Editor",
      system: false,
      permissions: ["role.read", "story.transition"]
    }
  ]);
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123/workspaces/workspace_123/roles");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_roles");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client invites scoped V2 workspace memberships idempotently", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
            requestId: "req_v2_workspace_membership_invite"
          },
          requestId: "req_v2_workspace_membership_invite"
        }),
        { status: 201, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.inviteV2WorkspaceMembership({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    email: "candidate@example.com",
    displayName: "Candidate Person",
    idempotencyKey: "retry-key:membership-invite",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_membership_invite"
  });

  assert.equal(response.data.membershipId, "membership_invite_123");
  assert.equal(response.data.created, true);
  assert.equal(response.idempotency.status, "created");
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_membership_invite");
  assert.equal(headers["Idempotency-Key"], "retry-key:membership-invite");
  assert.equal(headers["content-type"], "application/json");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(
    calls[0]?.init.body,
    JSON.stringify({ email: "candidate@example.com", displayName: "Candidate Person" })
  );
});

test("@machinesroom/api-client cancels scoped V2 workspace membership invites idempotently", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
            requestId: "req_v2_workspace_membership_invite_cancel"
          },
          requestId: "req_v2_workspace_membership_invite_cancel"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.cancelV2WorkspaceMembershipInvite({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    membershipId: "membership_invite_123",
    idempotencyKey: "retry-key:membership-invite-cancel",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_membership_invite_cancel"
  });

  assert.equal(response.data.membershipId, "membership_invite_123");
  assert.equal(response.data.canceled, true);
  assert.equal(response.idempotency.status, "created");
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships/membership_invite_123/cancel-invite"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_membership_invite_cancel");
  assert.equal(headers["Idempotency-Key"], "retry-key:membership-invite-cancel");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, undefined);
});

test("@machinesroom/api-client resends scoped V2 workspace membership invites idempotently", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
            requestId: "req_v2_workspace_membership_invite_resend"
          },
          requestId: "req_v2_workspace_membership_invite_resend"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.resendV2WorkspaceMembershipInvite({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    membershipId: "membership_invite_123",
    idempotencyKey: "retry-key:membership-invite-resend",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_membership_invite_resend"
  });

  assert.equal(response.data.membershipId, "membership_invite_123");
  assert.equal(response.data.resent, true);
  assert.equal(response.idempotency.status, "created");
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships/membership_invite_123/resend-invite"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_membership_invite_resend");
  assert.equal(headers["Idempotency-Key"], "retry-key:membership-invite-resend");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, undefined);
});

test("@machinesroom/api-client updates scoped V2 workspace membership invite emails idempotently", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            membershipId: "membership_invite_123",
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
            requestId: "req_v2_workspace_membership_invite_email_update"
          },
          requestId: "req_v2_workspace_membership_invite_email_update"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.updateV2WorkspaceMembershipInviteEmail({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    membershipId: "membership_invite_123",
    invitedEmail: " Corrected@Example.com ",
    idempotencyKey: "retry-key:membership-invite-email",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_membership_invite_email_update"
  });

  assert.equal(response.data.membershipId, "membership_invite_123");
  assert.equal(response.data.userId, "user_corrected");
  assert.deepEqual(response.data.updatedFields, ["invitedEmail", "userId"]);
  assert.equal(response.idempotency.status, "created");
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships/membership_invite_123/invite-email"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_membership_invite_email_update");
  assert.equal(headers["Idempotency-Key"], "retry-key:membership-invite-email");
  assert.equal(headers["content-type"], "application/json");
  assert.equal(calls[0]?.init.method, "PATCH");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, JSON.stringify({ invitedEmail: " Corrected@Example.com " }));
});

test("@machinesroom/api-client accepts scoped V2 workspace membership invites idempotently", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
            requestId: "req_v2_workspace_membership_invite_accept"
          },
          requestId: "req_v2_workspace_membership_invite_accept"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.acceptV2WorkspaceMembershipInvite({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    membershipId: "membership_invite_123",
    idempotencyKey: "retry-key:membership-invite-accept",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_membership_invite_accept"
  });

  assert.equal(response.data.membershipId, "membership_invite_123");
  assert.equal(response.data.status, "ACTIVE");
  assert.equal(response.data.accepted, true);
  assert.equal(response.idempotency.status, "created");
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships/membership_invite_123/accept-invite"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_membership_invite_accept");
  assert.equal(headers["Idempotency-Key"], "retry-key:membership-invite-accept");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, undefined);
});

test("@machinesroom/api-client declines scoped V2 workspace membership invites idempotently", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
            requestId: "req_v2_workspace_membership_invite_decline"
          },
          requestId: "req_v2_workspace_membership_invite_decline"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.declineV2WorkspaceMembershipInvite({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    membershipId: "membership_invite_123",
    idempotencyKey: "retry-key:membership-invite-decline",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_membership_invite_decline"
  });

  assert.equal(response.data.membershipId, "membership_invite_123");
  assert.equal(response.data.status, "REMOVED");
  assert.equal(response.data.declined, true);
  assert.equal(response.idempotency.status, "created");
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships/membership_invite_123/decline-invite"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_membership_invite_decline");
  assert.equal(headers["Idempotency-Key"], "retry-key:membership-invite-decline");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, undefined);
});

test("@machinesroom/api-client assigns scoped V2 workspace membership roles idempotently", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
            requestId: "req_v2_workspace_role_assign"
          },
          requestId: "req_v2_workspace_role_assign"
        }),
        { status: 201, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.assignV2WorkspaceMembershipRole({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    membershipId: "membership_123",
    roleId: "role_workspace_editor",
    idempotencyKey: "retry-key:membership-role",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_role_assign"
  });

  assert.equal(response.data.membershipRoleId, "membership_role_123");
  assert.equal(response.idempotency.status, "created");
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships/membership_123/roles"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_role_assign");
  assert.equal(headers["Idempotency-Key"], "retry-key:membership-role");
  assert.equal(headers["content-type"], "application/json");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, JSON.stringify({ roleId: "role_workspace_editor" }));
});

test("@machinesroom/api-client removes scoped V2 workspace memberships idempotently", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            membershipId: "membership_123",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            userId: "user_member",
            status: "REMOVED",
            roles: [],
            createdAt: "2026-04-28T18:00:00.000Z",
            updatedAt: "2026-04-29T00:00:00.000Z",
            removed: true
          },
          idempotency: {
            status: "created",
            key: "retry-key:membership-remove",
            requestId: "req_v2_workspace_membership_remove"
          },
          requestId: "req_v2_workspace_membership_remove"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.removeV2WorkspaceMembership({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    membershipId: "membership_123",
    idempotencyKey: "retry-key:membership-remove",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_membership_remove"
  });

  assert.equal(response.data.membershipId, "membership_123");
  assert.equal(response.data.status, "REMOVED");
  assert.equal(response.data.removed, true);
  assert.equal(response.idempotency.status, "created");
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships/membership_123"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_membership_remove");
  assert.equal(headers["Idempotency-Key"], "retry-key:membership-remove");
  assert.equal(calls[0]?.init.method, "DELETE");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, undefined);
});

test("@machinesroom/api-client leaves scoped V2 workspaces idempotently", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            membershipId: "membership_self",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            userId: "user_member",
            status: "REMOVED",
            roles: [],
            createdAt: "2026-04-28T18:00:00.000Z",
            updatedAt: "2026-04-29T00:00:00.000Z",
            left: true
          },
          idempotency: {
            status: "created",
            key: "retry-key:membership-leave",
            requestId: "req_v2_workspace_membership_leave"
          },
          requestId: "req_v2_workspace_membership_leave"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.leaveV2WorkspaceMembership({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    idempotencyKey: "retry-key:membership-leave",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_membership_leave"
  });

  assert.equal(response.data.membershipId, "membership_self");
  assert.equal(response.data.status, "REMOVED");
  assert.equal(response.data.left, true);
  assert.equal(response.idempotency.status, "created");
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships/me"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_membership_leave");
  assert.equal(headers["Idempotency-Key"], "retry-key:membership-leave");
  assert.equal(calls[0]?.init.method, "DELETE");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, undefined);
});

test("@machinesroom/api-client suspends scoped V2 workspace memberships idempotently", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            membershipId: "membership_123",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            userId: "user_member",
            status: "SUSPENDED",
            roles: [],
            createdAt: "2026-04-28T18:00:00.000Z",
            updatedAt: "2026-04-29T00:00:00.000Z",
            suspended: true
          },
          idempotency: {
            status: "created",
            key: "retry-key:membership-suspend",
            requestId: "req_v2_workspace_membership_suspend"
          },
          requestId: "req_v2_workspace_membership_suspend"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.suspendV2WorkspaceMembership({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    membershipId: "membership_123",
    idempotencyKey: "retry-key:membership-suspend",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_membership_suspend"
  });

  assert.equal(response.data.membershipId, "membership_123");
  assert.equal(response.data.status, "SUSPENDED");
  assert.equal(response.data.suspended, true);
  assert.equal(response.idempotency.status, "created");
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships/membership_123/suspend"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_membership_suspend");
  assert.equal(headers["Idempotency-Key"], "retry-key:membership-suspend");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, undefined);
});

test("@machinesroom/api-client updates scoped V2 workspace membership status idempotently", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
            requestId: "req_v2_workspace_membership_update"
          },
          requestId: "req_v2_workspace_membership_update"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.updateV2WorkspaceMembership({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    membershipId: "membership_123",
    status: "SUSPENDED",
    idempotencyKey: "retry-key:membership-update",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_membership_update"
  });

  assert.equal(response.data.membershipId, "membership_123");
  assert.equal(response.data.status, "SUSPENDED");
  assert.equal(response.data.updated, true);
  assert.deepEqual(response.data.updatedFields, ["status"]);
  assert.equal(response.data.previousStatus, "ACTIVE");
  assert.equal(response.idempotency.status, "created");
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships/membership_123"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_membership_update");
  assert.equal(headers["Idempotency-Key"], "retry-key:membership-update");
  assert.equal(calls[0]?.init.method, "PATCH");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, JSON.stringify({ status: "SUSPENDED" }));
});

test("@machinesroom/api-client reactivates scoped V2 workspace memberships idempotently", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            membershipId: "membership_123",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            userId: "user_member",
            status: "ACTIVE",
            roles: [],
            createdAt: "2026-04-28T18:00:00.000Z",
            updatedAt: "2026-04-29T00:00:00.000Z",
            reactivated: true
          },
          idempotency: {
            status: "created",
            key: "retry-key:membership-reactivate",
            requestId: "req_v2_workspace_membership_reactivate"
          },
          requestId: "req_v2_workspace_membership_reactivate"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.reactivateV2WorkspaceMembership({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    membershipId: "membership_123",
    idempotencyKey: "retry-key:membership-reactivate",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_membership_reactivate"
  });

  assert.equal(response.data.membershipId, "membership_123");
  assert.equal(response.data.status, "ACTIVE");
  assert.equal(response.data.reactivated, true);
  assert.equal(response.idempotency.status, "created");
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships/membership_123/reactivate"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_membership_reactivate");
  assert.equal(headers["Idempotency-Key"], "retry-key:membership-reactivate");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, undefined);
});

test("@machinesroom/api-client removes scoped V2 workspace membership roles idempotently", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
            requestId: "req_v2_workspace_role_remove"
          },
          requestId: "req_v2_workspace_role_remove"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.removeV2WorkspaceMembershipRole({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    membershipId: "membership_123",
    roleId: "role_workspace_editor",
    idempotencyKey: "retry-key:membership-role-remove",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_role_remove"
  });

  assert.equal(response.data.membershipRoleId, "membership_role_123");
  assert.equal(response.data.removed, true);
  assert.equal(response.idempotency.status, "created");
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/memberships/membership_123/roles/role_workspace_editor"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_role_remove");
  assert.equal(headers["Idempotency-Key"], "retry-key:membership-role-remove");
  assert.equal(calls[0]?.init.method, "DELETE");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, undefined);
});

test("@machinesroom/api-client reads scoped V2 organization service accounts", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
          requestId: "req_v2_org_service_accounts"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2OrganizationServiceAccounts({
    organizationId: "org_123",
    sessionToken: " session-token-valid-org-123 ",
    requestId: "req_v2_org_service_accounts"
  });

  assert.equal(response.data.organizationId, "org_123");
  assert.deepEqual(response.data.serviceAccounts, [
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
  ]);
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123/service-accounts");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-org-123");
  assert.equal(headers["x-request-id"], "req_v2_org_service_accounts");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client creates scoped V2 organization service accounts", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            serviceAccountId: "svc_org_automation",
            organizationId: "org_123",
            name: "Organization Automation",
            status: "ACTIVE",
            createdByUserId: "user_creator",
            createdAt: "2026-04-29T00:00:00.000Z",
            updatedAt: "2026-04-29T00:00:00.000Z",
            created: true
          },
          idempotency: {
            status: "created",
            key: "retry-key:service-account-org-create",
            requestId: "req_v2_org_service_account_create"
          },
          requestId: "req_v2_org_service_account_create"
        }),
        { status: 201, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.createV2OrganizationServiceAccount({
    organizationId: "org_123",
    name: " Organization Automation ",
    idempotencyKey: "retry-key:service-account-org-create",
    sessionToken: " session-token-valid-org-123 ",
    requestId: "req_v2_org_service_account_create"
  });

  assert.equal(response.data.serviceAccountId, "svc_org_automation");
  assert.equal(response.data.created, true);
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123/service-accounts");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-org-123");
  assert.equal(headers["x-request-id"], "req_v2_org_service_account_create");
  assert.equal(headers["Idempotency-Key"], "retry-key:service-account-org-create");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, JSON.stringify({ name: " Organization Automation " }));
});

test("@machinesroom/api-client revokes scoped V2 organization service accounts", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            serviceAccountId: "svc_org_writer",
            organizationId: "org_123",
            name: "Organization Writer",
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
            key: "retry-key:service-account-org-revoke",
            requestId: "req_v2_org_service_account_revoke"
          },
          requestId: "req_v2_org_service_account_revoke"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.revokeV2OrganizationServiceAccount({
    organizationId: "org_123",
    serviceAccountId: "svc_org_writer",
    idempotencyKey: "retry-key:service-account-org-revoke",
    sessionToken: " session-token-valid-org-123 ",
    requestId: "req_v2_org_service_account_revoke"
  });

  assert.equal(response.data.serviceAccountId, "svc_org_writer");
  assert.equal(response.data.status, "REVOKED");
  assert.equal(response.data.revokedApiKeyCount, 2);
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/service-accounts/svc_org_writer/revoke"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-org-123");
  assert.equal(headers["x-request-id"], "req_v2_org_service_account_revoke");
  assert.equal(headers["Idempotency-Key"], "retry-key:service-account-org-revoke");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, undefined);
});

test("@machinesroom/api-client reads scoped V2 organization API keys", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            organizationId: "org_123",
            apiKeys: [
              {
                apiKeyId: "api_key_org_writer",
                organizationId: "org_123",
                serviceAccountId: "svc_org_writer",
                name: "Organization Writer Key",
                status: "EXPIRED",
                expiresAt: "2999-05-28T00:00:00.000Z",
                lastUsedAt: "2026-04-28T12:00:00.000Z",
                createdAt: "2026-04-28T00:00:00.000Z",
                updatedAt: "2026-04-28T01:00:00.000Z"
              }
            ]
          },
          requestId: "req_v2_org_api_keys"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2OrganizationApiKeys({
    organizationId: "org_123",
    sessionToken: " session-token-valid-org-123 ",
    requestId: "req_v2_org_api_keys"
  });

  assert.equal(response.data.organizationId, "org_123");
  assert.deepEqual(response.data.apiKeys, [
    {
      apiKeyId: "api_key_org_writer",
      organizationId: "org_123",
      serviceAccountId: "svc_org_writer",
      name: "Organization Writer Key",
      status: "EXPIRED",
      expiresAt: "2999-05-28T00:00:00.000Z",
      lastUsedAt: "2026-04-28T12:00:00.000Z",
      createdAt: "2026-04-28T00:00:00.000Z",
      updatedAt: "2026-04-28T01:00:00.000Z"
    }
  ]);
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123/api-keys");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-org-123");
  assert.equal(headers["x-request-id"], "req_v2_org_api_keys");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client creates scoped V2 organization API keys", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            apiKeyId: "api_key_org_writer_new",
            organizationId: "org_123",
            serviceAccountId: "svc_org_writer",
            name: "Organization Writer Key",
            keyPrefix: "tmr_live",
            status: "ACTIVE",
            expiresAt: "2999-05-28T00:00:00.000Z",
            createdAt: "2026-04-29T00:00:00.000Z",
            updatedAt: "2026-04-29T00:00:00.000Z",
            created: true,
            secretAvailable: true,
            apiKey: "tmr_test_example_abcdefghijklmnopqrstuvwxyz1234567890"
          },
          idempotency: {
            status: "created",
            key: "retry-key:api-key-org-create",
            requestId: "req_v2_org_api_key_create"
          },
          requestId: "req_v2_org_api_key_create"
        }),
        { status: 201, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.createV2OrganizationApiKey({
    organizationId: "org_123",
    serviceAccountId: "svc_org_writer",
    name: "Organization Writer Key",
    expiresAt: "2999-05-28T00:00:00.000Z",
    idempotencyKey: "retry-key:api-key-org-create",
    sessionToken: " session-token-valid-org-123 ",
    requestId: "req_v2_org_api_key_create"
  });

  assert.equal(response.data.apiKeyId, "api_key_org_writer_new");
  assert.equal(response.data.secretAvailable, true);
  assert.equal(response.data.apiKey, "tmr_test_example_abcdefghijklmnopqrstuvwxyz1234567890");
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123/api-keys");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-org-123");
  assert.equal(headers["x-request-id"], "req_v2_org_api_key_create");
  assert.equal(headers["Idempotency-Key"], "retry-key:api-key-org-create");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(
    calls[0]?.init.body,
    JSON.stringify({
      name: "Organization Writer Key",
      serviceAccountId: "svc_org_writer",
      expiresAt: "2999-05-28T00:00:00.000Z"
    })
  );
});

test("@machinesroom/api-client revokes scoped V2 organization API keys", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            apiKeyId: "api_key_org_writer",
            organizationId: "org_123",
            serviceAccountId: "svc_org_writer",
            name: "Organization Writer Key",
            status: "REVOKED",
            expiresAt: "2999-05-28T00:00:00.000Z",
            revokedAt: "2026-04-29T00:00:00.000Z",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-29T00:00:00.000Z",
            previousStatus: "ACTIVE",
            revoked: true
          },
          idempotency: {
            status: "created",
            key: "retry-key:api-key-org-revoke",
            requestId: "req_v2_org_api_key_revoke"
          },
          requestId: "req_v2_org_api_key_revoke"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.revokeV2OrganizationApiKey({
    organizationId: "org_123",
    apiKeyId: "api_key_org_writer",
    idempotencyKey: "retry-key:api-key-org-revoke",
    sessionToken: " session-token-valid-org-123 ",
    requestId: "req_v2_org_api_key_revoke"
  });

  assert.equal(response.data.apiKeyId, "api_key_org_writer");
  assert.equal(response.data.status, "REVOKED");
  assert.equal(response.data.revoked, true);
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123/api-keys/api_key_org_writer/revoke");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-org-123");
  assert.equal(headers["x-request-id"], "req_v2_org_api_key_revoke");
  assert.equal(headers["Idempotency-Key"], "retry-key:api-key-org-revoke");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, undefined);
});

test("@machinesroom/api-client reads scoped V2 organization audit events", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
              nextCursor: "cursor_next"
            }
          },
          requestId: "req_v2_org_audit_events"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2OrganizationAuditEvents({
    organizationId: "org_123",
    limit: 2,
    cursor: " cursor_123 ",
    actorKind: "USER",
    action: "story.read",
    resourceType: "story",
    auditRequestId: " req_audit ",
    createdAtFrom: " 2026-04-28T00:00:00.000Z ",
    createdAtTo: "2026-04-29T00:00:00.000Z",
    sessionToken: " session-token-valid-org-123 ",
    requestId: "req_v2_org_audit_events"
  });

  assert.equal(response.data.organizationId, "org_123");
  assert.deepEqual(response.data.auditEvents, [
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
  ]);
  assert.deepEqual(response.data.pagination, {
    nextCursor: "cursor_next"
  });
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/audit-events?limit=2&cursor=cursor_123&actorKind=USER&action=story.read&resourceType=story&requestId=req_audit&createdAtFrom=2026-04-28T00%3A00%3A00.000Z&createdAtTo=2026-04-29T00%3A00%3A00.000Z"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-org-123");
  assert.equal(headers["x-request-id"], "req_v2_org_audit_events");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client sends service-account API keys for V2 organization audit reads", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            organizationId: "org_123",
            auditEvents: [],
            pagination: {}
          },
          requestId: "req_v2_org_audit_service"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  await client.getV2OrganizationAuditEvents({
    organizationId: "org_123",
    apiKey: " tmr_test_service_account_audit_key_1234567890 ",
    requestId: "req_v2_org_audit_service"
  });

  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-api-key"], "tmr_test_service_account_audit_key_1234567890");
  assert.equal(headers["x-user-session-token"], undefined);
  assert.equal(headers["x-request-id"], "req_v2_org_audit_service");
});

test("@machinesroom/api-client reads scoped V2 workspace service accounts", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
          requestId: "req_v2_workspace_service_accounts"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2WorkspaceServiceAccounts({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_service_accounts"
  });

  assert.equal(response.data.organizationId, "org_123");
  assert.equal(response.data.workspaceId, "workspace_123");
  assert.deepEqual(response.data.serviceAccounts, [
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
  ]);
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123/workspaces/workspace_123/service-accounts");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_service_accounts");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client creates scoped V2 workspace service accounts", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            serviceAccountId: "svc_workspace_automation",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            name: "Workspace Automation",
            status: "ACTIVE",
            createdByUserId: "user_creator",
            createdAt: "2026-04-29T00:00:00.000Z",
            updatedAt: "2026-04-29T00:00:00.000Z",
            created: true
          },
          idempotency: {
            status: "created",
            key: "retry-key:service-account-workspace-create",
            requestId: "req_v2_workspace_service_account_create"
          },
          requestId: "req_v2_workspace_service_account_create"
        }),
        { status: 201, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.createV2WorkspaceServiceAccount({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    name: "Workspace Automation",
    idempotencyKey: "retry-key:service-account-workspace-create",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_service_account_create"
  });

  assert.equal(response.data.serviceAccountId, "svc_workspace_automation");
  assert.equal(response.data.workspaceId, "workspace_123");
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123/workspaces/workspace_123/service-accounts");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_service_account_create");
  assert.equal(headers["Idempotency-Key"], "retry-key:service-account-workspace-create");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, JSON.stringify({ name: "Workspace Automation" }));
});

test("@machinesroom/api-client revokes scoped V2 workspace service accounts", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            serviceAccountId: "svc_workspace_writer",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            name: "Workspace Writer",
            status: "REVOKED",
            createdByUserId: "user_creator",
            revokedAt: "2026-04-29T00:00:00.000Z",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-29T00:00:00.000Z",
            previousStatus: "SUSPENDED",
            revoked: true,
            revokedApiKeyCount: 1
          },
          idempotency: {
            status: "created",
            key: "retry-key:service-account-workspace-revoke",
            requestId: "req_v2_workspace_service_account_revoke"
          },
          requestId: "req_v2_workspace_service_account_revoke"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.revokeV2WorkspaceServiceAccount({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    serviceAccountId: "svc_workspace_writer",
    idempotencyKey: "retry-key:service-account-workspace-revoke",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_service_account_revoke"
  });

  assert.equal(response.data.serviceAccountId, "svc_workspace_writer");
  assert.equal(response.data.workspaceId, "workspace_123");
  assert.equal(response.data.status, "REVOKED");
  assert.equal(response.data.revokedApiKeyCount, 1);
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/service-accounts/svc_workspace_writer/revoke"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_service_account_revoke");
  assert.equal(headers["Idempotency-Key"], "retry-key:service-account-workspace-revoke");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, undefined);
});

test("@machinesroom/api-client reads scoped V2 workspace API keys", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
                expiresAt: "2999-05-28T00:00:00.000Z",
                lastUsedAt: "2026-04-28T12:00:00.000Z",
                createdAt: "2026-04-28T00:00:00.000Z",
                updatedAt: "2026-04-28T01:00:00.000Z"
              }
            ]
          },
          requestId: "req_v2_workspace_api_keys"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2WorkspaceApiKeys({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_api_keys"
  });

  assert.equal(response.data.organizationId, "org_123");
  assert.equal(response.data.workspaceId, "workspace_123");
  assert.deepEqual(response.data.apiKeys, [
    {
      apiKeyId: "api_key_workspace_writer",
      organizationId: "org_123",
      workspaceId: "workspace_123",
      serviceAccountId: "svc_workspace_writer",
      name: "Workspace Writer Key",
      status: "ACTIVE",
      expiresAt: "2999-05-28T00:00:00.000Z",
      lastUsedAt: "2026-04-28T12:00:00.000Z",
      createdAt: "2026-04-28T00:00:00.000Z",
      updatedAt: "2026-04-28T01:00:00.000Z"
    }
  ]);
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123/workspaces/workspace_123/api-keys");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_api_keys");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client creates scoped V2 workspace API keys", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            apiKeyId: "api_key_workspace_writer_new",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            serviceAccountId: "svc_workspace_writer",
            name: "Workspace Writer Key",
            keyPrefix: "tmr_live",
            status: "ACTIVE",
            expiresAt: "2999-05-28T00:00:00.000Z",
            createdAt: "2026-04-29T00:00:00.000Z",
            updatedAt: "2026-04-29T00:00:00.000Z",
            created: true,
            secretAvailable: true,
            apiKey: "tmr_test_workspace_example_abcdefghijklmnopqrstuvwxyz1234567890"
          },
          idempotency: {
            status: "created",
            key: "retry-key:api-key-workspace-create",
            requestId: "req_v2_workspace_api_key_create"
          },
          requestId: "req_v2_workspace_api_key_create"
        }),
        { status: 201, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.createV2WorkspaceApiKey({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    serviceAccountId: "svc_workspace_writer",
    name: "Workspace Writer Key",
    expiresAt: "2999-05-28T00:00:00.000Z",
    idempotencyKey: "retry-key:api-key-workspace-create",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_api_key_create"
  });

  assert.equal(response.data.apiKeyId, "api_key_workspace_writer_new");
  assert.equal(response.data.workspaceId, "workspace_123");
  assert.equal(response.data.secretAvailable, true);
  assert.equal(response.data.apiKey, "tmr_test_workspace_example_abcdefghijklmnopqrstuvwxyz1234567890");
  assert.equal(calls[0]?.url, "https://example.com/v2/organizations/org_123/workspaces/workspace_123/api-keys");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_api_key_create");
  assert.equal(headers["Idempotency-Key"], "retry-key:api-key-workspace-create");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(
    calls[0]?.init.body,
    JSON.stringify({
      name: "Workspace Writer Key",
      serviceAccountId: "svc_workspace_writer",
      expiresAt: "2999-05-28T00:00:00.000Z"
    })
  );
});

test("@machinesroom/api-client revokes scoped V2 workspace API keys", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            apiKeyId: "api_key_workspace_writer",
            organizationId: "org_123",
            workspaceId: "workspace_123",
            serviceAccountId: "svc_workspace_writer",
            name: "Workspace Writer Key",
            status: "REVOKED",
            expiresAt: "2999-05-28T00:00:00.000Z",
            revokedAt: "2026-04-29T00:00:00.000Z",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-29T00:00:00.000Z",
            previousStatus: "ACTIVE",
            revoked: true
          },
          idempotency: {
            status: "created",
            key: "retry-key:api-key-workspace-revoke",
            requestId: "req_v2_workspace_api_key_revoke"
          },
          requestId: "req_v2_workspace_api_key_revoke"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.revokeV2WorkspaceApiKey({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    apiKeyId: "api_key_workspace_writer",
    idempotencyKey: "retry-key:api-key-workspace-revoke",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_api_key_revoke"
  });

  assert.equal(response.data.apiKeyId, "api_key_workspace_writer");
  assert.equal(response.data.workspaceId, "workspace_123");
  assert.equal(response.data.status, "REVOKED");
  assert.equal(response.data.revoked, true);
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/api-keys/api_key_workspace_writer/revoke"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_api_key_revoke");
  assert.equal(headers["Idempotency-Key"], "retry-key:api-key-workspace-revoke");
  assert.equal(calls[0]?.init.method, "POST");
  assert.equal(calls[0]?.init.cache, "no-store");
  assert.equal(calls[0]?.init.body, undefined);
});

test("@machinesroom/api-client reads scoped V2 workspace audit events", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
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
          requestId: "req_v2_workspace_audit_events"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  const response = await client.getV2WorkspaceAuditEvents({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    limit: 25,
    actorKind: "USER",
    action: "workspace.role.read",
    resourceType: "role",
    traceId: " trace_workspace ",
    sessionToken: " session-token-valid-workspace-123 ",
    requestId: "req_v2_workspace_audit_events"
  });

  assert.equal(response.data.organizationId, "org_123");
  assert.equal(response.data.workspaceId, "workspace_123");
  assert.deepEqual(response.data.auditEvents, [
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
  ]);
  assert.deepEqual(response.data.pagination, {});
  assert.equal(
    calls[0]?.url,
    "https://example.com/v2/organizations/org_123/workspaces/workspace_123/audit-events?limit=25&actorKind=USER&action=workspace.role.read&resourceType=role&traceId=trace_workspace"
  );
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-user-session-token"], "session-token-valid-workspace-123");
  assert.equal(headers["x-request-id"], "req_v2_workspace_audit_events");
  assert.equal(calls[0]?.init.cache, "no-store");
});

test("@machinesroom/api-client sends service-account API keys for V2 workspace audit reads", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createMachineRoomApiClient({
    baseUrl: "https://example.com",
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          data: {
            organizationId: "org_123",
            workspaceId: "workspace_123",
            auditEvents: [],
            pagination: {}
          },
          requestId: "req_v2_workspace_audit_service"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch
  });

  await client.getV2WorkspaceAuditEvents({
    organizationId: "org_123",
    workspaceId: "workspace_123",
    apiKey: " service_account_workspace_audit_key_1234567890 ",
    requestId: "req_v2_workspace_audit_service"
  });

  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers["x-api-key"], "service_account_workspace_audit_key_1234567890");
  assert.equal(headers["x-user-session-token"], undefined);
  assert.equal(headers["x-request-id"], "req_v2_workspace_audit_service");
});
