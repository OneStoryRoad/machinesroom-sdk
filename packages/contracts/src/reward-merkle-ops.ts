import crypto from "node:crypto";
import { z } from "zod";

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const HEX_32 = /^0x[0-9a-fA-F]{64}$/;
const UINT_STRING = /^(0|[1-9][0-9]*)$/;

export const RewardMerkleOperatorActionSchema = z.enum([
  "create-batch",
  "pause",
  "unpause",
  "freeze-batch",
  "unfreeze-batch"
]);
export type RewardMerkleOperatorAction = z.infer<typeof RewardMerkleOperatorActionSchema>;

export interface RewardMerkleOperatorManifest {
  claimBatchId?: string;
  merkleRoot?: string;
  totalAmountAtomic?: string;
  manifestHash?: string;
}

export interface RewardMerkleOperatorPlanInput {
  action: RewardMerkleOperatorAction;
  contractAddress: string;
  manifest?: RewardMerkleOperatorManifest | null;
  batchId?: string;
  merkleRoot?: string;
  totalAmountAtomic?: string;
  activateAt?: number;
  expiresAt?: number;
  metadataURI?: string;
}

export interface RewardMerkleOperatorPlan {
  action: RewardMerkleOperatorAction;
  contractAddress: string;
  functionName: "createBatch" | "setPaused" | "setBatchFrozen";
  args: readonly unknown[];
  manifestHash?: string;
  readyForMultisig: boolean;
  safetyNotes: string[];
}

function normalizeAddress(input: string): string {
  const value = input.trim();
  if (!EVM_ADDRESS.test(value)) {
    throw new Error("REWARD_CLAIMS_CONTRACT_ADDRESS must be an EVM address");
  }
  if (value.toLowerCase() === "0x0000000000000000000000000000000000000000") {
    throw new Error("REWARD_CLAIMS_CONTRACT_ADDRESS cannot be the zero address");
  }
  return value.toLowerCase();
}

function normalizeBytes32(input: string | undefined, label: string): string {
  const value = input?.trim();
  if (!value || !HEX_32.test(value)) {
    throw new Error(`${label} must be a 32-byte hex string`);
  }
  return value.toLowerCase();
}

function normalizeUintString(input: string | undefined, label: string): string {
  const value = input?.trim();
  if (!value || !UINT_STRING.test(value) || BigInt(value) <= 0n) {
    throw new Error(`${label} must be a positive uint string`);
  }
  return value;
}

function normalizeTimestamp(input: number | undefined, label: string): number {
  if (input === undefined) return 0;
  if (!Number.isSafeInteger(input) || input < 0 || input > 2 ** 64 - 1) {
    throw new Error(`${label} must be a uint64 unix timestamp`);
  }
  return input;
}

function manifestDigest(input: RewardMerkleOperatorManifest | null | undefined): string | undefined {
  if (!input) return undefined;
  if (typeof input.manifestHash === "string" && input.manifestHash.trim().length > 0) return input.manifestHash.trim();
  return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export function buildRewardMerkleOperatorPlan(input: RewardMerkleOperatorPlanInput): RewardMerkleOperatorPlan {
  const action = RewardMerkleOperatorActionSchema.parse(input.action);
  const contractAddress = normalizeAddress(input.contractAddress);
  const safetyNotes = [
    "Use this plan only for reviewed ORBS reward batches and audited RewardMerkleDistributor deployments.",
    "Do not enable claim APIs or fund a batch until legal, tax, sanctions, treasury, audit, and staging proof gates pass.",
    "Prefer multisig execution for production admin actions."
  ];

  if (action === "pause" || action === "unpause") {
    return {
      action,
      contractAddress,
      functionName: "setPaused",
      args: [action === "pause"],
      readyForMultisig: true,
      safetyNotes
    };
  }

  if (action === "freeze-batch" || action === "unfreeze-batch") {
    const digest = manifestDigest(input.manifest);
    return {
      action,
      contractAddress,
      functionName: "setBatchFrozen",
      args: [normalizeBytes32(input.batchId ?? input.manifest?.claimBatchId, "batchId"), action === "freeze-batch"],
      ...(digest ? { manifestHash: digest } : {}),
      readyForMultisig: true,
      safetyNotes
    };
  }

  const activateAt = normalizeTimestamp(input.activateAt, "activateAt");
  const expiresAt = normalizeTimestamp(input.expiresAt, "expiresAt");
  if (expiresAt !== 0 && expiresAt <= activateAt) {
    throw new Error("expiresAt must be greater than activateAt when set");
  }
  const digest = manifestDigest(input.manifest);

  return {
    action,
    contractAddress,
    functionName: "createBatch",
    args: [
      normalizeBytes32(input.batchId ?? input.manifest?.claimBatchId, "batchId"),
      normalizeBytes32(input.merkleRoot ?? input.manifest?.merkleRoot, "merkleRoot"),
      normalizeUintString(input.totalAmountAtomic ?? input.manifest?.totalAmountAtomic, "totalAmountAtomic"),
      activateAt,
      expiresAt,
      input.metadataURI?.trim() ?? ""
    ],
    ...(digest ? { manifestHash: digest } : {}),
    readyForMultisig: true,
    safetyNotes
  };
}
