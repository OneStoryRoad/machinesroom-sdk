import crypto from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const CONTRACT_NAME = "RewardMerkleDistributor";
const SOURCE_NAME = "contracts/RewardMerkleDistributor.sol";
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(SCRIPT_DIR, "..");
const SOURCE_PATH = join(PACKAGE_ROOT, SOURCE_NAME);
const ARTIFACT_DIR = join(PACKAGE_ROOT, "artifacts");
const ARTIFACT_PATH = join(ARTIFACT_DIR, `${CONTRACT_NAME}.json`);

function hashHex(input) {
  return `0x${crypto.createHash("sha256").update(input).digest("hex")}`;
}

const source = readFileSync(SOURCE_PATH, "utf8");
const compilerInput = {
  language: "Solidity",
  sources: {
    [SOURCE_NAME]: {
      content: source
    }
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"]
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(compilerInput)));
const errors = Array.isArray(output.errors) ? output.errors : [];
for (const entry of errors) {
  const formatted = entry.formattedMessage ?? entry.message ?? JSON.stringify(entry);
  if (entry.severity === "error") {
    throw new Error(formatted);
  }
  process.stderr.write(`${formatted}\n`);
}

const contract = output.contracts?.[SOURCE_NAME]?.[CONTRACT_NAME];
if (!contract?.abi || !contract.evm?.bytecode?.object || !contract.evm?.deployedBytecode?.object) {
  throw new Error(`Compiler output did not include ${CONTRACT_NAME} ABI and bytecode`);
}

const artifact = {
  contractName: CONTRACT_NAME,
  sourceName: SOURCE_NAME,
  compilerVersion: solc.version(),
  sourceHash: hashHex(source),
  optimizer: {
    enabled: true,
    runs: 200
  },
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
  deployedBytecode: `0x${contract.evm.deployedBytecode.object}`
};

mkdirSync(ARTIFACT_DIR, { recursive: true });
writeFileSync(ARTIFACT_PATH, `${JSON.stringify(artifact, null, 2)}\n`);
process.stdout.write(`Wrote ${ARTIFACT_PATH}\n`);
