import { MESSAGE_EXPIRATION_TIME } from "@/lib/constants";
import { useAuthenticate } from "@coinbase/onchainkit/minikit";
import sdk from "@farcaster/frame-sdk";
import { User } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";
import { useApiQuery } from "./use-api-query";
import { useAuthCheck } from "./use-auth-check";
import { useAccount } from "wagmi";

export const useSignIn = ({
  autoSignIn = false,
  onSuccess,
}: {
  autoSignIn?: boolean;
  onSuccess?: (user: User) => void;
}) => {
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
  const { address } = useAccount();

  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const isMiniApp = await sdk.isInMiniApp();
      if (!isMiniApp) {
        console.error("Not in mini app");
        throw new Error("Not in mini app");
      }
      let referrerFid: number | null = null;
      const result = await sdk.actions.signIn({
        nonce: Math.random().toString(36).substring(2),
        notBefore: new Date().toISOString(),
        expirationTime: new Date(
          Date.now() + MESSAGE_EXPIRATION_TIME
        ).toISOString(),
        acceptAuthAddress: true,
      });
      if (!result) {
        console.error("Sign in failed");
        throw new Error("Sign in failed");
      }

      const context = await sdk.context;
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature: result.signature,
          message: result.message,
          fid: context?.user?.fid,
          walletAddress: address,
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
  }, [onSuccess, refetchUser, signIn]);

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
