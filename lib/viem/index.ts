import {
  createWalletClient,
  createPublicClient,
  http,
  type Address,
  Abi,
  SendTransactionParameters,
  parseEther,
  parseUnits,
} from "viem";
import { base, baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { SQUABBLE_CONTRACT_ABI, SQUABBLE_CONTRACT_ADDRESS } from "../constants";
import { env } from "../env";

export async function createNewGame(
  gameId: bigint,
  stakeAmount: number
) {
  const privateKey = env.BACKEND_PRIVATE_KEY as `0x${string}`;

  if (!privateKey) {
    throw new Error("BACKEND_PRIVATE_KEY environment variable is not set");
  }

  const account = privateKeyToAccount(privateKey);

  if (!account) {
    throw new Error("No account found");
  }

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  const walletClient = createWalletClient({
    chain: base,
    transport: http(),
    account: account,
  });

  const stakeAmountBigInt = parseUnits(stakeAmount.toString(), 6); //USDC decimals

  const nonce = await publicClient.getTransactionCount({
    address: account.address,
  });

  const tx = await walletClient.writeContract({
    address: SQUABBLE_CONTRACT_ADDRESS,
    abi: SQUABBLE_CONTRACT_ABI as Abi,
    functionName: "createGame",
    args: [gameId, stakeAmountBigInt],
    nonce: nonce,
  });

  const txReceipt = await publicClient.waitForTransactionReceipt({
    hash: tx,
  });

  if (txReceipt.status === "success") {
    return txReceipt.transactionHash;
  } else {
    throw new Error("Transaction failed");
  }
}
