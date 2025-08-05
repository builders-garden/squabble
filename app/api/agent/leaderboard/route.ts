import { NextRequest, NextResponse } from "next/server";
import { getTotalWinnings, getWinCounts } from "@/lib/prisma/game-participants";
import { countGames } from "@/lib/prisma/games";
import { getLeaderboard } from "@/lib/prisma/leaderboard";
import { getUsersByIds } from "@/lib/prisma/user";
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

  // Get total finished games count
  const totalFinishedGames = await countGames({
    conversationId: conversationId || undefined,
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
  const leaderboard = await getLeaderboard({
    conversationId: conversationId || undefined,
  });

  // Get user details for all participants
  const userIds = leaderboard.map((item) => item.fid);
  const users = await getUsersByIds(userIds);

  // Get win counts separately
  const winCounts = await getWinCounts({
    conversationId: conversationId || undefined,
  });

  const winCountMap = new Map(
    winCounts.map((item) => [item.fid, item._count._all]),
  );

  // Calculate total winnings for each user
  const totalWinningsMap = new Map<number, number>();

  // Get all games where users were winners with their bet amounts and participant counts
  const winnerGames = await getTotalWinnings({
    conversationId: conversationId || undefined,
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
