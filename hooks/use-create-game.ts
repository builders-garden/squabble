import { useApiMutation } from "./use-api-mutation";

interface CreateGameVariables {
  betAmount: number;
}

interface CreateGameResponse {
  id: string;
  contractGameId: string;
  txHash: string;
}

interface UseCreateGameOptions {
  onSuccess?: (data: CreateGameResponse) => void;
}

export const useCreateGame = (options?: UseCreateGameOptions) => {
  const mutation = useApiMutation<CreateGameResponse, CreateGameVariables>({
    url: "/api/games",
    method: "POST",
    isProtected: true,
    onSuccess: (data) => {
      console.log("Game created successfully:", data);
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      console.error("Error creating game:", error);
    },
    body: (variables) => ({
      betAmount: variables.betAmount,
    }),
  });

  return {
    ...mutation,
    mutate: mutation.mutate,
  };
};
