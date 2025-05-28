import { Game } from "@prisma/client";
import { useApiQuery } from "./use-api-query";

export default function useFetchGame(id: string) {
  return useApiQuery<Game>({
    url: `/api/games/${id}`,
    enabled: !!id,
    queryKey: ["game", id],
    isProtected: true,
  });
}
