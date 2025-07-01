import { prisma } from "@/lib/prisma/client";
import { createGame, updateGame } from "@/lib/prisma/games";
import { uuidToBigInt } from "@/lib/utils";
import { createNewGame } from "@/lib/viem";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const game = await prisma.game.findFirst({
      orderBy: { createdAt: "desc" },
      include: { participants: true },
    });

    if (!game) {
      return NextResponse.json({ error: "No games found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch latest game" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { betAmount } = await req.json();

    const game = await createGame({
      betAmount: parseFloat(betAmount),
    });

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
    const txHash = await createNewGame(
      BigInt(contractGameIdNumber),
      stakeAmount
    );

    console.log("Smart contract call successful:", txHash);

    return NextResponse.json({
      id: game.id,
      contractGameId: contractGameIdNumber.toString(),
      txHash,
    });
  } catch (error) {
    console.error("Error in create-game:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
