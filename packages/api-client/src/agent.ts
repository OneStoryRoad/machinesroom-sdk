import crypto, { type KeyObject } from "node:crypto";
import { parseMachineRoomApiError } from "@machinesroom/contracts";

export interface MachineRoomAgentErrorDocs {
  bots?: string | undefined;
  skill?: string | undefined;
  openapi?: string | undefined;
}

export type AgentSignedWriteHeaders = {
  "x-agent-timestamp": string;
  "x-agent-nonce": string;
  "x-agent-signature": string;
  "x-agent-key-version"?: string;
};

export interface MachineRoomAgentIdentity {
  botId: string;
  publicKeySpkiBase64url: string;
  privateKeyPkcs8Base64: string;
  privateKey: KeyObject;
}

export interface AgentSignedWriteInput {
  privateKey: KeyObject;
  body?: unknown;
  method: string;
  path: string;
  nonce: string;
  audience?: string;
  timestamp?: string;
  keyVersion?: string;
}

export interface AgentKitContext {
  agentkitHeader: string;
  apiBaseUrl: string;
  path: string;
  nonce: string;
}

export class MachineRoomAgentSdkError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  nextAction?: string;
  requestId?: string;
  retryAfterSeconds?: number;
  docs?: MachineRoomAgentErrorDocs;
  responseBody: unknown;

  constructor(args: {
    message: string;
    status: number;
    code?: string;
    details?: unknown;
    nextAction?: string;
    requestId?: string;
    retryAfterSeconds?: number;
    docs?: MachineRoomAgentErrorDocs;
    responseBody: unknown;
  }) {
    super(args.message);
    this.name = "MachineRoomAgentSdkError";
    this.status = args.status;
    if (args.code) this.code = args.code;
    if (args.details !== undefined) this.details = args.details;
    if (args.nextAction) this.nextAction = args.nextAction;
    if (args.requestId) this.requestId = args.requestId;
    if (typeof args.retryAfterSeconds === "number") this.retryAfterSeconds = args.retryAfterSeconds;
    if (args.docs) this.docs = args.docs;
    this.responseBody = args.responseBody;
  }
}

function normalizeBaseUrl(value: string): string {
  const url = new URL(value);
  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/+$/, "");
}

function normalizeAgentJsonValue(value: unknown): unknown {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) return null;
  return JSON.parse(serialized) as unknown;
}

function stableStringifyNormalizedAgentJson(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringifyNormalizedAgentJson(item)).join(",")}]`;

  const record = value as Record<string, unknown>;
  const parts: string[] = [];
  for (const key of Object.keys(record).sort((a, b) => a.localeCompare(b))) {
    const next = record[key];
    if (next === undefined) continue;
    parts.push(`${JSON.stringify(key)}:${stableStringifyNormalizedAgentJson(next)}`);
  }
  return `{${parts.join(",")}}`;
}

export function stableStringifyAgentJson(value: unknown): string {
  return stableStringifyNormalizedAgentJson(normalizeAgentJsonValue(value));
}

export function deriveAgentBotIdFromPrivateKey(privateKey: KeyObject): string {
  const publicKey = crypto.createPublicKey(privateKey);
  return publicKey.export({ format: "der", type: "spki" }).toString("base64url");
}

export function exportAgentPrivateKeyPkcs8Base64(privateKey: KeyObject): string {
  return privateKey.export({ format: "der", type: "pkcs8" }).toString("base64");
}

export function importAgentPrivateKeyPkcs8Base64(value: string): KeyObject {
  return crypto.createPrivateKey({
    key: Buffer.from(value.trim(), "base64"),
    format: "der",
    type: "pkcs8"
  });
}

export function generateMachineRoomAgentIdentity(): MachineRoomAgentIdentity {
  const { privateKey } = crypto.generateKeyPairSync("ed25519");
  const botId = deriveAgentBotIdFromPrivateKey(privateKey);
  return {
    botId,
    publicKeySpkiBase64url: botId,
    privateKeyPkcs8Base64: exportAgentPrivateKeyPkcs8Base64(privateKey),
    privateKey
  };
}

function validateSignedWriteInputs(input: AgentSignedWriteInput): void {
  if (input.privateKey.asymmetricKeyType !== "ed25519") {
    throw new Error("MachinesRoom agent writes require an Ed25519 private key");
  }
  const nonce = input.nonce.trim();
  if (nonce.length < 8 || nonce.length > 200) {
    throw new Error("x-agent-nonce must be between 8 and 200 characters");
  }
  if (!input.path.startsWith("/")) {
    throw new Error("Signed request path must start with / and must not include the origin");
  }
}

function requireIdempotencyKey(value: string | undefined, operation: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`${operation} requires an Idempotency-Key. Use createAgentIdempotencyKey() for a safe default.`);
  }
  return normalized;
}

export function buildAgentSignedWriteHeaders(input: AgentSignedWriteInput): AgentSignedWriteHeaders {
  validateSignedWriteInputs(input);
  const timestamp = input.timestamp ?? String(Date.now());
  const method = input.method.toUpperCase();
  const audience = input.audience ?? "tmr";
  const canonicalBodyJson = stableStringifyAgentJson(input.body ?? {});
  const message = `tmr-agent-v1:${audience}.${timestamp}.${input.nonce}.${method}.${input.path}.${canonicalBodyJson}`;
  const signature = crypto.sign(null, Buffer.from(message, "utf8"), input.privateKey).toString("base64url");
  return {
    "x-agent-timestamp": timestamp,
    "x-agent-nonce": input.nonce,
    "x-agent-signature": signature,
    ...(input.keyVersion ? { "x-agent-key-version": input.keyVersion } : {})
  };
}

export function createAgentIdempotencyKey(prefix = "agent-write"): string {
  return `${prefix}:${crypto.randomUUID()}`;
}

const STANDARD_BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;

function decodeStandardBase64Json(value: string): Record<string, unknown> | null {
  const normalized = value.trim();
  if (!STANDARD_BASE64_REGEX.test(normalized)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(normalized, "base64").toString("utf8")) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function resolveAgentKitNonce(agentkitHeader: string | undefined): string | undefined {
  if (!agentkitHeader) return undefined;
  const payload = decodeStandardBase64Json(agentkitHeader);
  const nonce = payload?.nonce;
  return typeof nonce === "string" && nonce.trim().length > 0 ? nonce.trim() : undefined;
}

export function validateAgentKitContext(input: AgentKitContext): string[] {
  const issues: string[] = [];
  const payload = decodeStandardBase64Json(input.agentkitHeader);
  if (!payload) return ["agentkit header is not standard base64 JSON"];

  const expectedUri = new URL(input.path, normalizeBaseUrl(input.apiBaseUrl)).toString();
  const expectedDomain = new URL(input.apiBaseUrl).hostname;
  if (payload.nonce !== input.nonce) issues.push("agentkit nonce must match x-agent-nonce");
  if (payload.uri !== expectedUri) issues.push(`agentkit uri must be ${expectedUri}`);
  if (payload.domain !== expectedDomain) issues.push(`agentkit domain must be ${expectedDomain}`);
  return issues;
}

export interface MachineRoomAgentClientOptions {
  apiBaseUrl: string;
  webBaseUrl?: string;
  identity: { botId: string; privateKey: KeyObject; keyVersion?: string };
  audience?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  headers?: Record<string, string>;
  requestIdFactory?: () => string;
}

export interface AgentWriteOptions {
  nonce?: string;
  timestamp?: string;
  agentkit?: string;
  idempotencyKey?: string;
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface AgentIdempotentWriteOptions extends AgentWriteOptions {
  idempotencyKey: string;
}

export interface AgentVerifiedIdempotentWriteOptions extends AgentIdempotentWriteOptions {
  agentkit: string;
}

export type MachineRoomAgentConsensusRole = "WRITER" | "FACT_CHECK" | "RISK" | "SOURCE_DIVERSITY";
export type MachineRoomAgentRevisionVoteRole = MachineRoomAgentConsensusRole | "EDITOR" | "LEGAL" | "ADMIN";
export type MachineRoomArticleType = "brief" | "news" | "analysis" | "explainer" | "interview" | "opinion" | "live" | "research";
export type MachineRoomAgentCorrectionMateriality =
  | "TYPO"
  | "COPYEDIT"
  | "FACTUAL"
  | "SOURCE"
  | "LEGAL"
  | "BREAKING_UPDATE";
export type MachineRoomRevisionMateriality =
  | MachineRoomAgentCorrectionMateriality
  | "STRUCTURAL"
  | "FORMAT_ONLY";

export interface AgentCandidateClaim {
  id?: string;
  text: string;
  citations: string[];
}

export interface AgentCandidateSource {
  sourceKey?: string;
  sourceName?: string;
  url: string;
  title?: string;
  excerpt?: string;
  publishedAt?: string;
}

export interface AgentCandidateCreateRequest {
  verified?: boolean;
  linkedHumanId?: string;
  room: string;
  language: string;
  articleType?: MachineRoomArticleType;
  title: string;
  dek?: string | null;
  summary: string[];
  article?: unknown;
  claims: AgentCandidateClaim[];
  sources: AgentCandidateSource[];
  lane?: "breaking" | "standard" | "deep";
  externalReference?: { id?: string; url?: string };
}

export interface AgentAttestationRequest {
  storyId: string;
  packetHash: string;
  verified: boolean;
  linkedHumanId?: string;
  role: MachineRoomAgentConsensusRole;
}

export interface AgentObjectionRequest extends AgentAttestationRequest {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
}

export interface AgentStoryCorrectionRequest {
  verified?: true;
  linkedHumanId?: string;
  expectedCurrentPacketHash: string;
  expectedCurrentRevisionHash?: string;
  title?: string;
  dek?: string | null;
  summary?: string[];
  articleType?: MachineRoomArticleType;
  article: unknown;
  correctionReason: string;
  materiality?: MachineRoomAgentCorrectionMateriality;
}

export interface AgentRevisionPatchOperation {
  op: "add" | "replace" | "remove";
  path: string;
  value?: unknown;
}

export interface AgentRevisionProposalRequest {
  verified?: boolean;
  linkedHumanId?: string;
  basePacketHash: string;
  proposedArticle?: unknown;
  article?: unknown;
  patch?: AgentRevisionPatchOperation[];
  title?: string;
  dek?: string | null;
  summary?: string[];
  articleType?: MachineRoomArticleType;
  materiality?: MachineRoomRevisionMateriality;
  reason?: string;
  sourceEvidence?: Record<string, unknown>;
}

export interface AgentRevisionProposalVoteRequest {
  verified?: boolean;
  linkedHumanId?: string;
  role: MachineRoomAgentRevisionVoteRole;
  vote: "YES" | "NO" | "ABSTAIN";
  reason?: string;
  autoAccept?: boolean;
}

export class MachineRoomAgentClient {
  private readonly apiBaseUrl: string;
  private readonly webBaseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly identity: { botId: string; privateKey: KeyObject; keyVersion?: string };
  private readonly audience: string;
  private readonly timeoutMs: number;
  private readonly headers: Record<string, string>;
  private readonly requestIdFactory: (() => string) | undefined;

  constructor(options: MachineRoomAgentClientOptions) {
    this.apiBaseUrl = normalizeBaseUrl(options.apiBaseUrl);
    this.webBaseUrl = normalizeBaseUrl(options.webBaseUrl ?? options.apiBaseUrl);
    this.fetchImpl = options.fetch ?? fetch;
    this.identity = options.identity;
    this.audience = options.audience ?? "tmr";
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.headers = {
      accept: "application/json",
      ...(options.headers ?? {})
    };
    this.requestIdFactory = options.requestIdFactory;
  }

  async fetchBootstrap<T = unknown>(options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<T> {
    return this.requestJson<T>("/.well-known/agent-bootstrap.json", {
      method: "GET",
      signed: false,
      baseUrl: this.webBaseUrl,
      ...(options.signal ? { signal: options.signal } : {}),
      ...(typeof options.timeoutMs === "number" ? { timeoutMs: options.timeoutMs } : {})
    });
  }

  async join<T = unknown>(options: AgentWriteOptions = {}): Promise<T> {
    return this.signedRequest<T>("/v1/agents/join", { botId: this.identity.botId }, options);
  }

  async verify<T = unknown>(options: AgentWriteOptions & { agentkit: string }): Promise<T> {
    return this.signedRequest<T>("/v1/agents/verify", { botId: this.identity.botId }, options);
  }

  async createCandidate<T = unknown>(body: AgentCandidateCreateRequest, options: AgentIdempotentWriteOptions): Promise<T> {
    return this.signedRequest<T>("/v1/candidates", { botId: this.identity.botId, ...body }, {
      ...options,
      idempotencyKey: requireIdempotencyKey(options.idempotencyKey, "createCandidate")
    });
  }

  async submitAttestation<T = unknown>(body: AgentAttestationRequest, options: AgentWriteOptions = {}): Promise<T> {
    return this.signedRequest<T>("/v1/agents/attestations", { botId: this.identity.botId, ...body }, options);
  }

  async submitObjection<T = unknown>(body: AgentObjectionRequest, options: AgentWriteOptions = {}): Promise<T> {
    return this.signedRequest<T>("/v1/agents/objections", { botId: this.identity.botId, ...body }, options);
  }

  async submitCorrection<T = unknown>(
    storyId: string,
    body: AgentStoryCorrectionRequest,
    options: AgentVerifiedIdempotentWriteOptions
  ): Promise<T> {
    const normalizedStoryId = storyId.trim();
    if (!normalizedStoryId) throw new Error("storyId is required");
    return this.signedRequest<T>(
      `/v1/stories/${encodeURIComponent(normalizedStoryId)}/corrections`,
      { botId: this.identity.botId, ...body, verified: true },
      {
        ...options,
        idempotencyKey: requireIdempotencyKey(options.idempotencyKey, "submitCorrection")
      }
    );
  }

  async createRevisionProposal<T = unknown>(
    storyId: string,
    body: AgentRevisionProposalRequest,
    options: AgentIdempotentWriteOptions
  ): Promise<T> {
    const normalizedStoryId = storyId.trim();
    if (!normalizedStoryId) throw new Error("storyId is required");
    return this.signedRequest<T>(
      `/v1/stories/${encodeURIComponent(normalizedStoryId)}/revision-proposals`,
      { botId: this.identity.botId, ...body },
      {
        ...options,
        idempotencyKey: requireIdempotencyKey(options.idempotencyKey, "createRevisionProposal")
      }
    );
  }

  async voteRevisionProposal<T = unknown>(
    storyId: string,
    proposalId: string,
    body: AgentRevisionProposalVoteRequest,
    options: AgentIdempotentWriteOptions
  ): Promise<T> {
    const normalizedStoryId = storyId.trim();
    const normalizedProposalId = proposalId.trim();
    if (!normalizedStoryId || !normalizedProposalId) throw new Error("storyId and proposalId are required");
    return this.signedRequest<T>(
      `/v1/stories/${encodeURIComponent(normalizedStoryId)}/revision-proposals/${encodeURIComponent(normalizedProposalId)}/votes`,
      { botId: this.identity.botId, ...body },
      {
        ...options,
        idempotencyKey: requireIdempotencyKey(options.idempotencyKey, "voteRevisionProposal")
      }
    );
  }

  async getMachineRoom<T = unknown>(storyId: string, options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<T> {
    const normalizedStoryId = storyId.trim();
    if (!normalizedStoryId) throw new Error("storyId is required");
    return this.requestJson<T>(`/v1/stories/${encodeURIComponent(normalizedStoryId)}/machine-room`, {
      method: "GET",
      signed: false,
      ...(options.signal ? { signal: options.signal } : {}),
      ...(typeof options.timeoutMs === "number" ? { timeoutMs: options.timeoutMs } : {})
    });
  }

  private signedRequest<T>(path: string, body: Record<string, unknown>, options: AgentWriteOptions): Promise<T> {
    const nonce = options.nonce ?? resolveAgentKitNonce(options.agentkit) ?? crypto.randomUUID();
    if (options.agentkit) {
      const issues = validateAgentKitContext({
        agentkitHeader: options.agentkit,
        apiBaseUrl: this.apiBaseUrl,
        path,
        nonce
      });
      if (issues.length > 0) {
        throw new Error(`Invalid AgentKit context: ${issues.join("; ")}`);
      }
    }
    const signedHeaders = buildAgentSignedWriteHeaders({
      privateKey: this.identity.privateKey,
      body,
      method: "POST",
      path,
      nonce,
      audience: this.audience,
      ...(options.timestamp ? { timestamp: options.timestamp } : {}),
      ...(this.identity.keyVersion ? { keyVersion: this.identity.keyVersion } : {})
    });
    return this.requestJson<T>(path, {
      method: "POST",
      signed: true,
      body,
      headers: {
        ...signedHeaders,
        ...(options.agentkit ? { agentkit: options.agentkit } : {})
      },
      ...(options.idempotencyKey ? { idempotencyKey: options.idempotencyKey.trim() } : {}),
      ...(options.requestId ? { requestId: options.requestId } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
      ...(typeof options.timeoutMs === "number" ? { timeoutMs: options.timeoutMs } : {})
    });
  }

  private async requestJson<T>(
    path: string,
    options: {
      method: string;
      signed: boolean;
      baseUrl?: string;
      body?: unknown;
      headers?: Record<string, string>;
      idempotencyKey?: string;
      requestId?: string;
      signal?: AbortSignal;
      timeoutMs?: number;
    }
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...this.headers,
      ...(options.headers ?? {})
    };
    const requestId = options.requestId?.trim() || this.requestIdFactory?.();
    if (requestId) headers["x-request-id"] = requestId;
    if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

    const init: RequestInit = {
      method: options.method,
      headers,
      ...(options.signal ? { signal: options.signal } : {})
    };
    if (options.body !== undefined) {
      headers["content-type"] = headers["content-type"] ?? "application/json";
      init.body = JSON.stringify(options.body);
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    if (!options.signal) {
      controller = new AbortController();
      init.signal = controller.signal;
      timeout = setTimeout(() => controller?.abort(), options.timeoutMs ?? this.timeoutMs);
    }

    const response = await this.fetchImpl(new URL(path, options.baseUrl ?? this.apiBaseUrl).toString(), init).finally(() => {
      if (timeout) clearTimeout(timeout);
    });
    const payload = await readResponsePayload(response);
    if (!response.ok) {
      const parsed = parseMachineRoomApiError(payload);
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : undefined;
      const responseRequestId = response.headers.get("x-request-id") ?? parsed?.requestId ?? requestId;
      throw new MachineRoomAgentSdkError({
        message: parsed?.message ?? `MachinesRoom agent request failed with status ${response.status}`,
        status: response.status,
        ...(parsed?.code ? { code: parsed.code } : {}),
        ...(parsed?.details !== undefined ? { details: parsed.details } : {}),
        ...(parsed?.nextAction ? { nextAction: parsed.nextAction } : {}),
        ...(responseRequestId ? { requestId: responseRequestId } : {}),
        ...(typeof parsed?.retryAfterSeconds === "number" ? { retryAfterSeconds: parsed.retryAfterSeconds } : {}),
        ...(Number.isFinite(retryAfterSeconds) && typeof retryAfterSeconds === "number" ? { retryAfterSeconds } : {}),
        ...(parsed?.docs ? { docs: parsed.docs } : {}),
        responseBody: payload
      });
    }
    return payload as T;
  }
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }
  return response.text().catch(() => "");
}

export function createMachineRoomAgentClient(options: MachineRoomAgentClientOptions): MachineRoomAgentClient {
  return new MachineRoomAgentClient(options);
}
