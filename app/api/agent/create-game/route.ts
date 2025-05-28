import { checkAgentSecret } from "@/lib/auth/agentAuth";
import { createGame } from "@/lib/prisma/games";
import { createNewGame } from "@/lib/viem";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  if (!checkAgentSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fids, betAmount, creatorAddress, creatorFid, conversationId } = await req.json();

  if (
    !Array.isArray(fids) ||
    typeof betAmount !== "string" ||
    typeof creatorAddress !== "string" ||
    typeof creatorFid !== "string" ||
    typeof conversationId !== "string"
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const game = await createGame({
    betAmount: parseInt(betAmount),
    creatorFid: parseInt(creatorFid),
    creatorAddress,
    conversationId,
    participants: fids,
  });

  const gameId = game.id;
  const stakeAmount = game.betAmount;

  const txReceipt = await createNewGame(BigInt(gameId), creatorAddress as `0x${string}`, stakeAmount);


  return NextResponse.json({ id: game.id, txReceipt });
}
