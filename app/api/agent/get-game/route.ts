import { NextRequest, NextResponse } from "next/server";
import { getGameById, getLatestGame } from "@/lib/prisma/games";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  let game;
  if (id) {
    game = await getGameById(id);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
  } else {
    game = await getLatestGame();
    if (!game) {
      return NextResponse.json({ error: "No games found" }, { status: 404 });
    }
  }

  return NextResponse.json(game);
}
