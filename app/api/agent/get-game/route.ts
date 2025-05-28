import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  let game;
  if (id) {
    game = await prisma.game.findUnique({
      where: { id },
      include: { participants: true },
    });
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
  } else {
    game = await prisma.game.findFirst({
      orderBy: { createdAt: "desc" },
      include: { participants: true },
    });
    if (!game) {
      return NextResponse.json({ error: "No games found" }, { status: 404 });
    }
  }

  return NextResponse.json(game);
}
