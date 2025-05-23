import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

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
