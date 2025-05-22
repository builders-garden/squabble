import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { v4 as uuidv4 } from "uuid";
import { checkAgentSecret } from "@/lib/auth/agentAuth";

export async function POST(req: NextRequest) {
  if (!checkAgentSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { usernames, betAmount, creator, conversationId } = await req.json();

  if (
    !Array.isArray(usernames) ||
    typeof betAmount !== "string" ||
    typeof creator !== "string" ||
    typeof conversationId !== "string"
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const gameId = uuidv4();

  const game = await prisma.game.create({
    data: {
      id: gameId,
      status: "pending",
      betAmount: parseInt(betAmount),
      creator,
      conversationId,
      createdAt: new Date(),
      participants: {
        create: usernames.map((username: string) => ({
          username,
          joined: false,
        })),
      },
    },
    include: { participants: true },
  });

  return NextResponse.json({ id: game.id });
}
