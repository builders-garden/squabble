import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { checkAgentSecret } from "@/lib/auth/agentAuth";

export async function POST(req: NextRequest) {
  if (!checkAgentSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, username } = await req.json();

  if (!id || typeof username !== "string") {
    return NextResponse.json(
      { error: "Missing game id or username" },
      { status: 400 }
    );
  }

  // Find the game
  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  if (game.status !== "pending") {
    return NextResponse.json({ error: "Game is not pending" }, { status: 400 });
  }

  // Find the participant
  const participant = await prisma.gameParticipant.findFirst({
    where: { gameId: id, username, joined: true },
  });
  if (!participant) {
    return NextResponse.json(
      { error: "Participant not found or has not joined" },
      { status: 404 }
    );
  }

  // Before deleting the participant, check if they paid
  if (participant.paid && game.betAmount > 0) {
    await prisma.game.update({
      where: { id },
      data: { totalFunds: { decrement: game.betAmount } },
    });
  }

  // Remove the participant
  await prisma.gameParticipant.delete({ where: { id: participant.id } });

  return NextResponse.json({ success: true });
}
