import crypto from "node:crypto";
import { z } from "zod";
import {
  REWARD_MERKLE_DISTRIBUTOR_CONTRACT_NAME,
  REWARD_MERKLE_DISTRIBUTOR_SOURCE_PATH
} from "./reward-merkle-distributor.js";

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const PRIVATE_KEY = /^0x[0-9a-fA-F]{64}$/;

export const RewardMerkleDeployModeSchema = z.enum(["dry-run", "send"]);
export type RewardMerkleDeployMode = z.infer<typeof RewardMerkleDeployModeSchema>;

export const RewardMerkleDistributorArtifactSchema = z.object({
  contractName: z.literal(REWARD_MERKLE_DISTRIBUTOR_CONTRACT_NAME),
  sourceName: z.literal(REWARD_MERKLE_DISTRIBUTOR_SOURCE_PATH),
  compilerVersion: z.string().min(1),
  sourceHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  abi: z.array(z.record(z.unknown())).min(1),
  bytecode: z.string().regex(/^0x[0-9a-fA-F]+$/),
  deployedBytecode: z.string().regex(/^0x[0-9a-fA-F]+$/),
  optimizer: z.object({
    enabled: z.boolean(),
    runs: z.number().int().nonnegative()
  })
});

export type RewardMerkleDistributorArtifact = z.infer<typeof RewardMerkleDistributorArtifactSchema>;

export interface RewardMerkleDeployEnv {
  REWARD_CLAIMS_CHAIN_ID?: string;
  REWARD_CLAIMS_RPC_URL?: string;
  REWARD_CLAIMS_TOKEN_ADDRESS?: string;
  REWARD_CLAIMS_ADMIN_ADDRESS?: string;
  REWARD_CONTRACT_DEPLOY_MODE?: string;
  REWARD_CONTRACT_DEPLOY_APPROVED?: string;
  REWARD_CLAIMS_DEPLOYER_PRIVATE_KEY?: string;
}

export interface RewardMerkleDeployPlan {
  contractName: typeof REWARD_MERKLE_DISTRIBUTOR_CONTRACT_NAME;
  mode: RewardMerkleDeployMode;
  chainId: number;
  rpcUrl: string;
  tokenAddress: string;
  adminAddress: string;
  constructorArgs: readonly [string, string];
  bytecodeHash: string;
  readyToSend: boolean;
  safetyNotes: string[];
}

function normalizeChainId(raw: string | undefined): number {
  if (!raw?.trim()) {
    throw new Error("REWARD_CLAIMS_CHAIN_ID is required");
  }
  const normalized = raw.trim().startsWith("eip155:") ? raw.trim().slice("eip155:".length) : raw.trim();
  if (!/^[1-9][0-9]*$/.test(normalized)) {
    throw new Error("REWARD_CLAIMS_CHAIN_ID must be a positive integer or eip155:<id>");
  }
  const chainId = Number(normalized);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw new Error("REWARD_CLAIMS_CHAIN_ID must fit a positive safe integer");
  }
  return chainId;
}

function normalizeUrl(raw: string | undefined, label: string): string {
  if (!raw?.trim()) {
    throw new Error(`${label} is required`);
  }
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("invalid protocol");
    }
    return url.toString();
  } catch {
    throw new Error(`${label} must be an http(s) URL`);
  }
}

function normalizeAddress(raw: string | undefined, label: string): string {
  if (!raw?.trim() || !EVM_ADDRESS.test(raw.trim())) {
    throw new Error(`${label} must be an EVM address`);
  }
  const address = raw.trim().toLowerCase();
  if (address === "0x0000000000000000000000000000000000000000") {
    throw new Error(`${label} cannot be the zero address`);
  }
  return address;
}

function normalizeMode(raw: string | undefined): RewardMerkleDeployMode {
  if (!raw?.trim()) return "dry-run";
  return RewardMerkleDeployModeSchema.parse(raw.trim());
}

function hashHex(input: string): string {
  return `0x${crypto.createHash("sha256").update(input).digest("hex")}`;
}

export function buildRewardMerkleDistributorDeployPlan(input: {
  artifact: RewardMerkleDistributorArtifact;
  env: RewardMerkleDeployEnv;
}): RewardMerkleDeployPlan {
  const artifact = RewardMerkleDistributorArtifactSchema.parse(input.artifact);
  const mode = normalizeMode(input.env.REWARD_CONTRACT_DEPLOY_MODE);
  const chainId = normalizeChainId(input.env.REWARD_CLAIMS_CHAIN_ID);
  const rpcUrl = normalizeUrl(input.env.REWARD_CLAIMS_RPC_URL, "REWARD_CLAIMS_RPC_URL");
  const tokenAddress = normalizeAddress(input.env.REWARD_CLAIMS_TOKEN_ADDRESS, "REWARD_CLAIMS_TOKEN_ADDRESS");
  const adminAddress = normalizeAddress(input.env.REWARD_CLAIMS_ADMIN_ADDRESS, "REWARD_CLAIMS_ADMIN_ADDRESS");
  const safetyNotes = [
    "The distributor is disabled-by-default operationally; do not enable claim APIs or fund batches without review approval.",
    "Dry-run mode never signs or broadcasts a transaction.",
    "Send mode requires REWARD_CONTRACT_DEPLOY_APPROVED=1 and a deployer private key."
  ];

  if (mode === "send") {
    if (input.env.REWARD_CONTRACT_DEPLOY_APPROVED !== "1") {
      throw new Error("REWARD_CONTRACT_DEPLOY_APPROVED=1 is required for send mode");
    }
    if (!PRIVATE_KEY.test(input.env.REWARD_CLAIMS_DEPLOYER_PRIVATE_KEY ?? "")) {
      throw new Error("REWARD_CLAIMS_DEPLOYER_PRIVATE_KEY is required for send mode");
    }
  }

  return {
    contractName: REWARD_MERKLE_DISTRIBUTOR_CONTRACT_NAME,
    mode,
    chainId,
    rpcUrl,
    tokenAddress,
    adminAddress,
    constructorArgs: [tokenAddress, adminAddress],
    bytecodeHash: hashHex(artifact.bytecode),
    readyToSend: mode === "send",
    safetyNotes
  };
}
