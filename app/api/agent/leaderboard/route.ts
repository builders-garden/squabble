import { GameStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { formatAvatarUrl } from "@/lib/utils";

interface LeaderboardEntry {
  fid: number;
  displayName: string;
  username: string;
  avatarUrl: string;
  points: number;
  wins: number;
  totalGames: number;
  totalWinnings: number;
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
      { status: 404 },
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
    winCounts.map((item) => [item.fid, item._count._all]),
  );

  // Calculate total winnings for each user
  const totalWinningsMap = new Map<number, number>();

  // Get all games where users were winners with their bet amounts and participant counts
  const winnerGames = await prisma.gameParticipant.findMany({
    where: {
      game: whereClause,
      winner: true,
    },
    include: {
      game: {
        select: {
          betAmount: true,
          participants: {
            where: {
              paid: true,
            },
            select: {
              fid: true,
            },
          },
        },
      },
    },
  });

  // Calculate total winnings for each winner
  winnerGames.forEach((participant) => {
    const fid = participant.fid;
    const paidParticipants = participant.game.participants.length;
    const totalPot = paidParticipants * participant.game.betAmount;

    const currentWinnings = totalWinningsMap.get(fid) || 0;
    totalWinningsMap.set(fid, currentWinnings + totalPot);
  });

  // Combine the data
  const userMap = new Map(users.map((user) => [user.fid, user]));
  const sortedLeaderboard: LeaderboardEntry[] = leaderboard
    .map((item) => ({
      fid: item.fid,
      displayName: userMap.get(item.fid)?.displayName || "",
      username: userMap.get(item.fid)?.username || "",
      avatarUrl: formatAvatarUrl(userMap.get(item.fid)?.avatarUrl || ""),
      points: item._sum.points || 0,
      wins: winCountMap.get(item.fid) || 0,
      totalGames: item._count._all,
      totalWinnings: totalWinningsMap.get(item.fid) || 0,
    }))
    .sort((a, b) => b.points - a.points);

  return NextResponse.json({
    leaderboard: sortedLeaderboard,
    totalFinishedGames,
  });
}
