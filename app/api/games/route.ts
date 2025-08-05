import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/lib/posthog/server";
import { createGame, getLatestGame, updateGame } from "@/lib/prisma/games";
import { getUserByFid } from "@/lib/prisma/user";
import { uuidToBigInt } from "@/lib/utils";
import { createNewGame } from "@/lib/viem";

export async function GET() {
  try {
    const game = await getLatestGame();
    if (!game) {
      console.error("No latest game found");
      return NextResponse.json({ error: "No games found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch latest game" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const { betAmount } = await req.json();
  const fid = req.headers.get("x-user-fid")!;

  if (!fid)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const user = await getUserByFid(Number(fid));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const game = await createGame({
    betAmount: parseFloat(betAmount),
  });
  console.log("Game created:", game);

  const gameId = game.id;
  const stakeAmount = game.betAmount;

  // Convert UUID to integer for database (ensure it's a proper integer)
  const contractGameIdBigInt = uuidToBigInt(gameId);
  const contractGameIdNumber = Math.floor(Number(contractGameIdBigInt));

  console.log("Updating game with contractGameId:", contractGameIdNumber);
  // Update the game with the contractGameId as a proper integer
  await updateGame(gameId, {
    contractGameId: contractGameIdNumber,
  });

  console.log("Calling smart contract...");
  const txHash = await createNewGame(BigInt(contractGameIdNumber), stakeAmount);

  console.log("Smart contract call successful:", txHash);

  trackEvent(
    "game_created",
    {
      gameId: game.id,
      stakeAmount: stakeAmount,
    },
    fid,
  );

  return NextResponse.json({
    id: game.id,
    stakeAmount: stakeAmount.toString(),
    contractGameId: contractGameIdNumber.toString(),
    txHash,
  });
}
