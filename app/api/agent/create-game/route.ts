import { createGame } from "@/lib/prisma/games";
import { createNewGame } from "@/lib/viem";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {

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
