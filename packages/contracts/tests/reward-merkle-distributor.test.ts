import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  buildRewardClaimMerkleRoot,
  buildRewardClaimProof,
  hashRewardClaimLeaf,
  hashRewardPayoutIds,
  REWARD_MERKLE_DISTRIBUTOR_ABI,
  REWARD_MERKLE_DISTRIBUTOR_SOURCE_PATH,
  verifyRewardClaimProof
} from "../src/index.js";

const BATCH_ID = `0x${"b".repeat(64)}`;
const ACCOUNT = `0x${"a".repeat(40)}`;
const OTHER_ACCOUNT = `0x${"c".repeat(40)}`;
const AMOUNT = 1_000_000_000_000_000_000n;

function sourceText(): string {
  return readFileSync(join(process.cwd(), REWARD_MERKLE_DISTRIBUTOR_SOURCE_PATH), "utf8");
}

class DistributorHarness {
  private readonly batch: {
    merkleRoot: string;
    totalAmount: bigint;
    claimedAmount: bigint;
    activateAt: number;
    expiresAt: number;
    frozen: boolean;
  };
  private readonly claimed = new Set<string>();
  paused = true;

  constructor(input: {
    merkleRoot: string;
    totalAmount: bigint;
    activateAt: number;
    expiresAt?: number;
    frozen?: boolean;
    paused?: boolean;
  }) {
    this.batch = {
      merkleRoot: input.merkleRoot,
      totalAmount: input.totalAmount,
      claimedAmount: 0n,
      activateAt: input.activateAt,
      expiresAt: input.expiresAt ?? 0,
      frozen: input.frozen ?? true
    };
    this.paused = input.paused ?? true;
  }

  claim(input: {
    now: number;
    index: number;
    account: string;
    amount: bigint;
    payoutIdsHash: string;
    proof: ReturnType<typeof buildRewardClaimProof>;
  }) {
    if (this.paused) throw new Error("Paused");
    if (this.batch.frozen) throw new Error("BatchFrozen");
    if (input.now < this.batch.activateAt) throw new Error("BatchInactive");
    if (this.batch.expiresAt !== 0 && input.now > this.batch.expiresAt) throw new Error("BatchExpired");
    const leafHash = hashRewardClaimLeaf({
      batchId: BATCH_ID,
      index: input.index,
      account: input.account,
      amount: input.amount,
      payoutIdsHash: input.payoutIdsHash
    });
    if (this.claimed.has(leafHash)) throw new Error("AlreadyClaimed");
    if (!verifyRewardClaimProof({ leafHash, proof: input.proof, merkleRoot: this.batch.merkleRoot })) {
      throw new Error("InvalidProof");
    }
    this.batch.claimedAmount += input.amount;
    if (this.batch.claimedAmount > this.batch.totalAmount) throw new Error("InvalidBatch");
    this.claimed.add(leafHash);
  }
}

test("RewardMerkleDistributor source exposes required safety controls", () => {
  const source = sourceText();
  assert.match(source, /contract RewardMerkleDistributor/);
  assert.match(source, /error AlreadyClaimed/);
  assert.match(source, /error BatchFrozen/);
  assert.match(source, /error BatchInactive/);
  assert.match(source, /error BatchExpired/);
  assert.match(source, /paused = true/);
  assert.match(source, /frozen: true/);
  assert.match(source, /function setPaused/);
  assert.match(source, /function setBatchFrozen/);
  assert.match(source, /function claim/);
  assert.match(source, /mapping\(bytes32 batchId => mapping\(bytes32 leafHash => bool claimed\)\) public claimedLeaves/);
  assert.match(source, /computeLeafHash\(batchId, index, msg\.sender, amount, payoutIdsHash\)/);
});

test("RewardMerkleDistributor ABI includes the guarded claim surface", () => {
  const names = REWARD_MERKLE_DISTRIBUTOR_ABI
    .map((entry) => ("name" in entry ? entry.name : "constructor"))
    .filter(Boolean);
  for (const name of ["constructor", "createBatch", "setBatchFrozen", "setPaused", "claim", "computeLeafHash", "verifyProof", "Claimed"]) {
    assert.equal(names.includes(name), true);
  }
});

test("reward claim leaf helpers produce valid and invalid proofs deterministically", () => {
  const firstPayoutIdsHash = hashRewardPayoutIds(["payout-a", "payout-b"]);
  const secondPayoutIdsHash = hashRewardPayoutIds(["payout-c"]);
  const leaves = [
    hashRewardClaimLeaf({
      batchId: BATCH_ID,
      index: 0,
      account: ACCOUNT,
      amount: AMOUNT,
      payoutIdsHash: firstPayoutIdsHash
    }),
    hashRewardClaimLeaf({
      batchId: BATCH_ID,
      index: 1,
      account: OTHER_ACCOUNT,
      amount: 2n * AMOUNT,
      payoutIdsHash: secondPayoutIdsHash
    })
  ];
  const merkleRoot = buildRewardClaimMerkleRoot(leaves);
  const proof = buildRewardClaimProof(leaves, 0);

  assert.equal(verifyRewardClaimProof({ leafHash: leaves[0]!, proof, merkleRoot }), true);

  const wrongAmountLeaf = hashRewardClaimLeaf({
    batchId: BATCH_ID,
    index: 0,
    account: ACCOUNT,
    amount: AMOUNT + 1n,
    payoutIdsHash: firstPayoutIdsHash
  });
  assert.equal(verifyRewardClaimProof({ leafHash: wrongAmountLeaf, proof, merkleRoot }), false);
});

test("reward claim harness rejects default paused, default frozen, double, invalid, inactive, and expired claims", () => {
  const payoutIdsHash = hashRewardPayoutIds(["payout-a"]);
  const leaf = hashRewardClaimLeaf({
    batchId: BATCH_ID,
    index: 0,
    account: ACCOUNT,
    amount: AMOUNT,
    payoutIdsHash
  });
  const root = buildRewardClaimMerkleRoot([leaf]);
  const proof = buildRewardClaimProof([leaf], 0);

  const defaultClosed = new DistributorHarness({ merkleRoot: root, totalAmount: AMOUNT, activateAt: 100 });
  assert.throws(
    () => defaultClosed.claim({ now: 150, index: 0, account: ACCOUNT, amount: AMOUNT, payoutIdsHash, proof }),
    /Paused/
  );

  const defaultBatchFrozen = new DistributorHarness({ merkleRoot: root, totalAmount: AMOUNT, activateAt: 100, paused: false });
  assert.throws(
    () => defaultBatchFrozen.claim({ now: 150, index: 0, account: ACCOUNT, amount: AMOUNT, payoutIdsHash, proof }),
    /BatchFrozen/
  );

  const active = new DistributorHarness({
    merkleRoot: root,
    totalAmount: AMOUNT,
    activateAt: 100,
    expiresAt: 200,
    frozen: false,
    paused: false
  });
  active.claim({ now: 150, index: 0, account: ACCOUNT, amount: AMOUNT, payoutIdsHash, proof });
  assert.throws(() => active.claim({ now: 150, index: 0, account: ACCOUNT, amount: AMOUNT, payoutIdsHash, proof }), /AlreadyClaimed/);

  const invalidProof = new DistributorHarness({ merkleRoot: root, totalAmount: AMOUNT, activateAt: 100, frozen: false, paused: false });
  assert.throws(
    () => invalidProof.claim({ now: 150, index: 0, account: OTHER_ACCOUNT, amount: AMOUNT, payoutIdsHash, proof }),
    /InvalidProof/
  );

  const inactive = new DistributorHarness({ merkleRoot: root, totalAmount: AMOUNT, activateAt: 100, frozen: false, paused: false });
  assert.throws(() => inactive.claim({ now: 99, index: 0, account: ACCOUNT, amount: AMOUNT, payoutIdsHash, proof }), /BatchInactive/);

  const frozen = new DistributorHarness({ merkleRoot: root, totalAmount: AMOUNT, activateAt: 100, frozen: true, paused: false });
  assert.throws(() => frozen.claim({ now: 150, index: 0, account: ACCOUNT, amount: AMOUNT, payoutIdsHash, proof }), /BatchFrozen/);

  const expired = new DistributorHarness({ merkleRoot: root, totalAmount: AMOUNT, activateAt: 100, expiresAt: 120, frozen: false, paused: false });
  assert.throws(() => expired.claim({ now: 121, index: 0, account: ACCOUNT, amount: AMOUNT, payoutIdsHash, proof }), /BatchExpired/);
});
