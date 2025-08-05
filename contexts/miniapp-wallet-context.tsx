import { getDefaultConfig } from "@daimo/pay";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { createConfig, useAccount, WagmiProvider } from "wagmi";
import { basePreconf } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

export const config = createConfig(
  getDefaultConfig({
    appName: "Squabble Game",
    connectors: [
      miniAppConnector(),
      coinbaseWallet({
        appName: "Squabble",
      }),
    ],
    chains: [basePreconf],
  }),
);

const queryClient = new QueryClient();

interface MiniAppWalletContextType {
  isCoinbaseWallet: boolean;
}

const MiniAppWalletContext = createContext<
  MiniAppWalletContextType | undefined
>(undefined);

export function useMiniAppWallet() {
  const context = useContext(MiniAppWalletContext);
  if (context === undefined) {
    throw new Error(
      "useMiniAppWallet must be used within a MiniAppWalletProvider",
    );
  }
  return context;
}

// Inner component that uses wagmi hooks
function WalletDetector({ children }: { children: React.ReactNode }) {
  const { connector, isConnected } = useAccount();
  const [isCoinbaseWallet, setIsCoinbaseWallet] = useState(false);

  useEffect(() => {
    if (isConnected && connector) {
      // Check if the connector is Coinbase Wallet
      const isInCoinbaseWallet = !!(
        window.ethereum?.isCoinbaseWallet ||
        window.ethereum?.isCoinbaseWalletExtension ||
        window.ethereum?.isCoinbaseWalletBrowser
      );
      setIsCoinbaseWallet(isInCoinbaseWallet);
    } else {
      setIsCoinbaseWallet(false);
    }
  }, [connector, isConnected]);

  return (
    <MiniAppWalletContext.Provider value={{ isCoinbaseWallet }}>
      {children}
    </MiniAppWalletContext.Provider>
  );
}

export default function MiniAppWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletDetector>{children}</WalletDetector>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
