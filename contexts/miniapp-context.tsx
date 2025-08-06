"use client";

import { type MiniAppContext as FarcasterMiniAppContext } from "@farcaster/miniapp-core/dist/context";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import WalletDetectorProvider from "./wallet-detector-context";

interface MiniAppContextType {
  isMiniAppReady: boolean;
  context: FarcasterMiniAppContext | null;
  setMiniAppReady: () => void;
  addMiniApp: () => Promise<unknown>;
}

export const MiniAppContext = createContext<MiniAppContextType | undefined>(
  undefined,
);

export function MiniAppProvider({
  addMiniAppOnLoad,
  children,
}: {
  addMiniAppOnLoad?: boolean;
  children: ReactNode;
}) {
  const [context, setContext] = useState<FarcasterMiniAppContext | null>(null);
  const [isMiniAppReady, setIsMiniAppReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setMiniAppReady = useCallback(async () => {
    try {
      await sdk.actions.ready();
      setIsMiniAppReady(true);

      const context = await sdk.context;
      if (context) {
        setContext(context as FarcasterMiniAppContext);
      } else {
        setError("Failed to load Farcaster context");
      }
    } catch (err) {
      console.error("SDK initialization error:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize SDK");
      setIsMiniAppReady(false);
    }
  }, []);

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady().then(() => {
        console.log("MiniApp loaded");
      });
    }
  }, [isMiniAppReady, setMiniAppReady]);

  const handleAddMiniApp = useCallback(async () => {
    try {
      const result = await sdk.actions.addMiniApp();
      if (result) {
        return result;
      }
      return null;
    } catch (error) {
      console.error("[error] adding farcaster miniapp", error);
      return null;
    }
  }, []);

  useEffect(() => {
    // on load, set the miniapp as ready
    if (isMiniAppReady && !context?.client?.added && addMiniAppOnLoad) {
      handleAddMiniApp();
    }
  }, [
    isMiniAppReady,
    context?.client?.added,
    handleAddMiniApp,
    addMiniAppOnLoad,
  ]);

  return (
    <MiniAppContext.Provider
      value={{
        isMiniAppReady,
        setMiniAppReady,
        addMiniApp: handleAddMiniApp,
        context,
      }}>
      <WalletDetectorProvider>{children}</WalletDetectorProvider>
    </MiniAppContext.Provider>
  );
}
