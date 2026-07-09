import assert from "node:assert/strict";
import test from "node:test";
import { buildRewardMerkleOperatorPlan } from "../src/index.js";

const CONTRACT = `0x${"1".repeat(40)}`;
const BATCH_ID = `0x${"b".repeat(64)}`;
const ROOT = `0x${"c".repeat(64)}`;

test("reward operator plan creates reviewed batches with atomic token totals", () => {
  const plan = buildRewardMerkleOperatorPlan({
    action: "create-batch",
    contractAddress: CONTRACT,
    manifest: {
      claimBatchId: BATCH_ID,
      merkleRoot: ROOT,
      totalAmountAtomic: "3250000000000000000",
      manifestHash: "manifest-hash"
    },
    activateAt: 1_800_000_000,
    expiresAt: 1_801_000_000,
    metadataURI: "ipfs://reward-manifest"
  });

  assert.equal(plan.functionName, "createBatch");
  assert.deepEqual(plan.args, [
    BATCH_ID,
    ROOT,
    "3250000000000000000",
    1_800_000_000,
    1_801_000_000,
    "ipfs://reward-manifest"
  ]);
  assert.equal(plan.manifestHash, "manifest-hash");
  assert.equal(plan.readyForMultisig, true);
});

test("reward operator plan covers pause and batch freeze admin calls", () => {
  assert.deepEqual(
    buildRewardMerkleOperatorPlan({ action: "pause", contractAddress: CONTRACT }).args,
    [true]
  );
  assert.deepEqual(
    buildRewardMerkleOperatorPlan({ action: "unpause", contractAddress: CONTRACT }).args,
    [false]
  );
  assert.deepEqual(
    buildRewardMerkleOperatorPlan({ action: "freeze-batch", contractAddress: CONTRACT, batchId: BATCH_ID }).args,
    [BATCH_ID, true]
  );
  assert.deepEqual(
    buildRewardMerkleOperatorPlan({ action: "unfreeze-batch", contractAddress: CONTRACT, batchId: BATCH_ID }).args,
    [BATCH_ID, false]
  );
});

test("reward operator plan rejects unsafe batch input", () => {
  assert.throws(
    () =>
      buildRewardMerkleOperatorPlan({
        action: "create-batch",
        contractAddress: CONTRACT,
        batchId: BATCH_ID,
        merkleRoot: ROOT,
        totalAmountAtomic: "325000000",
        activateAt: 100,
        expiresAt: 99
      }),
    /expiresAt/
  );
  assert.throws(
    () =>
      buildRewardMerkleOperatorPlan({
        action: "create-batch",
        contractAddress: CONTRACT,
        batchId: BATCH_ID,
        merkleRoot: ROOT,
        totalAmountAtomic: "0"
      }),
    /totalAmountAtomic/
  );
});
