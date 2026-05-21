import crypto from "node:crypto";

export const REWARD_MERKLE_DISTRIBUTOR_CONTRACT_NAME = "RewardMerkleDistributor";
export const REWARD_MERKLE_DISTRIBUTOR_SOURCE_PATH = "contracts/RewardMerkleDistributor.sol";
export const REWARD_CLAIM_LEAF_DOMAIN = "TMR_REWARD_CLAIM_V1";

export const REWARD_MERKLE_DISTRIBUTOR_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "token_", type: "address" },
      { name: "admin_", type: "address" }
    ]
  },
  {
    type: "function",
    name: "createBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "batchId", type: "bytes32" },
      { name: "merkleRoot", type: "bytes32" },
      { name: "totalAmount", type: "uint256" },
      { name: "activateAt", type: "uint64" },
      { name: "expiresAt", type: "uint64" },
      { name: "metadataURI", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setBatchFrozen",
    stateMutability: "nonpayable",
    inputs: [
      { name: "batchId", type: "bytes32" },
      { name: "frozen", type: "bool" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setPaused",
    stateMutability: "nonpayable",
    inputs: [{ name: "paused_", type: "bool" }],
    outputs: []
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [
      { name: "batchId", type: "bytes32" },
      { name: "index", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "payoutIdsHash", type: "bytes32" },
      { name: "proof", type: "bytes32[]" },
      { name: "proofLeft", type: "bool[]" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "computeLeafHash",
    stateMutability: "pure",
    inputs: [
      { name: "batchId", type: "bytes32" },
      { name: "index", type: "uint256" },
      { name: "account", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "payoutIdsHash", type: "bytes32" }
    ],
    outputs: [{ name: "", type: "bytes32" }]
  },
  {
    type: "function",
    name: "verifyProof",
    stateMutability: "pure",
    inputs: [
      { name: "leafHash", type: "bytes32" },
      { name: "proof", type: "bytes32[]" },
      { name: "proofLeft", type: "bool[]" },
      { name: "merkleRoot", type: "bytes32" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "event",
    name: "Claimed",
    inputs: [
      { name: "batchId", type: "bytes32", indexed: true },
      { name: "leafHash", type: "bytes32", indexed: true },
      { name: "account", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false }
    ],
    anonymous: false
  }
] as const;

export interface RewardClaimLeafInput {
  batchId: string;
  index: bigint | number;
  account: string;
  amount: bigint | number | string;
  payoutIdsHash: string;
}

export interface RewardClaimProofNode {
  hash: string;
  left: boolean;
}

const HEX_32 = /^0x[0-9a-fA-F]{64}$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const UINT_256_BYTES = 32;

function sha256Hex(buffer: Buffer | string): string {
  return `0x${crypto.createHash("sha256").update(buffer).digest("hex")}`;
}

function bytes32(input: string, label: string): Buffer {
  if (!HEX_32.test(input)) {
    throw new Error(`${label} must be a 32-byte hex string`);
  }
  return Buffer.from(input.slice(2), "hex");
}

function addressBytes(input: string): Buffer {
  if (!ADDRESS.test(input)) {
    throw new Error("account must be an EVM address");
  }
  return Buffer.from(input.slice(2), "hex");
}

function uint256Bytes(input: bigint | number | string, label: string): Buffer {
  const value = typeof input === "bigint" ? input : BigInt(input);
  if (value < 0n || value >= (1n << 256n)) {
    throw new Error(`${label} must fit uint256`);
  }
  const hex = value.toString(16).padStart(UINT_256_BYTES * 2, "0");
  return Buffer.from(hex, "hex");
}

export function rewardClaimLeafDomainHash(): string {
  return sha256Hex(REWARD_CLAIM_LEAF_DOMAIN);
}

export function hashRewardClaimLeaf(input: RewardClaimLeafInput): string {
  return sha256Hex(
    Buffer.concat([
      bytes32(rewardClaimLeafDomainHash(), "domain"),
      bytes32(input.batchId, "batchId"),
      uint256Bytes(input.index, "index"),
      addressBytes(input.account),
      uint256Bytes(input.amount, "amount"),
      bytes32(input.payoutIdsHash, "payoutIdsHash")
    ])
  );
}

export function hashRewardPayoutIds(payoutIds: string[]): string {
  const normalized = Array.from(new Set(payoutIds.map((id) => id.trim()).filter(Boolean))).sort((left, right) =>
    left.localeCompare(right)
  );
  if (normalized.length === 0) {
    throw new Error("payoutIdsHash requires at least one payout id");
  }
  return sha256Hex(normalized.join(":"));
}

export function combineRewardMerkleNodes(left: string, right: string): string {
  return sha256Hex(Buffer.concat([bytes32(left, "left"), bytes32(right, "right")]));
}

function buildLayer(nodes: string[]): string[] {
  if (nodes.length <= 1) return nodes;
  const next: string[] = [];
  for (let index = 0; index < nodes.length; index += 2) {
    next.push(combineRewardMerkleNodes(nodes[index]!, nodes[index + 1] ?? nodes[index]!));
  }
  return buildLayer(next);
}

export function buildRewardClaimMerkleRoot(leafHashes: string[]): string {
  if (leafHashes.length === 0) return sha256Hex("empty");
  return buildLayer(leafHashes)[0]!;
}

export function buildRewardClaimProof(leafHashes: string[], leafIndex: number): RewardClaimProofNode[] {
  if (!Number.isInteger(leafIndex) || leafIndex < 0 || leafIndex >= leafHashes.length) {
    throw new Error("leafIndex is out of range");
  }
  let currentIndex = leafIndex;
  let layer = [...leafHashes];
  const proof: RewardClaimProofNode[] = [];
  while (layer.length > 1) {
    const isRightNode = currentIndex % 2 === 1;
    const pairIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;
    proof.push({
      hash: layer[pairIndex] ?? layer[currentIndex]!,
      left: isRightNode
    });
    const nextLayer: string[] = [];
    for (let index = 0; index < layer.length; index += 2) {
      nextLayer.push(combineRewardMerkleNodes(layer[index]!, layer[index + 1] ?? layer[index]!));
    }
    currentIndex = Math.floor(currentIndex / 2);
    layer = nextLayer;
  }
  return proof;
}

export function verifyRewardClaimProof(input: {
  leafHash: string;
  proof: RewardClaimProofNode[];
  merkleRoot: string;
}): boolean {
  let hash = input.leafHash;
  for (const node of input.proof) {
    hash = node.left ? combineRewardMerkleNodes(node.hash, hash) : combineRewardMerkleNodes(hash, node.hash);
  }
  return hash.toLowerCase() === input.merkleRoot.toLowerCase();
}
