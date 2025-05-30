"use client";

import { AudioProvider } from "@/contexts/audio-context";
import { MiniAppProvider } from "@/contexts/miniapp-context";
import { SocketProvider } from "@/contexts/socket-context";
import { env } from "@/lib/env";
import { config } from "@/lib/wagmi/config";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { DaimoPayProvider } from "@daimo/pay";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { base } from "viem/chains";
import { WagmiProvider } from "wagmi";

const ErudaProvider = dynamic(
  () => import("../components/Eruda").then((c) => c.ErudaProvider),
  { ssr: false }
);

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErudaProvider>
      <SocketProvider>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <DaimoPayProvider>
              <MiniKitProvider
                projectId={env.NEXT_PUBLIC_MINIKIT_PROJECT_ID}
                notificationProxyUrl="/api/notification"
                chain={base}
              >
                <MiniAppProvider>
                  <AudioProvider>{children}</AudioProvider>
                </MiniAppProvider>
              </MiniKitProvider>
            </DaimoPayProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </SocketProvider>
    </ErudaProvider>
  );
}
