import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function POST(req: NextRequest) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Missing game id" }, { status: 400 });
  }

  // Find the game
  const game = await prisma.game.findUnique({
    where: { id },
    include: { participants: true },
  });
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  if (game.status !== "pending") {
    return NextResponse.json({ error: "Game is not pending" }, { status: 400 });
  }

  // Count joined participants
  const joinedCount = game.participants.filter((p: any) => p.joined).length;
  if (joinedCount < 2) {
    return NextResponse.json(
      { error: "At least 2 participants must have joined to start the game" },
      { status: 400 }
    );
  }

  // Update game status to 'ready'
  await prisma.game.update({ where: { id }, data: { status: "ready" } });

  return NextResponse.json({ success: true });
}
