import { prisma } from "@/lib/prisma/client";
import { GameStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

interface LeaderboardEntry {
  fid: number;
  displayName: string;
  username: string;
  avatarUrl: string;
  points: number;
  wins: number;
  totalGames: number;
}

interface LeaderboardResult {
  fid: number;
  _sum: {
    points: number | null;
  };
  _count: {
    _all: number;
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");


  const whereClause = {
    status: GameStatus.FINISHED,
    ...(conversationId ? { conversationId } : {}),
  };

  // Get total finished games count
  const totalFinishedGames = await prisma.game.count({
    where: whereClause,
  });

  if (totalFinishedGames === 0) {
    return NextResponse.json(
      {
        error: conversationId
          ? "No finished games found for this conversation"
          : "No finished games found",
      },
      { status: 404 }
    );
  }

  // Get leaderboard data directly from the database
  const leaderboard = await prisma.gameParticipant.groupBy({
    by: ["fid"],
    where: {
      game: whereClause,
    },
    _sum: {
      points: true,
    },
    _count: {
      _all: true,
    },
  });

  // Get user details for all participants
  const userIds = leaderboard.map((item) => item.fid);
  const users = await prisma.user.findMany({
    where: {
      fid: {
        in: userIds,
      },
    },
    select: {
      fid: true,
      displayName: true,
      username: true,
      avatarUrl: true,
    },
  });

  // Get win counts separately
  const winCounts = await prisma.gameParticipant.groupBy({
    by: ["fid"],
    where: {
      game: whereClause,
      winner: true,
    },
    _count: {
      _all: true,
    },
  });

  const winCountMap = new Map(
    winCounts.map((item) => [item.fid, item._count._all])
  );

  // Combine the data
  const userMap = new Map(users.map((user) => [user.fid, user]));
  const sortedLeaderboard: LeaderboardEntry[] = leaderboard
    .map((item) => ({
      fid: item.fid,
      displayName: userMap.get(item.fid)?.displayName || "",
      username: userMap.get(item.fid)?.username || "",
      avatarUrl: userMap.get(item.fid)?.avatarUrl || "",
      points: item._sum.points || 0,
      wins: winCountMap.get(item.fid) || 0,
      totalGames: item._count._all,
    }))
    .sort((a, b) => b.points - a.points);

  return NextResponse.json({
    leaderboard: sortedLeaderboard,
    totalFinishedGames,
  });
}
