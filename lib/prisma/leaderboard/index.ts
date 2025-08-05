import { GameStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

export async function getLeaderboard({
  status = GameStatus.FINISHED,
  conversationId,
}: {
  status?: GameStatus;
  conversationId?: string;
}) {
  const whereClause = {
    status,
    ...(conversationId ? { conversationId } : {}),
  };

  return await prisma.gameParticipant.groupBy({
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
}
