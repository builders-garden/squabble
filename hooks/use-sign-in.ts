import { useMiniApp } from "@/contexts/miniapp-context";
import { FARCASTER_CLIENT_FID, MESSAGE_EXPIRATION_TIME } from "@/lib/constants";
import sdk from "@farcaster/frame-sdk";
import { User } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useApiQuery } from "./use-api-query";

export const useSignIn = ({
  autoSignIn = false,
  onSuccess,
}: {
  autoSignIn?: boolean;
  onSuccess?: (user: User) => void;
}) => {
  const { context } = useMiniApp();
  // const { data: authCheck, isLoading: isCheckingAuth } = useAuthCheck();const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const {
    data: user,
    isLoading: isLoadingNeynarUser,
    refetch: refetchUser,
  } = useApiQuery<User>({
    url: "/api/users/me",
    method: "GET",
    isProtected: true,
    queryKey: ["user"],
    enabled: !!isSignedIn,
  });

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
      const nonce = Math.random().toString(36).substring(2);

      const result = await sdk.actions.signIn({
        nonce,
        notBefore: new Date().toISOString(),
        expirationTime: new Date(
          Date.now() + MESSAGE_EXPIRATION_TIME
        ).toISOString(),
        acceptAuthAddress: context.client.clientFid === FARCASTER_CLIENT_FID,
      });
      if (!result) {
        console.error("Sign in failed, no result");
        throw new Error("Sign in failed, no result");
      }

      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature: result.signature,
          message: result.message,
          fid: context.user.fid,
          nonce,
          // referrerFid,
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
      if (!isSignedIn) {
        handleSignIn();
      }
      // if (authCheck && !isCheckingAuth) {
      //   setIsSignedIn(true);
      //   if (!user) {
      //     refetchUser().then(() => {
      //       onSuccess?.(user!);
      //     });
      //   } else {
      //     onSuccess?.(user);
      //   }
      // } else if (!authCheck && !isCheckingAuth && !isSignedIn) {
      //   console.log("Signing in");
      //   console.log(authCheck, isCheckingAuth, isSignedIn);
      //   handleSignIn();
      // }
    }
  }, [autoSignIn, handleSignIn, isSignedIn, address]);

  return { signIn: handleSignIn, isSignedIn, isLoading, error, user };
};
