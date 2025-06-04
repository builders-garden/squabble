import { getDefaultConfig } from "@daimo/pay";
import { farcasterFrame as miniAppConnector } from "@farcaster/frame-wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";

export const config = createConfig(
  getDefaultConfig({
    appName: "Squabble Game",
    connectors: [miniAppConnector()],
    chains: [base],
  })
);

const queryClient = new QueryClient();

export default function FrameWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
