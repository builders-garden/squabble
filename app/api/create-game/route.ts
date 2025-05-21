import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { v4 as uuidv4 } from "uuid";
import { checkAgentSecret } from "@/lib/auth/agentAuth";

export async function POST(req: NextRequest) {
  if (!checkAgentSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { usernames, betAmount, creator } = await req.json();

  if (
    !Array.isArray(usernames) ||
    typeof betAmount !== "number" ||
    typeof creator !== "string"
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const gameId = uuidv4();

  const game = await prisma.game.create({
    data: {
      id: gameId,
      status: "pending",
      betAmount,
      creator,
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
