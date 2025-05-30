import { MESSAGE_EXPIRATION_TIME } from "@/lib/constants";
import { useAuthenticate, useMiniKit } from "@coinbase/onchainkit/minikit";
import { User } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";
import { useApiQuery } from "./use-api-query";
import { useAuthCheck } from "./use-auth-check";

export const useSignIn = ({
  autoSignIn = false,
  onSuccess,
}: {
  autoSignIn?: boolean;
  onSuccess?: (user: User) => void;
}) => {
  const { context } = useMiniKit();
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

  // this method allows for Sign in with Farcaster (SIWF)
  const { signIn } = useAuthenticate();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!context) {
        throw new Error("No context found");
      }
      let referrerFid: number | null = null;
      const result = await signIn({
        nonce: Math.random().toString(36).substring(2),
        notBefore: new Date().toISOString(),
        expirationTime: new Date(
          Date.now() + MESSAGE_EXPIRATION_TIME
        ).toISOString(),
      });
      if (!result) {
        throw new Error("Sign in failed");
      }
      referrerFid =
        context.location?.type === "cast_embed"
          ? context.location.cast.fid
          : null;

      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          signature: result.signature,
          message: result.message,
          fid: context.user.fid,
          referrerFid,
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
  }, [context, onSuccess, refetchUser, signIn]);

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
      } else if (!authCheck && !isCheckingAuth) {
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
