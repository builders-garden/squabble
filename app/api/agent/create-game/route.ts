import { createGame, updateGame } from "@/lib/prisma/games";
import { createNewGame } from "@/lib/viem";
import { NextRequest, NextResponse } from "next/server";

// Function to convert UUID string to a safe integer
function uuidToBigInt(uuid: string): bigint {
  // Remove hyphens to get full hex string
  const hex = uuid.replace(/-/g, "");

  // Take only the first 6 hex characters (24 bits) to ensure safe range
  // This gives us ~16 million possible values, which is still very unique
  // and fits comfortably within 32-bit signed integer range (max: 2,147,483,647)
  const safeHex = hex.substring(0, 6);

  return BigInt("0x" + safeHex);
}

export async function POST(req: NextRequest) {
  try {
    console.log("Agent create-game endpoint called");

    const { betAmount, conversationId } = await req.json();

    console.log("Request data:", {
      betAmount,
      conversationId,
    });

    if (typeof betAmount !== "string" || typeof conversationId !== "string") {
      console.log("Validation failed");
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    console.log("Creating game...");
    const game = await createGame({
      betAmount: parseInt(betAmount),
      conversationId,
    });

    console.log("Game created successfully:", game.id);

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
