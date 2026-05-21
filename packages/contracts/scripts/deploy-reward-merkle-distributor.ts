import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildRewardMerkleDistributorDeployPlan,
  RewardMerkleDistributorArtifactSchema
} from "../src/index.js";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(SCRIPT_DIR, "..");
const ARTIFACT_PATH = join(PACKAGE_ROOT, "artifacts", "RewardMerkleDistributor.json");

function parseArgs(argv: string[]) {
  return {
    send: argv.includes("--send"),
    json: argv.includes("--json")
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const artifact = RewardMerkleDistributorArtifactSchema.parse(JSON.parse(readFileSync(ARTIFACT_PATH, "utf8")));
  const env = {
    ...process.env,
    REWARD_CONTRACT_DEPLOY_MODE: args.send ? "send" : "dry-run"
  };
  const plan = buildRewardMerkleDistributorDeployPlan({ artifact, env });

  if (plan.mode === "dry-run") {
    const payload = {
      ok: true,
      dryRun: true,
      plan
    };
    process.stdout.write(args.json ? `${JSON.stringify(payload, null, 2)}\n` : `${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  const deployerPrivateKey = process.env.REWARD_CLAIMS_DEPLOYER_PRIVATE_KEY as `0x${string}`;
  const [{ createPublicClient, createWalletClient, defineChain, http }, { privateKeyToAccount }] = await Promise.all([
    import("viem"),
    import("viem/accounts")
  ]);
  const chain = defineChain({
    id: plan.chainId,
    name: `reward-claims-${plan.chainId}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: {
        http: [plan.rpcUrl]
      }
    }
  });
  const account = privateKeyToAccount(deployerPrivateKey);
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(plan.rpcUrl)
  });
  const publicClient = createPublicClient({
    chain,
    transport: http(plan.rpcUrl)
  });
  const transactionHash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`,
    args: [...plan.constructorArgs]
  });
  const confirmations = Number(process.env.REWARD_CLAIMS_DEPLOY_CONFIRMATIONS ?? "1");
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: transactionHash,
    confirmations: Number.isSafeInteger(confirmations) && confirmations > 0 ? confirmations : 1
  });
  if (receipt.status !== "success" || !receipt.contractAddress) {
    throw new Error(`RewardMerkleDistributor deployment failed: ${transactionHash}`);
  }
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        dryRun: false,
        chainId: plan.chainId,
        contractName: plan.contractName,
        contractAddress: receipt.contractAddress,
        transactionHash,
        blockNumber: receipt.blockNumber.toString()
      },
      null,
      2
    )}\n`
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
