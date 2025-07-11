import { trackEvent } from "@/lib/posthog/server";
import { createGame, updateGame } from "@/lib/prisma/games";
import { uuidToBigInt } from "@/lib/utils";
import { createNewGame } from "@/lib/viem";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("Agent create-game endpoint called");

  const { betAmount, conversationId } = await req.json();

  console.log("Request data:", {
    betAmount,
    conversationId,
  });
  let adjBetAmount = betAmount;

  if (betAmount === "no bet") {
    adjBetAmount = 0;
  }

  if (typeof betAmount !== "string" || typeof conversationId !== "string") {
    console.log("Validation failed");
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  console.log("Creating game...");
  console.log("adjBetAmount", adjBetAmount);
  console.log("betAmount", parseFloat(adjBetAmount));
  console.log("conversationId", conversationId);
  const game = await createGame({
    betAmount: parseFloat(adjBetAmount),
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
  const txHash = await createNewGame(BigInt(contractGameIdNumber), stakeAmount);

  console.log("Smart contract call successful:", txHash);

  trackEvent(
    "game_created",
    {
      gameId: game.id,
      stakeAmount: stakeAmount,
      conversationId: conversationId,
    },
    "agent"
  );

  return NextResponse.json({
    id: game.id,
    contractGameId: contractGameIdNumber.toString(),
    txHash,
  });
}
