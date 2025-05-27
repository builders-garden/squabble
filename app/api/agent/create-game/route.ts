import { checkAgentSecret } from "@/lib/auth/agentAuth";
import { createGame } from "@/lib/prisma/games";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  if (!checkAgentSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fids, betAmount, creator, conversationId } = await req.json();

  if (
    !Array.isArray(fids) ||
    typeof betAmount !== "string" ||
    typeof creator !== "string" ||
    typeof conversationId !== "string"
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const game = await createGame({
    betAmount: parseInt(betAmount),
    creatorFid: parseInt(creator),
    conversationId,
    participants: fids,
  });

  return NextResponse.json({ id: game.id });
}
