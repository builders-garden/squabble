import { createGame, updateGame } from "@/lib/prisma/games";
import { createNewGame } from "@/lib/viem";
import { NextRequest, NextResponse } from "next/server";

// Function to convert UUID string to a safe integer
function uuidToBigInt(uuid: string): bigint {
  // Remove hyphens to get full hex string
  const hex = uuid.replace(/-/g, "");

  // Take only the first 8 hex characters (32 bits) to ensure safe range
  // This gives us ~4 billion possible values, which is still very unique
  const safeHex = hex.substring(0, 8);

  return BigInt("0x" + safeHex);
}

export async function POST(req: NextRequest) {
  const { fids, betAmount, creatorAddress, creatorFid, conversationId } =
    await req.json();

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

  // Convert UUID to integer for database (ensure it's a proper integer)
  const contractGameIdBigInt = uuidToBigInt(gameId);
  const contractGameIdNumber = Math.floor(Number(contractGameIdBigInt));

  // Update the game with the contractGameId as a proper integer
  await updateGame(gameId, {
    contractGameId: contractGameIdNumber,
  });

  const txHash = await createNewGame(
    BigInt(contractGameIdNumber),
    creatorAddress as `0x${string}`,
    stakeAmount
  );

  return NextResponse.json({
    id: game.id,
    contractGameId: contractGameIdNumber.toString(),
    txHash,
  });
}
