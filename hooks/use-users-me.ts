import { useApiQuery } from "./use-api-query";

export const useAuthCheck = () => {
  return useApiQuery({
    url: "/api/users/me",
    method: "GET",
    isProtected: true,
    queryKey: ["users-s"],
  });
};
