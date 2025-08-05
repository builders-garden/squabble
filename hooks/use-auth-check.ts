import { User } from "@prisma/client";
import { useEffect, useState } from "react";
import { useApiQuery } from "./use-api-query";

export const useAuthCheck = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const {
    data: user,
    error,
    isPending,
  } = useApiQuery<User>({
    url: "/api/auth/check",
    method: "GET",
    queryKey: ["auth-check"],
    isProtected: true,
  });

  useEffect(() => {
    if (!isPending && !error && user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [isPending, error, user]);

  return { user, isAuthenticated, isPending };
};
