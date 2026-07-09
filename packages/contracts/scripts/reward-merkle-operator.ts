import { readFileSync } from "node:fs";
import {
  buildRewardMerkleOperatorPlan,
  REWARD_MERKLE_DISTRIBUTOR_ABI,
  RewardMerkleOperatorActionSchema,
  type RewardMerkleOperatorManifest
} from "../src/index.js";

function readArg(argv: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = argv.find((item) => item.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
}

function parseTimestamp(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const value = raw.trim();
  if (/^[0-9]+$/.test(value)) return Number(value);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid timestamp: ${raw}`);
  }
  return Math.floor(parsed / 1000);
}

function parseManifest(path: string | undefined): RewardMerkleOperatorManifest | null {
  if (!path?.trim()) return null;
  const payload = JSON.parse(readFileSync(path.trim(), "utf8")) as RewardMerkleOperatorManifest;
  return payload;
}

async function main() {
  const argv = process.argv.slice(2);
  const action = RewardMerkleOperatorActionSchema.parse(readArg(argv, "action"));
  const send = argv.includes("--send");
  const plan = buildRewardMerkleOperatorPlan({
    action,
    contractAddress: readArg(argv, "contract-address") ?? process.env.REWARD_CLAIMS_CONTRACT_ADDRESS ?? "",
    manifest: parseManifest(readArg(argv, "manifest")),
    batchId: readArg(argv, "batch-id"),
    merkleRoot: readArg(argv, "merkle-root"),
    totalAmountAtomic: readArg(argv, "total-amount-atomic"),
    activateAt: parseTimestamp(readArg(argv, "activate-at")),
    expiresAt: parseTimestamp(readArg(argv, "expires-at")),
    metadataURI: readArg(argv, "metadata-uri") ?? process.env.REWARD_CLAIMS_METADATA_URI ?? process.env.REWARD_CLAIMS_METADATA_BASE_URI
  });

  if (!send) {
    process.stdout.write(`${JSON.stringify({ ok: true, dryRun: true, plan }, null, 2)}\n`);
    return;
  }

  const privateKey = process.env.REWARD_CLAIMS_ADMIN_PRIVATE_KEY;
  if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("REWARD_CLAIMS_ADMIN_PRIVATE_KEY is required for --send");
  }
  const rpcUrl = process.env.REWARD_CLAIMS_RPC_URL;
  if (!rpcUrl) {
    throw new Error("REWARD_CLAIMS_RPC_URL is required for --send");
  }
  const chainIdRaw = process.env.REWARD_CLAIMS_CHAIN_ID?.trim();
  const chainId = Number(chainIdRaw?.startsWith("eip155:") ? chainIdRaw.slice("eip155:".length) : chainIdRaw);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw new Error("REWARD_CLAIMS_CHAIN_ID must be a positive integer or eip155:<id> for --send");
  }

  const [{ createPublicClient, createWalletClient, defineChain, http }, { privateKeyToAccount }] = await Promise.all([
    import("viem"),
    import("viem/accounts")
  ]);
  const chain = defineChain({
    id: chainId,
    name: `reward-claims-${chainId}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } }
  });
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const transactionHash = await walletClient.writeContract({
    address: plan.contractAddress as `0x${string}`,
    abi: REWARD_MERKLE_DISTRIBUTOR_ABI,
    functionName: plan.functionName,
    args: plan.args as never
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: transactionHash, confirmations: 1 });
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: receipt.status === "success",
        dryRun: false,
        action,
        transactionHash,
        blockNumber: receipt.blockNumber.toString(),
        status: receipt.status
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
