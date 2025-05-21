import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { checkAgentSecret } from "@/lib/auth/agentAuth";

export async function POST(req: NextRequest) {
  if (!checkAgentSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, username, paymentHash } = await req.json();

  if (!id || typeof username !== "string") {
    return NextResponse.json(
      { error: "Missing game id or username" },
      { status: 400 }
    );
  }

  // Find the game and check status
  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  if (game.status !== "pending") {
    return NextResponse.json({ error: "Game is not pending" }, { status: 400 });
  }

  // If betAmount > 0, paymentHash is required
  if (game.betAmount > 0 && !paymentHash) {
    return NextResponse.json(
      { error: "Payment hash required for this game" },
      { status: 400 }
    );
  }

  // Update participant
  const participant = await prisma.gameParticipant.updateMany({
    where: { gameId: id, username },
    data: {
      joined: true,
      paymentHash: paymentHash,
      paid: game.betAmount > 0 ? true : false,
    },
  });

  if (participant.count === 0) {
    return NextResponse.json(
      { error: "Participant not found in this game" },
      { status: 404 }
    );
  }

  if (game.betAmount > 0) {
    await prisma.game.update({
      where: { id },
      data: { totalFunds: { increment: game.betAmount } },
    });
  }

  return NextResponse.json({ success: true });
}
