import { NextRequest, NextResponse } from "next/server";
import { getGameById } from "@/lib/prisma/games";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const game = await getGameById(id);
    if (!game) {
      console.error("Game not found", id);
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Convert BigInt values to strings for JSON serialization
    const serializedGame = JSON.parse(
      JSON.stringify(game, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    return NextResponse.json(serializedGame);
  } catch (error) {
    console.error("Game fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 },
    );
  }
}
