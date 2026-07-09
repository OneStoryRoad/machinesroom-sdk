import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  GATE_ONE_PREFLIGHT_CONTRACTS,
  GATE_ONE_SPECIALIST_TYPES,
  GATE_ONE_UNIVERSAL_LANES,
  GATE_ONE_VERDICTS,
  GateOnePolicySchema,
  parseGateOnePolicy
} from "../src/index.js";

const policyPath = fileURLToPath(new URL("../src/governance/gate-one/policy.v2.json", import.meta.url));

function loadPolicy(): unknown {
  return JSON.parse(readFileSync(policyPath, "utf8"));
}

function clonePolicy(): Record<string, unknown> {
  return structuredClone(parseGateOnePolicy(loadPolicy())) as unknown as Record<string, unknown>;
}

test("@machinesroom/contracts validates the Gate One V2 policy SSOT", () => {
  const policy = parseGateOnePolicy(loadPolicy());

  assert.equal(policy.policyId, "gate-one-v2-mvp");
  assert.equal(policy.version, "2.2.0");
  assert.deepEqual(
    policy.universalLanes.map((lane) => lane.id),
    GATE_ONE_UNIVERSAL_LANES
  );
  assert.deepEqual(
    policy.preflights.map((preflight) => preflight.id),
    GATE_ONE_PREFLIGHT_CONTRACTS
  );
  assert.deepEqual(
    policy.specialists.map((specialist) => specialist.id),
    GATE_ONE_SPECIALIST_TYPES
  );
  assert.deepEqual(
    policy.verdicts.map((verdict) => verdict.id),
    GATE_ONE_VERDICTS
  );
  assert.equal(policy.shadowLanes[0]?.id, "EDITORIAL_INTEGRITY");
  assert.equal(policy.shadowLanes[0]?.state, "SHADOW");
  assert.equal(policy.riskSemantics.negativeRiskVerdictsStopPublication, true);
  assert.equal(policy.riskSemantics.hardVetoVerdict, "BLOCK");
});

test("@machinesroom/contracts rejects Gate One V2 policies missing a universal lane", () => {
  const policy = clonePolicy();
  policy.universalLanes = (policy.universalLanes as unknown[]).filter((lane) => {
    return (lane as { id?: string }).id !== "FAIRNESS_REPLY";
  });

  assert.throws(() => GateOnePolicySchema.parse(policy), /FAIRNESS_REPLY/);
});

test("@machinesroom/contracts rejects impossible Fact Check quorum", () => {
  const policy = clonePolicy();
  (policy.profiles as Record<string, Record<string, unknown>>).STANDARD!.factCheckSigners = 1;

  assert.throws(() => GateOnePolicySchema.parse(policy), /at least two Fact Check signers/);
});

test("@machinesroom/contracts rejects promoted Editorial Integrity in the MVP policy", () => {
  const policy = clonePolicy();
  ((policy.shadowLanes as Array<Record<string, unknown>>)[0]!).state = "ENFORCE";

  assert.throws(() => GateOnePolicySchema.parse(policy), /EDITORIAL_INTEGRITY must remain SHADOW/);
});

test("@machinesroom/contracts rejects PASS_WITH_DISCLOSURE without render receipts", () => {
  const policy = clonePolicy();
  const verdict = (policy.verdicts as Array<Record<string, unknown>>).find((item) => item.id === "PASS_WITH_DISCLOSURE");
  assert.ok(verdict);
  verdict.requiresDisclosureReceipt = false;

  assert.throws(() => GateOnePolicySchema.parse(policy), /rendered disclosure receipt/);
});
