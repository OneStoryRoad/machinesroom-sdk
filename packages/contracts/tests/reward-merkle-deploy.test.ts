import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  buildRewardMerkleDistributorDeployPlan,
  RewardMerkleDistributorArtifactSchema,
  REWARD_MERKLE_DISTRIBUTOR_CONTRACT_NAME,
  REWARD_MERKLE_DISTRIBUTOR_SOURCE_PATH
} from "../src/index.js";

function artifact() {
  return RewardMerkleDistributorArtifactSchema.parse(
    JSON.parse(readFileSync(join(process.cwd(), "artifacts", "RewardMerkleDistributor.json"), "utf8"))
  );
}

function sourceHash(): string {
  return `0x${crypto
    .createHash("sha256")
    .update(readFileSync(join(process.cwd(), REWARD_MERKLE_DISTRIBUTOR_SOURCE_PATH), "utf8"))
    .digest("hex")}`;
}

const validEnv = {
  REWARD_CLAIMS_CHAIN_ID: "31337",
  REWARD_CLAIMS_RPC_URL: "http://127.0.0.1:8545",
  REWARD_CLAIMS_TOKEN_ADDRESS: `0x${"1".repeat(40)}`,
  REWARD_CLAIMS_ADMIN_ADDRESS: `0x${"2".repeat(40)}`
};

test("compiled RewardMerkleDistributor artifact matches the committed source", () => {
  const compiled = artifact();
  assert.equal(compiled.contractName, REWARD_MERKLE_DISTRIBUTOR_CONTRACT_NAME);
  assert.equal(compiled.sourceHash, sourceHash());
  assert.match(compiled.compilerVersion, /^0\.8\.24\+/);
  assert.equal(compiled.optimizer.enabled, true);
  assert.equal(compiled.optimizer.runs, 200);
  assert.match(compiled.bytecode, /^0x[0-9a-f]+$/i);
  assert.match(compiled.deployedBytecode, /^0x[0-9a-f]+$/i);

  const names = compiled.abi.map((entry) => ("name" in entry ? entry.name : "constructor"));
  for (const name of [
    "constructor",
    "createBatch",
    "BatchCreated",
    "BatchFrozenSet",
    "setBatchFrozen",
    "setPaused",
    "claim",
    "Claimed"
  ]) {
    assert.equal(names.includes(name), true, `${name} missing from compiled ABI`);
  }
});

test("reward deploy plan defaults to dry-run and never requires a deployer key", () => {
  const plan = buildRewardMerkleDistributorDeployPlan({
    artifact: artifact(),
    env: validEnv
  });

  assert.equal(plan.mode, "dry-run");
  assert.equal(plan.readyToSend, false);
  assert.equal(plan.chainId, 31337);
  assert.deepEqual(plan.constructorArgs, [
    validEnv.REWARD_CLAIMS_TOKEN_ADDRESS.toLowerCase(),
    validEnv.REWARD_CLAIMS_ADMIN_ADDRESS.toLowerCase()
  ]);
  assert.match(plan.bytecodeHash, /^0x[0-9a-f]{64}$/);
  assert.equal(plan.rpcUrl, `${validEnv.REWARD_CLAIMS_RPC_URL}/`);
  assert.equal(plan.rpcUrlRedacted, "http://[redacted]");
});

test("reward deploy plan redacts RPC URL credentials from JSON output", () => {
  const secretRpcUrl = "https://user:pass@alchemy-project-key.example.invalid/v2/path-secret?api_key=query-secret#fragment-secret";
  const plan = buildRewardMerkleDistributorDeployPlan({
    artifact: artifact(),
    env: {
      ...validEnv,
      REWARD_CLAIMS_RPC_URL: secretRpcUrl
    }
  });
  const serialized = JSON.stringify({ plan });

  assert.equal(plan.rpcUrl, secretRpcUrl);
  assert.equal(plan.rpcUrlRedacted, "https://[redacted]");
  assert.equal(Object.prototype.propertyIsEnumerable.call(plan, "rpcUrl"), false);
  assert.equal(serialized.includes(secretRpcUrl), false);
  assert.equal(serialized.includes("user"), false);
  assert.equal(serialized.includes("pass"), false);
  assert.equal(serialized.includes("alchemy-project-key"), false);
  assert.equal(serialized.includes("path-secret"), false);
  assert.equal(serialized.includes("query-secret"), false);
  assert.equal(serialized.includes("fragment-secret"), false);
  assert.equal(serialized.includes("https://[redacted]"), true);
});

test("reward deploy plan accepts eip155 chain IDs", () => {
  const plan = buildRewardMerkleDistributorDeployPlan({
    artifact: artifact(),
    env: {
      ...validEnv,
      REWARD_CLAIMS_CHAIN_ID: "eip155:4801"
    }
  });
  assert.equal(plan.chainId, 4801);
});

test("reward deploy plan fails closed when deployment config is incomplete", () => {
  assert.throws(
    () =>
      buildRewardMerkleDistributorDeployPlan({
        artifact: artifact(),
        env: {
          ...validEnv,
          REWARD_CLAIMS_TOKEN_ADDRESS: undefined
        }
      }),
    /REWARD_CLAIMS_TOKEN_ADDRESS/
  );
  assert.throws(
    () =>
      buildRewardMerkleDistributorDeployPlan({
        artifact: artifact(),
        env: {
          ...validEnv,
          REWARD_CLAIMS_CHAIN_ID: "not-a-chain"
        }
      }),
    /REWARD_CLAIMS_CHAIN_ID/
  );
});

test("reward deploy plan requires explicit approval and deployer key for send mode", () => {
  assert.throws(
    () =>
      buildRewardMerkleDistributorDeployPlan({
        artifact: artifact(),
        env: {
          ...validEnv,
          REWARD_CONTRACT_DEPLOY_MODE: "send"
        }
      }),
    /REWARD_CONTRACT_DEPLOY_APPROVED/
  );

  const plan = buildRewardMerkleDistributorDeployPlan({
    artifact: artifact(),
    env: {
      ...validEnv,
      REWARD_CONTRACT_DEPLOY_MODE: "send",
      REWARD_CONTRACT_DEPLOY_APPROVED: "1",
      REWARD_CLAIMS_DEPLOYER_PRIVATE_KEY: `0x${"a".repeat(64)}`
    }
  });
  assert.equal(plan.readyToSend, true);
});
