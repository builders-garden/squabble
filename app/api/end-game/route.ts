import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { checkAgentSecret } from "@/lib/auth/agentAuth";
import { GameStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  if (!checkAgentSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, winner } = await req.json();

  if (!id || typeof winner !== "string") {
    return NextResponse.json(
      { error: "Missing game id or winner fid" },
      { status: 400 }
    );
  }

  // Find the game
  const game = await prisma.game.findUnique({
    where: { id },
    include: { participants: true },
  });
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  if (game.status !== GameStatus.READY) {
    return NextResponse.json(
      { error: "Game is not ready to end" },
      { status: 400 }
    );
  }

  // Check winner is a participant
  const isParticipant = game.participants.some(
    (p: any) => p.username === winner
  );
  if (!isParticipant) {
    return NextResponse.json(
      { error: "Winner is not a participant in this game" },
      { status: 400 }
    );
  }

  // Update game status to 'close' and set winner
  await prisma.$transaction([
    prisma.game.update({ where: { id }, data: { status: GameStatus.FINISHED } }),
    prisma.gameParticipant.updateMany({
      where: { gameId: id },
      data: { winner: false },
    }),
    prisma.gameParticipant.updateMany({
      where: { gameId: id, fid: parseInt(winner) },
      data: { winner: true },
    }),
  ]);

  //TODO: add escrow payment logic from the Agent here

  return NextResponse.json({ success: true });
}
