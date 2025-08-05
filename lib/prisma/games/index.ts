import { Game, GameStatus } from "@prisma/client";
import { GameWithParticipants } from "@/hooks/use-fetch-game";
import { prisma } from "@/lib/prisma/client";

// Create a new game
export async function createGame(data: {
  betAmount: number;
  conversationId?: string;
  contractGameId?: number;
}): Promise<Game> {
  return prisma.game.create({
    data: {
      betAmount: data.betAmount,
      status: GameStatus.PENDING,
      conversationId: data.conversationId ?? null,
      contractGameId: data.contractGameId ?? null,
    },
  });
}

// Get a game by ID
export async function getGameById(
  id: string,
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
  data: Partial<Game>,
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
