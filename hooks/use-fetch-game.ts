import type { Game, GameParticipant, User } from "@prisma/client";
import { useApiQuery } from "./use-api-query";

export type GameWithParticipants = Game & {
  participants: (GameParticipant & { user: User })[];
};

export default function useFetchGame(id: string) {
  return useApiQuery<GameWithParticipants>({
    url: `/api/games/${id}`,
    enabled: !!id,
    queryKey: ["game", id],
    isProtected: true,
  });
}
