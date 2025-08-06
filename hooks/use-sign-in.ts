import sdk from "@farcaster/miniapp-sdk";
import { User } from "@prisma/client";
import ky from "ky";
import posthog from "posthog-js";
import { useCallback, useEffect, useState } from "react";
import { useAuthCheck } from "./use-auth-check";
import { useMiniApp } from "./use-miniapp";
import { useUser } from "./use-user";

export const useSignIn = ({
  autoSignIn = false,
  onSuccess,
}: {
  autoSignIn?: boolean;
  onSuccess?: (user: User) => void;
}) => {
  const { context, isMiniAppReady } = useMiniApp();
  const { setUser } = useUser();
  const { user: authUser, isAuthenticated } = useAuthCheck();

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!context) {
        if (isMiniAppReady) {
          console.error("Not in mini app");
          throw new Error("No context found");
        }
        return;
      }

      if (isAuthenticated && authUser) {
        console.log("Already signed in", authUser);
        setIsSignedIn(true);
        setUser(authUser);
        onSuccess?.(authUser);
        posthog.identify(authUser.fid.toString());
        return;
      }

      const { token } = await sdk.quickAuth.getToken();
      if (!token) {
        console.error("Sign in failed, no farcaster token");
        throw new Error("Sign in failed");
      }

      const referrerFid =
        context.location?.type === "cast_embed"
          ? context.location.cast.author.fid
          : null;

      const data = await ky
        .post("/api/auth/sign-in", {
          credentials: "include",
          json: {
            token,
            fid: context.user.fid,
            referrerFid,
          },
        })
        .json<{ success: boolean; error?: string; user?: User }>();

      if (!data.success) {
        console.error("Sign in failed", data.error);
        throw new Error(data.error ?? "Sign in failed");
      }
      if (!data.user) {
        console.error("User not found");
        throw new Error("User not found");
      }

      setIsSignedIn(true);
      setUser(data.user);
      onSuccess?.(data.user);
      posthog.identify(context.user.fid.toString());
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed";
      console.error("Sign in failed", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, authUser]);

  useEffect(() => {
    // if autoSignIn is true, sign in automatically on mount
    if (autoSignIn && !isSignedIn) {
      handleSignIn();
    }
  }, [autoSignIn, handleSignIn, isSignedIn]);

  return { signIn: handleSignIn, isSignedIn, isLoading, error };
};
