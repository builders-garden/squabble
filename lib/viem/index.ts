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

export async function createNewGame(gameId: bigint, creator: Address, stakeAmount: number) {
    const account = privateKeyToAccount(env.BACKEND_PRIVATE_KEY as `0x${string}`);
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

    const { request } = await publicClient.simulateContract({
        address: SQUABBLE_CONTRACT_ADDRESS,
        abi: SQUABBLE_CONTRACT_ABI as Abi,
        functionName: "createGame",
        args: [gameId, creator, stakeAmountBigInt],
    });
    console.log("request", request);

    const tx = await walletClient.sendTransaction(request as SendTransactionParameters);
    console.log("tx", tx);

    const txReceipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
    });
    console.log("txReceipt", txReceipt);

    if (txReceipt.status === "success") {
        return txReceipt;
    } else {
        throw new Error("Transaction failed");
    }
}
    

    

    

    
