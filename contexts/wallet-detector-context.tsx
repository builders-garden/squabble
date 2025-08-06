import { createContext, useContext, useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface WalletDetectorContextType {
  isCoinbaseWallet: boolean;
}

const WalletDetectorContext = createContext<
  WalletDetectorContextType | undefined
>(undefined);

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
    <WalletDetectorContext.Provider value={{ isCoinbaseWallet }}>
      {children}
    </WalletDetectorContext.Provider>
  );
}

export default function WalletDetectorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WalletDetector>{children}</WalletDetector>;
}

export function useWalletDetector() {
  const context = useContext(WalletDetectorContext);
  if (context === undefined) {
    throw new Error(
      "useWalletDetector must be used within a WalletDetectorProvider",
    );
  }
  return context;
}
