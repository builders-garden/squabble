import { GameWithParticipants } from "@/hooks/use-fetch-game";
import { Game, GameStatus } from "@prisma/client";
import { prisma } from "../client";

// Create a new game
export async function createGame(data: {
  betAmount: number;
  conversationId?: string;
  contractGameId?: number;
}): Promise<Game> {
  // Build the game data object explicitly to avoid undefined values

  console.log("betAmount", data.betAmount);
  const gameData: any = {
    betAmount: data.betAmount,
    status: GameStatus.PENDING,
  };

  // Only add optional fields if they have values
  if (data.conversationId !== undefined) {
    gameData.conversationId = data.conversationId;
  }

  if (data.contractGameId !== undefined) {
    gameData.contractGameId = data.contractGameId;
  }

  return prisma.game.create({
    data: {
      ...gameData,
    },
  });
}

// Get a game by ID
export async function getGameById(
  id: string
): Promise<GameWithParticipants | null> {
  return prisma.game.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          user: true,
        },
      },
    },
  });
}

// Get all games with optional filters
export async function getGames(filters?: {
  status?: GameStatus;
}): Promise<Game[]> {
  return prisma.game.findMany({
    where: filters,
    include: {
      participants: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// Update a game
export async function updateGame(
  id: string,
  data: {
    status?: GameStatus;
    betAmount?: number;
    totalFunds?: number;
    conversationId?: string;
    contractGameId?: number;
  }
): Promise<Game> {
  return prisma.game.update({
    where: { id },
    data,
  });
}

// Delete a game
export async function deleteGame(id: string): Promise<Game> {
  return prisma.game.delete({
    where: { id },
  });
}

// Get games by status
export async function getGamesByStatus(status: GameStatus): Promise<Game[]> {
  return prisma.game.findMany({
    where: { status },
    include: {
      participants: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
