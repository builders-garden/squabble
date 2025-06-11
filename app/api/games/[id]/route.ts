import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const game = await prisma.game.findUnique({
      where: { id },
      include: { participants: {
        include: {
          user: true,
        },
        orderBy: {
          points: "desc",
        },
      } },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Convert BigInt values to strings for JSON serialization
    const serializedGame = JSON.parse(
      JSON.stringify(game, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    return NextResponse.json(serializedGame);
  } catch (error) {
    console.error("Game fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 }
    );
  }
}
