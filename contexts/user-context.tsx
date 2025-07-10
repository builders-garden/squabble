import { useApiMutation } from "@/hooks/use-api-mutation";
import { useApiQuery } from "@/hooks/use-api-query";
import { User } from "@prisma/client";
import { QueryObserverResult } from "@tanstack/react-query";
import posthog from "posthog-js";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMiniApp } from "./miniapp-context";

const UserProviderContext = createContext<
  | {
      user: {
        data: User | undefined;
        refetch: () => Promise<QueryObserverResult<User>>;
        isLoading: boolean;
        error: Error | null;
      };
      signIn: () => Promise<void>;
      isSigningIn: boolean;
      error: boolean;
    }
  | undefined
>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const useRegisteredUser = () => {
  const context = useContext(UserProviderContext);
  if (!context) {
    throw new Error("useRegisteredUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const { context } = useMiniApp();
  const [signInError, setSignInError] = useState(false);
  const { address } = useAccount();
  const [isSignedIn, setIsSignedIn] = useState(false);

  const {
    data: user,
    refetch: refetchUser,
    isLoading: isFetchingUser,
    error: userError,
  } = useApiQuery<User>({
    queryKey: ["user-query"],
    url: "/api/users/me",
    refetchOnWindowFocus: false,
    isProtected: true,
    retry: false,
    enabled: isSignedIn,
  });

  const { mutate: signIn, isPending: isSigningIn } = useApiMutation<{
    user: User;
  }>({
    // TODO: replace with /api/auth/sign-in when ready for PROD
    url: "/api/auth/fake-sign-in",
    method: "POST",
    body: (variables) => variables,
    onSuccess: (data) => {
      posthog.identify(data.user.fid.toString());
      setIsSignedIn(true);
    },
  });

  const handleSignIn = useCallback(async () => {
    try {
      console.log("handleSignIn");
      setSignInError(false);

      if (!context) {
        console.error("Not in mini app");
        throw new Error("Not in mini app");
      }

      const referrerFid =
        context.location?.type === "cast_embed"
          ? context.location.cast.fid
          : undefined;

      // TODO: add sdk.quickAuth.getToken()

      await signIn({
        fid: context.user.fid,
        referrerFid,
      });
    } catch {
      setSignInError(true);
    }
  }, [context, refetchUser]);

  // In case we are in a context, if the user is not there, sign the user in
  useEffect(() => {
    if (context && !isSignedIn && !isFetchingUser && address) {
      handleSignIn();
    }
  }, [context, handleSignIn, address]);

  const value = useMemo(() => {
    return {
      user: {
        data: user,
        refetch: refetchUser,
        isLoading: isFetchingUser,
        error: userError,
      },
      signIn: handleSignIn,
      isSigningIn: isSigningIn || isFetchingUser,
      error: signInError,
    };
  }, [
    user,
    isFetchingUser,
    userError,
    handleSignIn,
    isSigningIn,
    signInError,
    refetchUser,
  ]);

  return (
    <UserProviderContext.Provider value={value}>
      {children}
    </UserProviderContext.Provider>
  );
};
