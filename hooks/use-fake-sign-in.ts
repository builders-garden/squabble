import { useMiniApp } from "@/contexts/miniapp-context";
import { User } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useApiQuery } from "./use-api-query";
import { useAuthCheck } from "./use-auth-check";

export const useFakeSignIn = ({
  autoSignIn = false,
  onSuccess,
}: {
  autoSignIn?: boolean;
  onSuccess?: (user: User) => void;
}) => {
  const { context } = useMiniApp();
  const { data: authCheck, isLoading: isCheckingAuth } = useAuthCheck();
  const {
    data: user,
    isLoading: isLoadingNeynarUser,
    refetch: refetchUser,
  } = useApiQuery<User>({
    url: "/api/users/me",
    method: "GET",
    isProtected: true,
    queryKey: ["user"],
    enabled: !!authCheck,
  });

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();

  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!address) {
        console.error("No wallet connected");
        throw new Error("No wallet connected");
      }

      if (!context) {
        console.error("Not in mini app");
        throw new Error("Not in mini app");
      }

      // TODO: replace with /api/auth/sign-in when ready for PROD
      const res = await fetch("/api/auth/fake-sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fid: context.user.fid,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(errorData);
        throw new Error(errorData.message || "Sign in failed");
      }

      const data = await res.json();
      refetchUser();
      setIsSignedIn(true);
      onSuccess?.(data.user);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, refetchUser, address]);

  useEffect(() => {
    // if autoSignIn is true, sign in automatically on mount
    if (autoSignIn) {
      if (authCheck && !isCheckingAuth) {
        setIsSignedIn(true);
        if (!user) {
          refetchUser().then(() => {
            onSuccess?.(user!);
          });
        } else {
          onSuccess?.(user);
        }
      } else if (!authCheck && !isCheckingAuth && !isSignedIn) {
        console.log("Signing in");
        console.log(authCheck, isCheckingAuth, isSignedIn);
        handleSignIn();
      }
    }
  }, [
    autoSignIn,
    handleSignIn,
    authCheck,
    isCheckingAuth,
    refetchUser,
    onSuccess,
  ]);

  return { signIn: handleSignIn, isSignedIn, isLoading, error, user };
};
