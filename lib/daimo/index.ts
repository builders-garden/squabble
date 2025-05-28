import {
    Abi,
  encodeFunctionData,
} from "viem";
import { SQUABBLE_CONTRACT_ABI } from "../constants";

export function joinGameCalldata(gameId: string, playerAddress: string) {
    return encodeFunctionData({
        abi: SQUABBLE_CONTRACT_ABI as Abi,
        functionName: "joinGame",
        args: [gameId, playerAddress as `0x${string}`],
    });
}


