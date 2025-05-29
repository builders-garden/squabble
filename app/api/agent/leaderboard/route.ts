import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  let games;
  if (conversationId) {
    games = await prisma.game.findMany({
      where: {
        conversationId: conversationId,
        status: "FINISHED",
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    if (games.length === 0) {
      return NextResponse.json(
        { error: "No finished games found for this conversation" },
        { status: 404 }
      );
    }
  } else {
    games = await prisma.game.findMany({
      where: {
        status: "FINISHED",
      },
      orderBy: { createdAt: "desc" },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });
    if (games.length === 0) {
      return NextResponse.json(
        { error: "No finished games found" },
        { status: 404 }
      );
    }
  }

  // Create leaderboard
  const leaderboard = new Map<
    number,
    {
      fid: number;
      displayName: string;
      username: string;
      avatarUrl: string;
      points: number;
      wins: number;
      totalGames: number;
    }
  >();

  // Process all participants from finished games
  games.forEach((game) => {
    game.participants.forEach((participant) => {
      const existing = leaderboard.get(participant.fid);
      const points = participant.winner ? 10 : 0;

      if (existing) {
        existing.points += points;
        existing.wins += participant.winner ? 1 : 0;
        existing.totalGames += 1;
      } else {
        leaderboard.set(participant.fid, {
          fid: participant.fid,
          displayName: participant.user.displayName,
          username: participant.user.username,
          avatarUrl: participant.user.avatarUrl,
          points: points,
          wins: participant.winner ? 1 : 0,
          totalGames: 1,
        });
      }
    });
  });

  // Convert to array and sort by points (descending)
  const sortedLeaderboard = Array.from(leaderboard.values()).sort(
    (a, b) => b.points - a.points
  );

  return NextResponse.json({
    leaderboard: sortedLeaderboard,
    totalFinishedGames: games.length,
  });
}
