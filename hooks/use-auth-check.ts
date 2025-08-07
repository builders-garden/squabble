import { User } from "@prisma/client";
import { useApiQuery } from "./use-api-query";

export const useAuthCheck = () => {
  const { data, isPending } = useApiQuery<{
    status: "ok" | "nok";
    user?: User;
    error?: string;
  }>({
    url: "/api/auth/check",
    method: "GET",
    queryKey: ["auth-check"],
    isProtected: true,
  });

  return {
    user: data?.user,
    isAuthenticated: data?.status === "ok",
    isPending,
  };
};
