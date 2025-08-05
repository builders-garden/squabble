import { Abi, encodeFunctionData } from "viem";
import { SQUABBLE_CONTRACT_ABI } from "@/lib/constants";

export function joinGameCalldata(gameId: string, playerAddress: string) {
  console.log(gameId, playerAddress, "gameId, playerAddress");
  return encodeFunctionData({
    abi: SQUABBLE_CONTRACT_ABI as Abi,
    functionName: "joinGame",
    args: [gameId, playerAddress as `0x${string}`],
  });
}
